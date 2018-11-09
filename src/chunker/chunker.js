import Page from "./page";
import ContentParser from "./parser";
import EventEmitter from "event-emitter";
import Hook from "../utils/hook";
import Queue from "../utils/queue";
import {
	needsBreakBefore,
	needsBreakAfter
} from "../utils/dom";
import {
	requestIdleCallback,
	defer
} from "../utils/utils";

const MAX_PAGES = false;

const TEMPLATE = `<div class="pagedjs_page">
	<div class="pagedjs_margin-top-left-corner-holder">
		<div class="pagedjs_margin pagedjs_margin-top-left-corner"><div class="pagedjs_margin-content"></div></div>
	</div>
	<div class="pagedjs_margin-top">
		<div class="pagedjs_margin pagedjs_margin-top-left"><div class="pagedjs_margin-content"></div></div>
		<div class="pagedjs_margin pagedjs_margin-top-center"><div class="pagedjs_margin-content"></div></div>
		<div class="pagedjs_margin pagedjs_margin-top-right"><div class="pagedjs_margin-content"></div></div>
	</div>
	<div class="pagedjs_margin-top-right-corner-holder">
		<div class="pagedjs_margin pagedjs_margin-top-right-corner"><div class="pagedjs_margin-content"></div></div>
	</div>
	<div class="pagedjs_margin-right">
		<div class="pagedjs_margin pagedjs_margin-right-top"><div class="pagedjs_margin-content"></div></div>
		<div class="pagedjs_margin pagedjs_margin-right-middle"><div class="pagedjs_margin-content"></div></div>
		<div class="pagedjs_margin pagedjs_margin-right-bottom"><div class="pagedjs_margin-content"></div></div>
	</div>
	<div class="pagedjs_margin-left">
		<div class="pagedjs_margin pagedjs_margin-left-top"><div class="pagedjs_margin-content"></div></div>
		<div class="pagedjs_margin pagedjs_margin-left-middle"><div class="pagedjs_margin-content"></div></div>
		<div class="pagedjs_margin pagedjs_margin-left-bottom"><div class="pagedjs_margin-content"></div></div>
	</div>
	<div class="pagedjs_margin-bottom-left-corner-holder">
		<div class="pagedjs_margin pagedjs_margin-bottom-left-corner"><div class="pagedjs_margin-content"></div></div>
	</div>
	<div class="pagedjs_margin-bottom">
		<div class="pagedjs_margin pagedjs_margin-bottom-left"><div class="pagedjs_margin-content"></div></div>
		<div class="pagedjs_margin pagedjs_margin-bottom-center"><div class="pagedjs_margin-content"></div></div>
		<div class="pagedjs_margin pagedjs_margin-bottom-right"><div class="pagedjs_margin-content"></div></div>
	</div>
	<div class="pagedjs_margin-bottom-right-corner-holder">
		<div class="pagedjs_margin pagedjs_margin-bottom-right-corner"><div class="pagedjs_margin-content"></div></div>
	</div>
	<div class="pagedjs_area">
		<div class="pagedjs_page_content">

		</div>
	</div>
</div>`;

/**
 * Chop up text into flows
 * @class
 */
class Chunker {
	constructor(content, renderTo) {
		// this.preview = preview;

		this.hooks = {};
		this.hooks.beforeParsed = new Hook(this);
		this.hooks.afterParsed = new Hook(this);
		this.hooks.beforePageLayout = new Hook(this);
		this.hooks.layout = new Hook(this);
		this.hooks.renderNode = new Hook(this);
		this.hooks.layoutNode = new Hook(this);
		this.hooks.overflow = new Hook(this);
		this.hooks.afterPageLayout = new Hook(this);
		this.hooks.afterRendered = new Hook(this);

		this.pages = [];
		this._total = 0;

		this.q = new Queue(this);
		this.stopped = false;

		this.content = content;

		if (content) {
			this.flow(content, renderTo);
		}
	}

	setup(renderTo) {
		this.pagesArea = document.createElement("div");
		this.pagesArea.classList.add("pagedjs_pages");

		if (renderTo) {
			renderTo.appendChild(this.pagesArea);
		} else {
			document.querySelector("body").appendChild(this.pagesArea);
		}

		this.pageTemplate = document.createElement("template");
		this.pageTemplate.innerHTML = TEMPLATE;

	}

	async flow(content, renderTo) {
		let parsed;

		await this.hooks.beforeParsed.trigger(content, this);

		parsed = new ContentParser(content);

		this.source = parsed;
		this.breakToken = undefined;

		if (this.pagesArea && this.pageTemplate) {
			this.q.clear();
			this.removePages();
		} else {
			this.setup(renderTo);
		}

		this.emit("rendering", content);

		await this.hooks.afterParsed.trigger(parsed, this);

		await this.loadFonts();

		let rendered = await this.render(parsed, this.breakToken);
		while (rendered.canceled) {
			this.start();
			rendered = await this.render(parsed, this.breakToken);
		}

		this.rendered = true;

		await this.hooks.afterRendered.trigger(this.pages, this);

		this.emit("rendered", this.pages);

		return this;
	}

	// oversetPages() {
	// 	let overset = [];
	// 	for (let i = 0; i < this.pages.length; i++) {
	// 		let page = this.pages[i];
	// 		if (page.overset) {
	// 			overset.push(page);
	// 			// page.overset = false;
	// 		}
	// 	}
	// 	return overset;
	// }
	//
	// async handleOverset(parsed) {
	// 	let overset = this.oversetPages();
	// 	if (overset.length) {
	// 		console.log("overset", overset);
	// 		let index = this.pages.indexOf(overset[0]) + 1;
	// 		console.log("INDEX", index);
	//
	// 		// Remove pages
	// 		// this.removePages(index);
	//
	// 		// await this.render(parsed, overset[0].overset);
	//
	// 		// return this.handleOverset(parsed);
	// 	}
	// }

	async render(parsed, startAt) {
		let renderer = this.layout(parsed, startAt);

		let done = false;
		let result;

		while (!done) {
			result = await this.q.enqueue(async () => { return this.renderOnIdle(renderer) });
			done = result.done;
		}

		return result;
	}

	start() {
		this.rendered = false;
		this.stopped = false;
	}

	stop() {
		this.stopped = true;
		this.q.clear();
	}

	renderOnIdle(renderer) {
		return new Promise(resolve => {
			requestIdleCallback(async () => {
				if (this.stopped) {
					return resolve({ done: true, canceled: true });
				}
				let result = await renderer.next();
				if (this.stopped) {
					resolve({ done: true, canceled: true });
				} else {
					resolve(result);
				}
			});
		});
	}

	async handleBreaks(node) {
		let currentPage = this.total + 1;
		let currentPosition = currentPage % 2 === 0 ? "left" : "right";
		// TODO: Recto and Verso should reverse for rtl languages
		let currentSide = currentPage % 2 === 0 ? "verso" : "recto";
		let previousBreakAfter;
		let breakBefore;
		let page;

		if (currentPage === 1) {
			return;
		}

		if (node &&
				typeof node.dataset !== "undefined" &&
				typeof node.dataset.previousBreakAfter !== "undefined") {
			previousBreakAfter = node.dataset.previousBreakAfter;
		}

		if (node &&
				typeof node.dataset !== "undefined" &&
				typeof node.dataset.breakBefore !== "undefined") {
			breakBefore = node.dataset.breakBefore;
		}

		if( previousBreakAfter &&
				(previousBreakAfter === "left" || previousBreakAfter === "right") &&
				previousBreakAfter !== currentPosition) {
			page = this.addPage(true);
		} else if( previousBreakAfter &&
				(previousBreakAfter === "verso" || previousBreakAfter === "recto") &&
				previousBreakAfter !== currentSide) {
			page = this.addPage(true);
		} else if( breakBefore &&
				(breakBefore === "left" || breakBefore === "right") &&
				breakBefore !== currentPosition) {
			page = this.addPage(true);
		} else if( breakBefore &&
				(breakBefore === "verso" || breakBefore === "recto") &&
				breakBefore !== currentSide) {
			page = this.addPage(true);
		}

		if (page) {
			await this.hooks.beforePageLayout.trigger(page, undefined, undefined, this);
			this.emit("page", page);
			// await this.hooks.layout.trigger(page.element, page, undefined, this);
			await this.hooks.afterPageLayout.trigger(page.element, page, undefined, this);
			this.emit("renderedPage", page);
		}
	}

	async *layout(content, startAt) {
		let breakToken = startAt || false;

		while (breakToken !== undefined && (MAX_PAGES ? this.total < MAX_PAGES : true)) {

			if (breakToken && breakToken.node) {
				await this.handleBreaks(breakToken.node);
			} else {
				await this.handleBreaks(content.firstChild);
			}

			let page = this.addPage();

			await this.hooks.beforePageLayout.trigger(page, content, breakToken, this);
			this.emit("page", page);

			// Layout content in the page, starting from the breakToken
			breakToken = await page.layout(content, breakToken);

			await this.hooks.afterPageLayout.trigger(page.element, page, breakToken, this);
			this.emit("renderedPage", page);

			yield breakToken;

			// Stop if we get undefined, showing we have reached the end of the content
		}
	}

	removePages(fromIndex=0) {

		if (fromIndex >= this.pages.length) {
			return;
		}

		// Remove pages
		for (let i = fromIndex; i < this.pages.length; i++) {
			this.pages[i].destroy();
		}

		if (fromIndex > 0) {
			this.pages.splice(fromIndex);
		} else {
			this.pages = [];
		}
	}

	addPage(blank) {
		let lastPage = this.pages[this.pages.length - 1];
		// Create a new page from the template
		let page = new Page(this.pagesArea, this.pageTemplate, blank, this.hooks);
		let total = this.pages.push(page);

		// Create the pages
		page.create(undefined, lastPage && lastPage.element);

		page.index(this.total);

		if (!blank) {
			// Listen for page overflow
			page.onOverflow((overflowToken) => {
				// console.log("overflow on", page.id, overflowToken);
				let index = this.pages.indexOf(page) + 1;

				// Stop the rendering
				this.stop();

				// Set the breakToken to resume at
				this.breakToken = overflowToken;

				// Remove pages
				this.removePages(index);

				this.q.enqueue(async () => {

					if (this.rendered) {
						this.start();
						this.render(this.source, this.breakToken);
					}

				});
			});

			page.onUnderflow((overflowToken) => {
				// console.log("underflow on", page.id, overflowToken);

				// page.append(this.source, overflowToken);

			});
		}

		this.total = this.pages.length;

		return page;
	}
	/*
	insertPage(index, blank) {
		let lastPage = this.pages[index];
		// Create a new page from the template
		let page = new Page(this.pagesArea, this.pageTemplate, blank, this.hooks);

		let total = this.pages.splice(index, 0, page);

		// Create the pages
		page.create(undefined, lastPage && lastPage.element);

		page.index(index + 1);

		for (let i = index + 2; i < this.pages.length; i++) {
			this.pages[i].index(i);
		}

		if (!blank) {
			// Listen for page overflow
			page.onOverflow((overflowToken) => {
				if (total < this.pages.length) {
					this.pages[total].layout(this.source, overflowToken);
				} else {
					let newPage = this.addPage();
					newPage.layout(this.source, overflowToken);
				}
			});

			page.onUnderflow(() => {
				// console.log("underflow on", page.id);
			});
		}

		this.total += 1;

		return page;
	}
	*/

	get total() {
		return this._total;
	}

	set total(num) {
		this.pagesArea.style.setProperty('--page-count', num);
		this._total = num;
	}

	loadFonts() {
		let fontPromises = [];
		for (let fontFace of document.fonts.values()) {
			if (fontFace.status !== "loaded") {
				fontPromises.push(fontFace.load());
			}
		}
		return Promise.all(fontPromises);
	}

	destroy() {
		this.pagesArea.remove()
		this.pageTemplate.remove();
	}

}

EventEmitter(Chunker.prototype);

export default Chunker;

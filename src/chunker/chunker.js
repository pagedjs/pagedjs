import Page from "./page";
import ContentParser from "./parser";
import EventEmitter from "event-emitter";
import Hook from "../utils/hook";
import {
	needsBreakBefore,
	needsBreakAfter
} from "../utils/dom";
const MAX_PAGES = false;

const TEMPLATE = `<div class="pagedjs_page">
	<div class="pagedjs_margin-top">
		<div class="pagedjs_margin-top-left-corner"><div class="pagedjs_margin-content"></div></div>
		<div class="pagedjs_margin-top-left"><div class="pagedjs_margin-content"></div></div>
		<div class="pagedjs_margin-top-center"><div class="pagedjs_margin-content"></div></div>
		<div class="pagedjs_margin-top-right"><div class="pagedjs_margin-content"></div></div>
		<div class="pagedjs_margin-top-right-corner"><div class="pagedjs_margin-content"></div></div>
	</div>
	<div class="pagedjs_margin-right">
		<div class="pagedjs_margin-right-top"><div class="pagedjs_margin-content"></div></div>
		<div class="pagedjs_margin-right-middle"><div class="pagedjs_margin-content"></div></div>
		<div class="pagedjs_margin-right-bottom"><div class="pagedjs_margin-content"></div></div>
	</div>
	<div class="pagedjs_margin-left">
		<div class="pagedjs_margin-left-top"><div class="pagedjs_margin-content"></div></div>
		<div class="pagedjs_margin-left-middle"><div class="pagedjs_margin-content"></div></div>
		<div class="pagedjs_margin-left-bottom"><div class="pagedjs_margin-content"></div></div>
	</div>
	<div class="pagedjs_margin-bottom">
		<div class="pagedjs_margin-bottom-left-corner"><div class="pagedjs_margin-content"></div></div>
		<div class="pagedjs_margin-bottom-left"><div class="pagedjs_margin-content"></div></div>
		<div class="pagedjs_margin-bottom-center"><div class="pagedjs_margin-content"></div></div>
		<div class="pagedjs_margin-bottom-right"><div class="pagedjs_margin-content"></div></div>
		<div class="pagedjs_margin-bottom-right-corner"><div class="pagedjs_margin-content"></div></div>
	</div>
	<div class="pagedjs_area">
		<div class="pagedjs_page_content">

		</div>
	</div>
</div>`;

const _requestIdleCallback = 'requestIdleCallback' in window ? requestIdleCallback : requestAnimationFrame;

/**
 * Chop up text into flows
 * @class
 */
class Chunker {
	constructor(content, renderTo) {
		// this.preview = preview;

		this.hooks = {};
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
		let parsed = new ContentParser(content);

		this.setup(renderTo);

		this.emit("rendering", content);

		await this.hooks.afterParsed.trigger(parsed, this);

		await this.render(parsed, renderTo);

		await this.hooks.afterRendered.trigger(this.pages, this);

		this.emit("rendered", this.pages);

		return this;
	}

	async render(parsed, renderTo) {
		let renderer = this.layout(parsed);

		let done = false;
		let result;

		while (!done) {
			result = await this.renderOnIdle(renderer);
			done = result.done;
		}

		return this;
	}

	renderOnIdle(renderer) {
		return new Promise(resolve => {
			_requestIdleCallback(() => {
				let result = renderer.next();
				resolve(result);
			});
		});
	}

	handleBreaks(node) {
		let currentPage = this.total + 1;
		let currentPosition = currentPage % 2 === 0 ? "left" : "right";
		// TODO: Recto and Verso should reverse for rtl languages
		let currentSide = currentPage % 2 === 0 ? "verso" : "recto";
		let previousBreakAfter;
		let breakBefore;

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
			this.addPage(true);
		} else if( previousBreakAfter &&
				(previousBreakAfter === "verso" || previousBreakAfter === "recto") &&
				previousBreakAfter !== currentSide) {
			this.addPage(true);
		} else if( breakBefore &&
				(breakBefore === "left" || breakBefore === "right") &&
				breakBefore !== currentPosition) {
			this.addPage(true);
		} else if( breakBefore &&
				(breakBefore === "verso" || breakBefore === "recto") &&
				breakBefore !== currentSide) {
			this.addPage(true);
		}
	}

	async *layout(content) {
		let breakToken = false;

		while (breakToken !== undefined && (MAX_PAGES ? this.total < MAX_PAGES : true)) {

			if (breakToken && breakToken.node) {
				this.handleBreaks(breakToken.node);
			} else {
				this.handleBreaks(content.firstChild);
			}

			let page = this.addPage();

			await this.hooks.beforePageLayout.trigger(page, content, breakToken, this);
			this.emit("page", page);

			// Layout content in the page, starting from the breakToken
			breakToken = page.layout(content, breakToken);

			await this.hooks.layout.trigger(page.element, page, breakToken, this);

			await this.hooks.afterPageLayout.trigger(page.element, page, breakToken, this);
			this.emit("renderedPage", page);

			yield breakToken;

			// Stop if we get undefined, showing we have reached the end of the content
		}

		this.rendered = true;
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
			page.onOverflow((overflow) => {
				_requestIdleCallback(() => {
					let index = this.pages.indexOf(page) + 1;
					if (this.pages[index].breakBefore || this.pages[index].previousBreakAfter) {
						let newPage = this.insertPage(index - 1);
						newPage.prepend(overflow);
					} else if (index < this.pages.length) {
						this.pages[index].prepend(overflow);
					} else {
						let newPage = this.addPage();
						newPage.prepend(overflow);
					}
				})
			});

			page.onUnderflow(() => {
				// console.log("underflow on", page.id);
			});
		}

		this.total += 1;

		return page;
	}

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
			page.onOverflow((overflow) => {
				_requestIdleCallback(() => {
					if (total < this.pages.length) {
						this.pages[total].prepend(overflow);
					} else {
						let newPage = this.addPage();
						newPage.prepend(overflow);
					}
				})
			});

			page.onUnderflow(() => {
				// console.log("underflow on", page.id);
			});
		}

		this.total += 1;

		return page;
	}

	get total() {
		return this._total;
	}

	set total(num) {
		this.pagesArea.style.setProperty('--page-count', num);
		this._total = num;
	}

	destroy() {
		this.pagesArea.remove()
		this.pageTemplate.remove();
	}

}

EventEmitter(Chunker.prototype);

export default Chunker;

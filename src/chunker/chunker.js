import Page from "./page.js";
import ContentParser from "./parser.js";
import EventEmitter from "event-emitter";
import Hook from "../utils/hook.js";
import Queue from "../utils/queue.js";
import { requestIdleCallback } from "../utils/utils.js";

const MAX_PAGES = null;
const MAX_LAYOUTS = false;

const TEMPLATE = `
<div class="pagedjs_page">
	<div class="pagedjs_sheet">
		<div class="pagedjs_bleed pagedjs_bleed-top">
			<div class="pagedjs_marks-crop"></div>
			<div class="pagedjs_marks-middle">
				<div class="pagedjs_marks-cross"></div>
			</div>
			<div class="pagedjs_marks-crop"></div>
		</div>
		<div class="pagedjs_bleed pagedjs_bleed-bottom">
			<div class="pagedjs_marks-crop"></div>
			<div class="pagedjs_marks-middle">
				<div class="pagedjs_marks-cross"></div>
			</div>		<div class="pagedjs_marks-crop"></div>
		</div>
		<div class="pagedjs_bleed pagedjs_bleed-left">
			<div class="pagedjs_marks-crop"></div>
			<div class="pagedjs_marks-middle">
				<div class="pagedjs_marks-cross"></div>
			</div>		<div class="pagedjs_marks-crop"></div>
		</div>
		<div class="pagedjs_bleed pagedjs_bleed-right">
			<div class="pagedjs_marks-crop"></div>
			<div class="pagedjs_marks-middle">
				<div class="pagedjs_marks-cross"></div>
			</div>
			<div class="pagedjs_marks-crop"></div>
		</div>
		<div class="pagedjs_pagebox">
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
				<div class="pagedjs_page_content"></div>
				<div class="pagedjs_footnote_area">
					<div class="pagedjs_footnote_content pagedjs_footnote_empty">
						<div class="pagedjs_footnote_inner_content"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>`;

/**
 * The Chunker class is responsible for processing and paginating HTML content into individual page layouts.
 * It manages rendering, page flow, break handling, overflow detection, and layout cycles.
 *
 * @class
 */

class Chunker {
	/**
	 * Create a new Chunker instance.
	 *
	 * @param {HTMLElement|Document} content - The DOM content to be paginated.
	 * @param {HTMLElement} [renderTo] - Optional container element to render pages into.
	 * @param {Object} [options={}] - Configuration options.
	 * @property {Object} hooks - Collection of lifecycle hooks.
	 * @property {Page[]} pages - Array of rendered pages.
	 * @property {number} total - Total number of pages rendered.
	 * @property {boolean} stopped - Whether rendering is currently stopped.
	 * @property {boolean} rendered - Whether rendering has completed.
	 * @property {Queue} q - Internal render queue.
	 * @property {HTMLElement|Document} content - The original content passed to the chunker.
	 * @property {Object} modifiedRules - Map of modified stylesheets during rendering.
	 * @property {number[]} charsPerBreak - Characters per page break for estimation.
	 * @property {number} maxChars - Estimated maximum characters per page.
	 */
	constructor(content, renderTo, options) {
		// this.preview = preview;

		this.settings = options || {};

		this.hooks = {};
		this.hooks.beforeParsed = new Hook(this);
		this.hooks.filter = new Hook(this);
		this.hooks.afterParsed = new Hook(this);
		this.hooks.beforePageLayout = new Hook(this);
		this.hooks.onPageLayout = new Hook(this);
		this.hooks.layout = new Hook(this);
		this.hooks.renderNode = new Hook(this);
		this.hooks.layoutNode = new Hook(this);
		this.hooks.onOverflow = new Hook(this);
		this.hooks.afterOverflowRemoved = new Hook(this);
		this.hooks.afterOverflowAdded = new Hook(this);
		this.hooks.onBreakToken = new Hook();
		this.hooks.beforeRenderResult = new Hook(this);
		this.hooks.afterPageLayout = new Hook(this);
		this.hooks.finalizePage = new Hook(this);
		this.hooks.afterRendered = new Hook(this);

		this.pages = [];
		this.total = 0;

		this.q = new Queue(this);
		this.stopped = false;
		this.rendered = false;

		this.content = content;

		this.modifiedRules = {};

		this.charsPerBreak = [];
		this.maxChars;

		if (content) {
			this.flow(content, renderTo);
		}
	}

	/**
	 * Sets up the page container and page template structure.
	 *
	 * @param {HTMLElement} renderTo - The DOM node to which pages should be rendered.
	 */
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

	/**
	 * Gathers and records rules that should be disabled during rendering.
	 */
	rulesToDisable = ["breakInside", "overflow", "overflowX", "overflowY"];

	recordRulesToDisable() {
		for (var i in document.styleSheets) {
			let sheet = document.styleSheets[i];
			for (var j in sheet.cssRules) {
				let rule = sheet.cssRules.item(j);
				if (rule && rule.style) {
					for (var k in this.rulesToDisable) {
						let skip = false;
						let disable = this.rulesToDisable[k];
						let attribName = disable;
						if (typeof disable == "object") {
							attribName = Object.keys(disable)[0];
							let value = disable[attribName];
							skip =
								!rule.style[attribName] || rule.style[attribName] !== value;
						} else {
							skip = !rule.style[attribName];
						}
						if (!skip) {
							if (!this.modifiedRules[attribName]) {
								this.modifiedRules[attribName] = [];
							}
							if (!this.modifiedRules[attribName][rule.style[attribName]]) {
								this.modifiedRules[attribName][rule.style[attribName]] = [];
							}
							this.modifiedRules[attribName][rule.style[attribName]].push(rule);
						}
					}
				}
			}
		}
	}

	/**
	 * Disables specific CSS rules that may interfere with rendering.
	 *
	 * @param {HTMLElement} rendered - The rendered content container.
	 */
	disableRules(rendered) {
		for (var i in this.modifiedRules) {
			for (var j in this.modifiedRules[i]) {
				for (var k in this.modifiedRules[i][j]) {
					let rule = this.modifiedRules[i][j][k];
					rule.style[i] = "";
					let nodes = rendered.querySelectorAll(rule.selectorText);
					nodes.forEach((node) => {
						let attribName = i.substring(0, 1).toUpperCase() + i.substring(1);
						node.dataset[`original${attribName}`] = j;
					});
				}
			}
		}
	}

	/**
	 * Re-enables the CSS rules that were previously disabled.
	 *
	 * @param {HTMLElement} rendered - The rendered content container.
	 */
	enableRules(rendered) {
		for (var i in this.modifiedRules) {
			for (var j in this.modifiedRules[i]) {
				for (var k in this.modifiedRules[i][j]) {
					let rule = this.modifiedRules[i][j][k];
					rule.style[i] = j;
					let nodes = rendered.querySelectorAll(rule.selectorText);
					nodes.forEach((node) => {
						let attribName = i.substring(0, 1).toUpperCase() + i.substring(2);
						delete node.dataset[`original${attribName}`];
					});
				}
			}
		}
	}

	/**
	 * Starts the chunking and rendering process for the given content.
	 *
	 * @async
	 * @param {HTMLElement|Document} content - Content to be paginated.
	 * @param {HTMLElement} renderTo - Element to render into.
	 * @returns {Promise<Chunker>} - Returns itself once rendering is complete.
	 */
	async flow(content, renderTo) {
		let parsed;

		await this.hooks.beforeParsed.trigger(content, this);

		if (content) {
			this.recordRulesToDisable();
			this.disableRules(content);
		}

		parsed = new ContentParser(content);

		this.hooks.filter.triggerSync(parsed);

		this.source = parsed;
		this.breakToken = undefined;

		if (this.pagesArea && this.pageTemplate) {
			this.q.clear();
			this.removePages();
		} else {
			this.setup(renderTo);
		}

		this.emit("rendering", parsed);

		await this.hooks.afterParsed.trigger(parsed, this);

		await this.loadFonts();

		let rendered = await this.render(parsed, this.breakToken);
		while (rendered.canceled) {
			this.start();
			rendered = await this.render(parsed, this.breakToken);
		}

		this.rendered = true;
		this.pagesArea.style.setProperty("--pagedjs-page-count", this.total);

		await this.hooks.afterRendered.trigger(this.pages, this);

		this.emit("rendered", this.pages);

		this.enableRules(content);

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

	/**
	 * Renders the parsed html into paginated content and adds references (UUID data-ref attributes)
	 * 
	 * @param {HTML} parsed - parsed html content with data-refs for later use
	 * @param {Element} startAt - HTML node to start rendering
	 * @returns Pages
	 */
	async render(parsed, startAt) {
		let renderer = this.layout(parsed, startAt);

		let done = false;
		let result;

		let loops = 0;
		while (!done) {
			result = await this.q.enqueue(() => {
				return this.renderAsync(renderer);
			});
			done = result.done;
			if (MAX_LAYOUTS) {
				loops += 1;
				if (loops >= MAX_LAYOUTS) {
					this.stop();
					break;
				}
			}
		}

		return result;
	}
	/**
	 * Resets the rendering state.
	 */
	start() {
		this.rendered = false;
		this.stopped = false;
	}

	/**
	 * Stop the rendering process.
	 */
	stop() {
		this.stopped = true;
		// this.q.clear();
	}
	/**
	 * Renders a chunk of content when the browser is idle.
	 *
	 * @param {AsyncGenerator} renderer - The renderer iterator.
	 * @returns {Promise<Object>} - Result of rendering.
	 */
	renderOnIdle(renderer) {
		return new Promise((resolve) => {
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
	/**
	 * Performs one asynchronous rendering step.
	 *
	 * @param {AsyncGenerator} renderer - The renderer iterator.
	 * @returns {Promise<Object>} - Result of rendering.
	 */
	async renderAsync(renderer) {
		if (this.stopped) {
			return { done: true, canceled: true };
		}
		let result = await renderer.next();
		if (this.stopped) {
			return { done: true, canceled: true };
		} else {
			return result;
		}
	}

	/**
	 * Handling page breaks and adds new Pages if required
	 * 
	 * @param {Element} node - breaking node 
	 * @param {bool} force - force page break
	 * @returns {null}
	 */
	async handleBreaks(node, force) {
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

		if (
			node &&
			typeof node.dataset !== "undefined" &&
			typeof node.dataset.previousBreakAfter !== "undefined"
		) {
			previousBreakAfter = node.dataset.previousBreakAfter;
		}

		if (
			node &&
			typeof node.dataset !== "undefined" &&
			typeof node.dataset.breakBefore !== "undefined"
		) {
			breakBefore = node.dataset.breakBefore;
		}

		if (force) {
			page = this.addPage(true);
		} else if (
			previousBreakAfter &&
			(previousBreakAfter === "left" || previousBreakAfter === "right") &&
			previousBreakAfter !== currentPosition
		) {
			page = this.addPage(true);
		} else if (
			previousBreakAfter &&
			(previousBreakAfter === "verso" || previousBreakAfter === "recto") &&
			previousBreakAfter !== currentSide
		) {
			page = this.addPage(true);
		} else if (
			breakBefore &&
			(breakBefore === "left" || breakBefore === "right") &&
			breakBefore !== currentPosition
		) {
			page = this.addPage(true);
		} else if (
			breakBefore &&
			(breakBefore === "verso" || breakBefore === "recto") &&
			breakBefore !== currentSide
		) {
			page = this.addPage(true);
		}

		if (page) {
			await this.hooks.beforePageLayout.trigger(
				page,
				undefined,
				undefined,
				this,
			);
			this.emit("page", page);
			// await this.hooks.layout.trigger(page.element, page, undefined, this);
			await this.hooks.afterPageLayout.trigger(
				page.element,
				page,
				undefined,
				this,
			);
			await this.hooks.finalizePage.trigger(
				page.element,
				page,
				undefined,
				this,
			);
			this.emit("renderedPage", page);
		}
	}
	/**
	 * Generator that performs the layout step-by-step, yielding break tokens.
	 *
	 * @async
	 * @param {Document|HTMLElement} content - The parsed content.
	 * @param {Object} [startAt] - Optional starting break token.
	 * @yields {Object} - The current break token.
	 */
	async *layout(content, startAt) {
		let breakToken = startAt || false;
		let page, prevPage, prevNumPages;

		while (
			breakToken !== undefined &&
			(MAX_PAGES ? this.total < MAX_PAGES : true)
		) {
			let range;
			if (
				page &&
				page.area.firstElementChild &&
				page.area.firstElementChild.childElementCount
			) {
				range = document.createRange();
				range.selectNode(page.area.firstElementChild.childNodes[0]);
				range.setEndAfter(page.area.firstElementChild.lastChild);
			}

			let addedExtra = false;
			let emptyBody = !range || !range.getBoundingClientRect().height;
			let emptyFootnotes =
				!page ||
				!page.footnotesArea.firstElementChild ||
				!page.footnotesArea.firstElementChild.childElementCount ||
				!page.footnotesArea.firstElementChild.firstElementChild.getBoundingClientRect()
					.height;
			let emptyPage = emptyBody && emptyFootnotes;

			prevNumPages = this.total;

			if (!page || !emptyPage) {
				if (breakToken) {
					if (breakToken.overflow.length && breakToken.overflow[0].node) {
						// Overflow.
						await this.handleBreaks(breakToken.overflow[0].node);
					} else {
						await this.handleBreaks(breakToken.node);
					}
				} else {
					await this.handleBreaks(content.firstChild);
				}
			}

			addedExtra = this.total != prevNumPages;

			// Don't add a page if we have a forced break now and we just
			// did a break due to overflow but have nothing displayed on
			// the current page, unless there's overflow and we're finished.
			if (!page || addedExtra || !emptyPage) {
				this.addPage();
			}

			page = this.pages[this.total - 1];

			await this.hooks.beforePageLayout.trigger(
				page,
				content,
				breakToken,
				this,
			);
			this.emit("page", page);

			// Layout content in the page, starting from the breakToken.
			breakToken = await page.layout(content, breakToken, prevPage);

			await this.hooks.afterPageLayout.trigger(
				page.element,
				page,
				breakToken,
				this,
			);
			await this.hooks.finalizePage.trigger(
				page.element,
				page,
				undefined,
				this,
			);
			this.emit("renderedPage", page);

			prevPage = page.wrapper;

			this.recoredCharLength(page.wrapper.textContent.length);

			yield breakToken;
		}
	}
	/**
	 * Records the number of characters per page for average calculation.
	 *
	 * @param {number} length - Number of characters on the page.
	 */
	recoredCharLength(length) {
		if (length === 0) {
			return;
		}

		this.charsPerBreak.push(length);

		// Keep the length of the last few breaks
		if (this.charsPerBreak.length > 4) {
			this.charsPerBreak.shift();
		}

		this.maxChars =
			this.charsPerBreak.reduce((a, b) => a + b, 0) / this.charsPerBreak.length;
	}

	/**
	 * Removes rendered pages starting from the specified index.
	 *
	 * @param {number} [fromIndex=0] - Index to start removing pages from.
	 */
	removePages(fromIndex = 0) {
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

		this.total = this.pages.length;
	}
	/**
	 * Adds a new page to the render flow.
	 *
	 * @param {boolean} [blank=false] - Whether to add a blank page.
	 * @returns {Page} - The newly added Page instance.
	 */
	addPage(blank) {
		let lastPage = this.pages[this.pages.length - 1];
		// Create a new page from the template
		let page = new Page(
			this.pagesArea,
			this.pageTemplate,
			blank,
			this.hooks,
			this.settings,
		);

		this.pages.push(page);

		// Create the pages
		page.create(undefined, lastPage && lastPage.element);

		page.index(this.total);

		if (!blank) {
			// Listen for page overflow
			page.onOverflow((overflowToken) => {
				console.warn("overflow on", page.id, overflowToken);

				// Only reflow while rendering
				if (this.rendered) {
					return;
				}

				let index = this.pages.indexOf(page) + 1;

				// Stop the rendering
				this.stop();

				// Set the breakToken to resume at
				this.breakToken = overflowToken;

				// Remove pages
				this.removePages(index);

				if (this.rendered === true) {
					this.rendered = false;

					this.q.enqueue(async () => {
						this.start();

						await this.render(this.source, this.breakToken);

						this.rendered = true;
					});
				}
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
	/**
	 * Clones an existing page and appends it to the document.
	 *
	 * @async
	 * @param {Page} originalPage - The page to clone.
	 */
	async clonePage(originalPage) {
		let lastPage = this.pages[this.pages.length - 1];

		let page = new Page(this.pagesArea, this.pageTemplate, false, this.hooks);

		this.pages.push(page);

		// Create the pages
		page.create(undefined, lastPage && lastPage.element);

		page.index(this.total);

		await this.hooks.beforePageLayout.trigger(page, undefined, undefined, this);
		this.emit("page", page);

		for (const className of originalPage.element.classList) {
			if (
				className !== "pagedjs_left_page" &&
				className !== "pagedjs_right_page"
			) {
				page.element.classList.add(className);
			}
		}

		await this.hooks.afterPageLayout.trigger(
			page.element,
			page,
			undefined,
			this,
		);
		await this.hooks.finalizePage.trigger(page.element, page, undefined, this);
		this.emit("renderedPage", page);
	}
	/**
	 * Waits for all fonts to load before rendering starts.
	 *
	 * @returns {Promise<string[]>} - A promise resolving to a list of font families loaded.
	 */
	loadFonts() {
		let fontPromises = [];
		(document.fonts || []).forEach((fontFace) => {
			if (fontFace.status !== "loaded") {
				let fontLoaded = fontFace.load().then(
					(r) => {
						return fontFace.family;
					},
					(r) => {
						console.warn("Failed to preload font-family:", fontFace.family);
						return fontFace.family;
					},
				);
				fontPromises.push(fontLoaded);
			}
		});
		return Promise.all(fontPromises).catch((err) => {
			console.warn(err);
		});
	}
	/**
	 * Cleans up and removes all rendered elements and templates.
	 */
	destroy() {
		this.pagesArea.remove();
		this.pageTemplate.remove();
	}
}

EventEmitter(Chunker.prototype);

export default Chunker;

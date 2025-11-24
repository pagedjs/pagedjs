import Layout from "./layout.js";
import EventEmitter from "event-emitter";

/**
 * Represents a single page in a paginated document.
 * Handles rendering, layout, overflow detection, and DOM interactions.
 *
 * @class
 */
class Page {
	/**
	 * Creates an instance of Page.
	 *
	 * @param {HTMLElement} pagesArea - The container element for all pages.
	 * @param {HTMLTemplateElement} pageTemplate - Template for creating new pages.
	 * @param {boolean} blank - Indicates if this is a blank page.
	 * @param {Object} hooks - Hook functions for custom behavior.
	 * @param {Object} options - Additional layout or rendering options.
	 */
	constructor(pagesArea, pageTemplate, blank, hooks, options) {
		this.pagesArea = pagesArea;
		this.pageTemplate = pageTemplate;
		this.blank = blank;

		this.width = undefined;
		this.height = undefined;

		this.hooks = hooks;
		this.settings = options || {};
	}

	/**
	 * Creates a new page element from the template and inserts it into the DOM.
	 *
	 * @param {HTMLTemplateElement} template - The template to use for page creation.
	 * @param {HTMLElement} [after] - Optional reference element to insert after.
	 * @returns {HTMLElement} The newly created page element.
	 */
	create(template, after) {
		let clone = document.importNode(this.pageTemplate.content, true);

		let page, index;
		if (after) {
			this.pagesArea.insertBefore(clone, after.nextElementSibling);
			index = Array.prototype.indexOf.call(
				this.pagesArea.children,
				after.nextElementSibling,
			);
			page = this.pagesArea.children[index];
		} else {
			this.pagesArea.appendChild(clone);
			page = this.pagesArea.lastChild;
		}

		let pagebox = page.querySelector(".pagedjs_pagebox");
		let area = page.querySelector(".pagedjs_page_content");
		let footnotesArea = page.querySelector(".pagedjs_footnote_area");

		let size = area.getBoundingClientRect();

		area.style.columnWidth = Math.round(size.width) + "px";
		area.style.columnGap =
			"calc(var(--pagedjs-margin-right) + var(--pagedjs-margin-left) + var(--pagedjs-bleed-right) + var(--pagedjs-bleed-left) + var(--pagedjs-column-gap-offset))";

		this.width = Math.round(size.width);
		this.height = Math.round(size.height);

		this.element = page;
		this.pagebox = pagebox;
		this.area = area;
		this.footnotesArea = footnotesArea;

		return page;
	}

	/**
	 * Creates a wrapper element inside the page's content area.
	 *
	 * @returns {HTMLElement} The wrapper element.
	 */
	createWrapper() {
		let wrapper = document.createElement("div");
		this.area.appendChild(wrapper);
		this.wrapper = wrapper;
		return wrapper;
	}

	/**
	 * Sets the page index and updates relevant attributes and classes.
	 *
	 * @param {number} pgnum - The page index number (0-based).
	 */
	index(pgnum) {
		this.position = pgnum;

		let page = this.element;
		let index = pgnum + 1;
		let id = `page-${index}`;

		this.id = id;
		page.dataset.pageNumber = index;
		page.setAttribute("id", id);

		if (this.name) {
			page.classList.add("pagedjs_" + this.name + "_page");
		}

		if (this.blank) {
			page.classList.add("pagedjs_blank_page");
		}

		if (pgnum === 0) {
			page.classList.add("pagedjs_first_page");
		}

		if (pgnum % 2 !== 1) {
			page.classList.remove("pagedjs_left_page");
			page.classList.add("pagedjs_right_page");
		} else {
			page.classList.remove("pagedjs_right_page");
			page.classList.add("pagedjs_left_page");
		}
	}

	/*
	size(width, height) {
		if (width === this.width && height === this.height) {
			return;
		}
		this.width = width;
		this.height = height;

		this.element.style.width = Math.round(width) + "px";
		this.element.style.height = Math.round(height) + "px";
		this.element.style.columnWidth = Math.round(width) + "px";
	}
	*/

	/**
	 * Start to layout page
	 *
	 * @param {HTML} contents - HTML content
	 * @param {BreakToken} breakToken - Previous Breaktoken
	 * @param {Page} prevPage - Previous Page
	 * @returns {BreakToken | null} - Null if breaktoken is equal to previous one
	 */
	async layout(contents, breakToken, prevPage) {
		this.clear();

		this.startToken = breakToken;

		this.layoutMethod = new Layout(this.area, this.hooks, this.settings);

		let renderResult = await this.layoutMethod.renderTo(
			this.wrapper,
			contents,
			breakToken,
			prevPage,
		);
		let newBreakToken = renderResult.breakToken;

		if (breakToken && newBreakToken && breakToken.equals(newBreakToken)) {
			return;
		}

		this.addListeners(contents);

		this.endToken = newBreakToken;

		return newBreakToken;
	}

	/**
	 * Appends content to the existing layout using the current layout method.
	 *
	 * @async
	 * @param {DocumentFragment} contents - The contents to append.
	 * @param {Object} breakToken - The token to continue rendering from.
	 * @returns {Promise<Object>} A new breakToken after rendering.
	 */
	async append(contents, breakToken) {
		if (!this.layoutMethod) {
			return this.layout(contents, breakToken);
		}

		let renderResult = await this.layoutMethod.renderTo(
			this.wrapper,
			contents,
			breakToken,
		);
		let newBreakToken = renderResult.breakToken;

		this.endToken = newBreakToken;

		return newBreakToken;
	}

	/**
	 * Finds a DOM element by its `data-ref` attribute in a list of elements.
	 *
	 * @param {string} ref - The reference string to look for.
	 * @param {HTMLElement[]} entries - A list of elements to search.
	 * @returns {HTMLElement|undefined} The matching element, if found.
	 */
	getByParent(ref, entries) {
		for (let i = 0; i < entries.length; i++) {
			if (entries[i].dataset.ref === ref) {
				return entries[i];
			}
		}
	}

	/**
	 * Registers a callback to run when content overflows the page.
	 *
	 * @param {Function} func - The overflow callback function.
	 */
	onOverflow(func) {
		this._onOverflow = func;
	}

	/**
	 * Registers a callback to run when content underflows the page.
	 *
	 * @param {Function} func - The underflow callback function.
	 */
	onUnderflow(func) {
		this._onUnderflow = func;
	}

	/**
	 * Clears the wrapper and listeners, resetting the layout state.
	 */
	clear() {
		this.removeListeners();
		this.wrapper && this.wrapper.remove();
		this.createWrapper();
	}

	/**
	 * Adds event listeners for scroll and resize to monitor overflows.
	 *
	 * @param {DocumentFragment} contents - The content being rendered (used in resize checks).
	 * @returns {boolean} True if listeners were added.
	 */
	addListeners(contents) {
		if (typeof ResizeObserver !== "undefined") {
			this.addResizeObserver(contents);
		} else {
			this._checkOverflowAfterResize = this.checkOverflowAfterResize.bind(
				this,
				contents,
			);
			this.element.addEventListener(
				"overflow",
				this._checkOverflowAfterResize,
				false,
			);
			this.element.addEventListener(
				"underflow",
				this._checkOverflowAfterResize,
				false,
			);
		}

		this._onScroll = () => {
			if (this.listening) {
				this.element.scrollLeft = 0;
			}
		};

		this.element.addEventListener("scroll", this._onScroll);
		this.listening = true;

		return true;
	}

	/**
	 * Removes event listeners related to overflow and resizing.
	 */
	removeListeners() {
		this.listening = false;

		if (typeof ResizeObserver !== "undefined" && this.ro) {
			this.ro.disconnect();
		} else if (this.element) {
			this.element.removeEventListener(
				"overflow",
				this._checkOverflowAfterResize,
				false,
			);
			this.element.removeEventListener(
				"underflow",
				this._checkOverflowAfterResize,
				false,
			);
		}

		this.element && this.element.removeEventListener("scroll", this._onScroll);
	}

	/**
	 * Adds a ResizeObserver to monitor wrapper size changes.
	 *
	 * @param {DocumentFragment} contents - The contents being observed for overflow changes.
	 */
	addResizeObserver(contents) {
		let wrapper = this.wrapper;
		let prevHeight = wrapper.getBoundingClientRect().height;

		this.ro = new ResizeObserver((entries) => {
			if (!this.listening) return;

			requestAnimationFrame(() => {
				for (let entry of entries) {
					const cr = entry.contentRect;

					if (cr.height > prevHeight) {
						this.checkOverflowAfterResize(contents);
						prevHeight = wrapper.getBoundingClientRect().height;
					} else if (cr.height < prevHeight) {
						this.checkUnderflowAfterResize(contents);
						prevHeight = cr.height;
					}
				}
			});
		});

		this.ro.observe(wrapper);
	}

	/**
	 * Checks if the page content has overflowed after a resize.
	 *
	 * @param {DocumentFragment} contents - The content being checked.
	 */
	checkOverflowAfterResize(contents) {
		if (!this.listening || !this.layoutMethod) return;

		let newBreakToken = this.layoutMethod.findBreakToken(
			this.wrapper,
			contents,
			undefined,
			this.startToken,
		);

		if (newBreakToken) {
			this.endToken = newBreakToken;
			this._onOverflow && this._onOverflow(newBreakToken);
		}
	}

	/**
	 * Checks if the page content has underflowed (e.g., content was removed).
	 *
	 * @param {DocumentFragment} contents - The content being checked.
	 */
	checkUnderflowAfterResize(contents) {
		if (!this.listening || !this.layoutMethod) return;

		let endToken = this.layoutMethod.findEndToken(this.wrapper, contents);

		if (endToken) {
			this._onUnderflow && this._onUnderflow(endToken);
		}
	}

	/**
	 * Cleans up the page, removing all DOM elements and listeners.
	 */
	destroy() {
		this.removeListeners();

		this.element.remove();

		this.element = undefined;
		this.wrapper = undefined;
	}
}

// Add event emitter capabilities
EventEmitter(Page.prototype);

export default Page;

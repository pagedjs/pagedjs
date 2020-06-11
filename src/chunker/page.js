import Layout from "./layout";
import EventEmitter from "event-emitter";

/**
 * Render a page
 * @class
 */
class Page {
	constructor(pagesArea, pageTemplate, blank, hooks) {
		this.pagesArea = pagesArea;
		this.pageTemplate = pageTemplate;
		this.blank = blank;

		this.width = undefined;
		this.height = undefined;

		this.hooks = hooks;

		// this.element = this.create(this.pageTemplate);
	}

	create(template, after) {
		//let documentFragment = document.createRange().createContextualFragment( TEMPLATE );
		//let page = documentFragment.children[0];
		let clone = document.importNode(this.pageTemplate.content, true);

		let page, index;
		if (after) {
			this.pagesArea.insertBefore(clone, after.nextElementSibling);
			index = Array.prototype.indexOf.call(this.pagesArea.children, after.nextElementSibling);
			page = this.pagesArea.children[index];
		} else {
			this.pagesArea.appendChild(clone);
			page = this.pagesArea.lastChild;
		}

		let pagebox = page.querySelector(".pagedjs_pagebox");
		let area = page.querySelector(".pagedjs_page_content");


		let size = area.getBoundingClientRect();


		area.style.columnWidth = Math.round(size.width) + "px";
		area.style.columnGap = "calc(var(--pagedjs-margin-right) + var(--pagedjs-margin-left))";
		// area.style.overflow = "scroll";

		this.width = Math.round(size.width);
		this.height = Math.round(size.height);

		this.element = page;
		this.pagebox = pagebox;
		this.area = area;

		return page;
	}

	createWrapper() {
		let wrapper = document.createElement("div");

		this.area.appendChild(wrapper);

		this.wrapper = wrapper;

		return wrapper;
	}

	index(pgnum) {
		this.position = pgnum;

		let page = this.element;
		// let pagebox = this.pagebox;

		let index = pgnum + 1;

		let id = `page-${index}`;

		this.id = id;

		// page.dataset.pageNumber = index;

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

	async layout(contents, breakToken, maxChars) {

		this.clear();

		this.startToken = breakToken;

		this.layoutMethod = new Layout(this.area, this.hooks, maxChars);

		let newBreakToken = await this.layoutMethod.renderTo(this.wrapper, contents, breakToken);
		
		this.addListeners(contents);

		this.endToken = newBreakToken;

		return newBreakToken;
	}

	async append(contents, breakToken) {

		if (!this.layoutMethod) {
			return this.layout(contents, breakToken);
		}

		let newBreakToken = await this.layoutMethod.renderTo(this.wrapper, contents, breakToken);

		this.endToken = newBreakToken;

		return newBreakToken;
	}

	getByParent(ref, entries) {
		let e;
		for (var i = 0; i < entries.length; i++) {
			e = entries[i];
			if (e.dataset.ref === ref) {
				return e;
			}
		}
	}

	onOverflow(func) {
		this._onOverflow = func;
	}

	onUnderflow(func) {
		this._onUnderflow = func;
	}

	clear() {
		this.removeListeners();
		this.wrapper && this.wrapper.remove();
		this.createWrapper();
	}

	addListeners(contents) {
		if (typeof ResizeObserver !== "undefined") {
			this.addResizeObserver(contents);
		} else {
			this._checkOverflowAfterResize = this.checkOverflowAfterResize.bind(this, contents);
			this.element.addEventListener("overflow", this._checkOverflowAfterResize, false);
			this.element.addEventListener("underflow", this._checkOverflowAfterResize, false);
		}
		// TODO: fall back to mutation observer?

		this._onScroll = function () {
			if (this.listening) {
				this.element.scrollLeft = 0;
			}
		}.bind(this);

		// Keep scroll left from changing
		this.element.addEventListener("scroll", this._onScroll);

		this.listening = true;

		return true;
	}

	removeListeners() {
		this.listening = false;

		if (typeof ResizeObserver !== "undefined" && this.ro) {
			this.ro.disconnect();
		} else if (this.element) {
			this.element.removeEventListener("overflow", this._checkOverflowAfterResize, false);
			this.element.removeEventListener("underflow", this._checkOverflowAfterResize, false);
		}

		this.element && this.element.removeEventListener("scroll", this._onScroll);

	}

	addResizeObserver(contents) {
		let wrapper = this.wrapper;
		let prevHeight = wrapper.getBoundingClientRect().height;
		this.ro = new ResizeObserver(entries => {

			if (!this.listening) {
				return;
			}
			requestAnimationFrame(() => {
				for (let entry of entries) {
					const cr = entry.contentRect;

					if (cr.height > prevHeight) {
						this.checkOverflowAfterResize(contents);
						prevHeight = wrapper.getBoundingClientRect().height;
					} else if (cr.height < prevHeight) { // TODO: calc line height && (prevHeight - cr.height) >= 22
						this.checkUnderflowAfterResize(contents);
						prevHeight = cr.height;
					}
				}
			});
		});

		this.ro.observe(wrapper);
	}

	checkOverflowAfterResize(contents) {
		if (!this.listening || !this.layoutMethod) {
			return;
		}

		let newBreakToken = this.layoutMethod.findBreakToken(this.wrapper, contents, this.startToken);

		if (newBreakToken) {
			this.endToken = newBreakToken;
			this._onOverflow && this._onOverflow(newBreakToken);
		}
	}

	checkUnderflowAfterResize(contents) {
		if (!this.listening || !this.layoutMethod) {
			return;
		}

		let endToken = this.layoutMethod.findEndToken(this.wrapper, contents);

		if (endToken) {
			this._onUnderflow && this._onUnderflow(endToken);
		}
	}


	destroy() {
		this.removeListeners();

		this.element.remove();

		this.element = undefined;
		this.wrapper = undefined;
	}
}

EventEmitter(Page.prototype);


export default Page;

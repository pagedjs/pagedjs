import { LitElement, css, html } from "lit";

/**
 * `<paged-document>` contains and indexes a sequence of `<paged-page>` elements.
 *
 * @element paged-document
 *
 * @slot - The pages in document order.
 * @cssprop --paged-page-count - Number of elements assigned to the document.
 */
export class PagedDocument extends LitElement {
	static styles = css`
		:host {
			counter-reset: page 0 pages var(--paged-page-count, 0);
		}
	`;

	#indexed = [];
	#ready = false;
	#totalPages = null;
	#observer = new MutationObserver((records) => this.#reconcile(records));

	/** Observe native DOM changes, including page slot reassignment. */
	constructor() {
		super();
		this.#observer.observe(this, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ["slot"],
		});
	}

	/**
	 * Returns the elements assigned to the default slot.
	 * The list is not filtered by tag name.
	 *
	 * @returns {Element[]} Assigned elements in document order.
	 */
	get pages() {
		if (!this.#ready) return [];
		this.#reconcile(this.#observer.takeRecords());
		return [...this.#indexed];
	}

	/**
	 * The explicit page total, or null when counting assigned elements.
	 * @returns {number|null} Total used by the pages CSS counter.
	 */
	get totalPages() {
		return this.#totalPages;
	}

	/**
	 * Publish a known total while only part of the document is connected.
	 * @param {number|null} value Nonnegative integer, or null for automatic counting.
	 * @returns {void}
	 */
	set totalPages(value) {
		if (value !== null && (!Number.isInteger(value) || value < 0)) {
			throw new TypeError("totalPages must be a nonnegative integer or null");
		}
		this.#totalPages = value;
		this.#reconcile(this.#observer.takeRecords());
		this.#updateCount();
	}

	/**
	 * Resolves when the document and its assigned pages finish updating.
	 *
	 * @returns {Promise<boolean>} Whether the document finished without scheduling
	 *   another update.
	 */
	async getUpdateComplete() {
		const result = await super.getUpdateComplete();
		await Promise.all(this.pages.map((page) => page.updateComplete));
		return result;
	}

	firstUpdated() {
		this.#ready = true;
		this.renderRoot.querySelector("slot").addEventListener("slotchange", () => {
			this.#reconcile(this.#observer.takeRecords());
			// Forwarded slots: their assignments can change without a light-DOM mutation.
			if (this.querySelector(":scope > slot")) this.updatePageIndexes();
		});
		this.updatePageIndexes();
	}

	/**
	 * Reconcile assigned elements and index from the first changed position.
	 * @returns {void}
	 */
	updatePageIndexes() {
		if (!this.#ready) return;
		this.#observer.takeRecords();
		const pages = this.renderRoot.querySelector("slot").assignedElements({ flatten: true });
		let first = 0;
		while (first < pages.length && pages[first] === this.#indexed[first]) first++;
		this.#indexed = pages;
		this.#indexFrom(first);
	}

	#reconcile(records) {
		if (!this.#ready) return;
		const relevant = records.filter((record) => record.target === this ||
			(record.type === "attributes" && record.target.parentNode === this));
		if (!relevant.length) return;
		const appended = [];
		for (const record of relevant) {
			if (record.type !== "childList" || record.removedNodes.length || record.nextSibling ||
				[...record.addedNodes].some((node) => node.localName === "slot")) {
				this.updatePageIndexes();
				return;
			}
			for (const node of record.addedNodes) {
				if (node.nodeType === Node.ELEMENT_NODE && !node.slot) appended.push(node);
			}
		}
		const first = this.#indexed.length;
		this.#indexed.push(...appended);
		this.#indexFrom(first);
	}

	#indexFrom(first) {
		for (let i = first; i < this.#indexed.length; i++) {
			const page = this.#indexed[i];
			if (page.getAttribute("index") !== String(i)) page.setAttribute("index", String(i));
		}
		this.#updateCount();
	}

	#updateCount() {
		const total = String(this.#totalPages ?? this.#indexed.length);
		if (this.style.getPropertyValue("--paged-page-count") !== total) {
			this.style.setProperty("--paged-page-count", total);
		}
	}

	/**
	 * Adds a new `<paged-page>` to the document.
	 *
	 * @param {Node} [content] - Content to append to the page.
	 * @param {Object} [states] - Initial page state.
	 * @param {string} [states.name] - Page name.
	 * @param {boolean} [states.blank] - Blank page state.
	 * @param {boolean} [states.verso] - Verso (left) page state.
	 * @param {boolean} [states.recto] - Recto (right) page state.
	 * @param {boolean} [states.first] - First page state.
	 * @returns {HTMLElement} The new page element.
	 */
	addPage(content, states = {}) {
		const page = document.createElement("paged-page");
		page.name = states.name ?? "";
		page.blank = Boolean(states.blank);
		page.verso = Boolean(states.verso);
		page.recto = Boolean(states.recto);
		page.first = Boolean(states.first);

		if (content) page.appendChild(content);
		this.appendChild(page);
		this.#reconcile(this.#observer.takeRecords());
		return page;
	}

	render() {
		return html`<slot></slot>`;
	}
}

customElements.define("paged-document", PagedDocument);

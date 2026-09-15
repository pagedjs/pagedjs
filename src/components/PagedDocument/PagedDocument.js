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

	/**
	 * Returns the elements assigned to the default slot.
	 * The list is not filtered by tag name.
	 *
	 * @returns {Element[]} Assigned elements in document order.
	 */
	get pages() {
		return this.renderRoot
			?.querySelector("slot")
			?.assignedElements({ flatten: true }) ?? [];
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
		this.renderRoot
			?.querySelector("slot")
			?.addEventListener("slotchange", () => this.updatePageIndexes());
		this.updatePageIndexes();
	}

	/**
	 * Sets zero-based page indexes and the total used by the `pages` CSS counter.
	 *
	 * @returns {void}
	 */
	updatePageIndexes() {
		this.pages.forEach((page, index) => {
			if (page.getAttribute("index") !== String(index)) {
				page.setAttribute("index", String(index));
			}
		});
		this.style.setProperty("--paged-page-count", String(this.pages.length));
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
		this.updatePageIndexes();
		return page;
	}

	render() {
		return html`<slot></slot>`;
	}
}

customElements.define("paged-document", PagedDocument);

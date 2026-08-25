import { LitElement, css, html } from "lit";

export class PagedDocument extends LitElement {
	static styles = css`
		:host {
			counter-reset: page 0 pages var(--paged-page-count, 0);
		}
	`;

	/**
	 * Returns children assigned to the default slot.
	 * Does currently not do any filtering.
	 */
	get pages() {
		const slot = this.renderRoot?.querySelector("slot");

		if (slot) {
			return slot.assignedElements({ flatten: true });
		}

		return null;
	}

	/**
	 * Resolve once every page assigned to the document has settled.
	 *
	 * Pages are separate custom elements, so the document's own update says
	 * nothing about whether they have rendered. `<paged-page>` in turn folds in
	 * its margins, so awaiting the document covers the whole tree.
	 *
	 * @returns {Promise<boolean>} false when a further update was requested
	 *   during this one, per Lit's contract.
	 */
	async getUpdateComplete() {
		const result = await super.getUpdateComplete();
		await Promise.all((this.pages ?? []).map((page) => page.updateComplete));
		return result;
	}

	/**
	 * Set a listener for slot changes and index any pages that were assigned
	 * before the component's first render.
	 */
	firstUpdated() {
		const slot = this.renderRoot?.querySelector("slot");
		slot?.addEventListener("slotchange", () => this.updatePageIndexes());
		this.updatePageIndexes();
	}

	/**
	 * Set zero-based indexes on pages and expose the final page count to the
	 * `pages` CSS counter.
	 */
	updatePageIndexes() {
		const pages = this.pages ?? [];
		pages.forEach((page, index) => {
			if (page.getAttribute("index") !== String(index)) {
				page.setAttribute("index", index);
			}
		});
		this.style.setProperty("--paged-page-count", String(pages.length));
	}

	/**
	 * Adds a page by constructing a pagedPage and attaching it to itself.
	 */
	addPage(content, states = {}) {
		const page = document.createElement("paged-page");

		page.name = states.name || null;
		page.blank = !!states.blank;
		page.verso = !!states.verso;
		page.recto = !!states.recto;
		page.first = !!states.first;

		if (content) {
			page.appendChild(content);
		}

		this.appendChild(page);
		this.updatePageIndexes();
		return page;
	}

	render() {
		return html`<slot></slot>`;
	}
}

customElements.define("paged-document", PagedDocument);

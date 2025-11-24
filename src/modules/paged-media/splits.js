import Handler from "../handler.js";

/**
 * Handles split content across paginated pages.
 *
 * When content is split across pages (e.g., footnotes or paragraphs),
 * this handler links the split parts together using data attributes
 * (`data-split-from`, `data-split-to`, etc.) to assist layout engines
 * or post-processing logic.
 */
class Splits extends Handler {
	/**
	 * Create a new Splits handler instance.
	 *
	 * @param {Object} chunker - The chunker instance used for page breaking.
	 * @param {Object} polisher - The polisher instance used for styling.
	 * @param {Object} caller - The orchestrating object coordinating handlers.
	 */
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);
	}

	/**
	 * Called after the layout of each page is completed.
	 *
	 * - Detects elements on the current page that have been split from a previous page.
	 * - Finds the original element on the previous page and adds metadata to link them.
	 * - Applies alignment adjustments to the original element.
	 *
	 * @param {HTMLElement} pageElement - The root element of the current page.
	 * @param {Object} page - Page metadata object.
	 * @param {Object|null} breakToken - Information about the point where the content was split.
	 * @param {Object} chunker - The chunker instance.
	 */
	afterPageLayout(pageElement, page, breakToken, chunker) {
		let splits = Array.from(pageElement.querySelectorAll("[data-split-from]"));
		let pages = pageElement.parentNode;
		let index = Array.prototype.indexOf.call(pages.children, pageElement);
		let prevPage;

		// If this is the first page, there's no previous page to compare to
		if (index === 0) {
			return;
		}

		prevPage = pages.children[index - 1];

		let from; // Capture the last "from" element for alignment handling

		splits.forEach((split) => {
			let ref = split.dataset.ref;

			// Find the original element that was split
			from = prevPage.querySelector("[data-ref='" + ref + "']");

			if (from) {
				// Link the original element to its split counterpart
				from.dataset.splitTo = ref;

				// Mark the element as the original split source if it's not already a split
				if (!from.dataset.splitFrom) {
					from.dataset.splitOriginal = true;
				}
			}
		});

		// Fix alignment on the deepest original split element (only the last one in loop)
		if (from) {
			this.handleAlignment(from);
		}
	}

	/**
	 * Adjusts alignment metadata for a split element to preserve proper justification.
	 *
	 * This ensures that the last line of split content aligns correctly,
	 * particularly when text-align is set to `justify`.
	 *
	 * @param {HTMLElement} node - The original DOM node that was split.
	 */
	handleAlignment(node) {
		let styles = window.getComputedStyle(node);
		let align = styles["text-align"];
		let alignLast = styles["text-align-last"];

		node.dataset.lastSplitElement = "true";

		if (align === "justify" && alignLast === "auto") {
			node.dataset.alignLastSplitElement = "justify";
		} else {
			node.dataset.alignLastSplitElement = alignLast;
		}
	}
}

export default Splits;

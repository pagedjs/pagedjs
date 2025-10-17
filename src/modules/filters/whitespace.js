import Handler from "../handler.js";
import {
	isElement,
	isIgnorable,
	nextSignificantNode,
	previousSignificantNode,
	filterTree,
} from "../../utils/dom.js";

/**
 * Filters and normalizes whitespace-only text nodes that are not visually meaningful.
 *
 * Removes or replaces ignorable text nodes (e.g., extra line breaks, tabs, or spaces)
 * except in contexts where whitespace is meaningful (e.g., inside `<pre>` tags).
 *
 * @class
 * @extends Handler
 */
class WhiteSpaceFilter extends Handler {
	/**
	 * Create a WhiteSpaceFilter instance.
	 *
	 * @param {Object} chunker - Handles document chunking.
	 * @param {Object} polisher - Handles CSS polishing/styling.
	 * @param {Object} caller - The invoking processor or engine.
	 */
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);
	}

	/**
	 * Filters out or normalizes ignorable whitespace-only text nodes from content.
	 *
	 * @param {DocumentFragment | HTMLElement} content - The DOM content to filter.
	 */
	filter(content) {
		filterTree(
			content,
			(node) => {
				return this.filterEmpty(node);
			},
			NodeFilter.SHOW_TEXT,
		);
	}

	/**
	 * Determines whether a text node should be removed or normalized.
	 * Replaces content with a single space if it's between significant siblings,
	 * and removes the node if it's safe to do so.
	 *
	 * @param {Text} node - The text node to evaluate.
	 * @returns {number} A NodeFilter constant indicating filter behavior.
	 */
	filterEmpty(node) {
		if (node.textContent.length > 1 && isIgnorable(node)) {
			const parent = node.parentNode;
			const pre = isElement(parent) && parent.closest("pre");

			// Skip if inside <pre> or similar white-space preserving context
			if (pre) {
				return NodeFilter.FILTER_REJECT;
			}

			const previousSibling = previousSignificantNode(node);
			const nextSibling = nextSignificantNode(node);

			if (nextSibling === null && previousSibling === null) {
				// Only node — keep it, but normalize to a single space
				node.textContent = " ";
				return NodeFilter.FILTER_REJECT;
			}

			if (nextSibling === null || previousSibling === null) {
				// Safe to remove
				return NodeFilter.FILTER_ACCEPT;
			}

			// Normalize to a single space
			node.textContent = " ";
			return NodeFilter.FILTER_REJECT;
		}

		return NodeFilter.FILTER_REJECT;
	}
}

export default WhiteSpaceFilter;

// TODO: we also need to preserve sequences of white spaces when the parent has "white-space" rule:
// pre Sequences of white space are preserved. Lines are only broken at newline characters in the source and at <br> elements.
//
// pre-wrap
// Sequences of white space are preserved. Lines are broken at newline characters, at <br>, and as necessary to fill line boxes.
//
// pre-line
// Sequences of white space are collapsed. Lines are broken at newline characters, at <br>, and as necessary to fill line boxes.
//
// break-spaces
// The behavior is identical to that of pre-wrap, except that:
// - Any sequence of preserved white space always takes up space, including at the end of the line.
// - A line breaking opportunity exists after every preserved white space character, including between white space characters.
// - Such preserved spaces take up space and do not hang, and thus affect the box’s intrinsic sizes (min-content size and max-content size).
//
// See: https://developer.mozilla.org/en-US/docs/Web/CSS/white-space#Values

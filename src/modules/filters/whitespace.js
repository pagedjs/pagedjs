import Handler from "../handler";
import {isElement, isIgnorable, nextSignificantNode, previousSignificantNode, filterTree} from "../../utils/dom";

class WhiteSpaceFilter extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);
	}

	filter(content) {

		filterTree(content, (node) => {
			return this.filterEmpty(node);
		}, NodeFilter.SHOW_TEXT);

	}

	filterEmpty(node) {
		if (node.textContent.length > 1 && isIgnorable(node)) {

			// Do not touch the content if text is pre-formatted
			let parent = node.parentNode;
			let pre = isElement(parent) && parent.closest("pre");
			if (pre) {
				return NodeFilter.FILTER_REJECT;
			}

			const previousSibling = previousSignificantNode(node);
			const nextSibling = nextSignificantNode(node);

			if (nextSibling === null && previousSibling === null) {
				// we should not remove a Node that does not have any siblings.
				node.textContent = " ";
				return NodeFilter.FILTER_REJECT;
			}
			if (nextSibling === null) {
				// we can safely remove this node
				return NodeFilter.FILTER_ACCEPT;
			}
			if (previousSibling === null) {
				// we can safely remove this node
				return NodeFilter.FILTER_ACCEPT;
			}

			// replace the content with a single space
			node.textContent = " ";

			// TODO: we also need to preserve sequences of white spaces when the parent has "white-space" rule:
			// pre
			// Sequences of white space are preserved. Lines are only broken at newline characters in the source and at <br> elements.
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

			return NodeFilter.FILTER_REJECT;
		} else {
			return NodeFilter.FILTER_REJECT;
		}
	}

}

export default WhiteSpaceFilter;

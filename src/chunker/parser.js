import {UUID} from "../utils/utils";
import {isElement, isIgnorable, nextSignificantNode, previousSignificantNode} from "../utils/dom";

/**
 * Render a flow of text offscreen
 * @class
 */
class ContentParser {

	constructor(content, cb) {
		if (content && content.nodeType) {
			// handle dom
			this.dom = this.add(content);
		} else if (typeof content === "string") {
			this.dom = this.parse(content);
		}

		return this.dom;
	}

	parse(markup, mime) {
		let range = document.createRange();
		let fragment = range.createContextualFragment(markup);

		this.addRefs(fragment);
		this.removeEmpty(fragment);

		return fragment;
	}

	add(contents) {
		// let fragment = document.createDocumentFragment();
		//
		// let children = [...contents.childNodes];
		// for (let child of children) {
		// 	let clone = child.cloneNode(true);
		// 	fragment.appendChild(clone);
		// }

		this.addRefs(contents);
		this.removeEmpty(contents);

		return contents;
	}

	addRefs(content) {
		var treeWalker = document.createTreeWalker(
			content,
			NodeFilter.SHOW_ELEMENT,
			{ acceptNode: function(node) { return NodeFilter.FILTER_ACCEPT; } },
			false
		);

		let node = treeWalker.nextNode();
		while(node) {

			if (!node.hasAttribute("data-ref")) {
				let uuid = UUID();
				node.setAttribute("data-ref", uuid);
			}

			if (node.id) {
				node.setAttribute("data-id", node.id);
			}

			// node.setAttribute("data-children", node.childNodes.length);

			// node.setAttribute("data-text", node.textContent.trim().length);
			node = treeWalker.nextNode();
		}
	}

	removeEmpty(content) {
		const treeWalker = document.createTreeWalker(
			content,
			NodeFilter.SHOW_TEXT,
			{ acceptNode: function(node) {
				if (node.textContent.length > 1 && isIgnorable(node)) {

					// Do not touch the content if text is pre-formatted
					let parent = node.parentNode;
					let pre = isElement(parent) && parent.closest("pre");
					if (pre) {
						return NodeFilter.FILTER_REJECT;
					}

					const nextSibling = previousSignificantNode(node);
					const previousSibling = nextSignificantNode(node);
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
			} },
			false
		);

		let node;
		let current;
		node = treeWalker.nextNode();
		while(node) {
			current = node;
			node = treeWalker.nextNode();
			current.parentNode.removeChild(current);
		}
	}

	find(ref) {
		return this.refs[ref];
	}

	// isWrapper(element) {
	//   return wrappersRegex.test(element.nodeName);
	// }

	isText(node) {
		return node.tagName === "TAG";
	}

	isElement(node) {
		return node.nodeType === 1;
	}

	hasChildren(node) {
		return node.childNodes && node.childNodes.length;
	}


	destroy() {
		this.refs = undefined;
		this.dom = undefined;
	}
}

export default ContentParser;

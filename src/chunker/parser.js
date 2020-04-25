import {UUID} from "../utils/utils";
import {isElement} from "../utils/dom";

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
		const self = this;
		const treeWalker = document.createTreeWalker(
			content,
			NodeFilter.SHOW_TEXT,
			{ acceptNode: function(node) {
				// Only remove more than a single space
				if (self.isIgnorable(node)) {

					// Don't touch whitespace if text is pre-formatted
					let parent = node.parentNode;
					let pre = isElement(parent) && parent.closest("pre");
					if (pre) {
						return NodeFilter.FILTER_REJECT;
					}

					// TODO: we also need to ignore spaces when the parent has white-space rule:
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

					return NodeFilter.FILTER_ACCEPT;
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

	/**
	 * Throughout, whitespace is defined as one of the characters
	 *  "\t" TAB \u0009
	 *  "\n" LF  \u000A
	 *  "\r" CR  \u000D
	 *  " "  SPC \u0020
	 *
	 * This does not use Javascript's "\s" because that includes non-breaking
	 * spaces (and also some other characters).
	 */

	/**
	 * Determine if a node should be ignored by the iterator functions.
	 * taken from https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Whitespace#Whitespace_helper_functions
	 *
	 * @param {Node} node An object implementing the DOM1 |Node| interface.
	 * @return {boolean} true if the node is:
	 *  1) A |Text| node that is all whitespace
	 *  2) A |Comment| node
	 *  and otherwise false.
	 */
	isIgnorable(node) {
		return (node.nodeType === 8) || // A comment node
			((node.nodeType === 3) && this.isAllWhitespace(node)); // a text node, all whitespace
	}

	/**
	 * Determine whether a node's text content is entirely whitespace.
	 *
	 * @param {Node} node  A node implementing the |CharacterData| interface (i.e., a |Text|, |Comment|, or |CDATASection| node
	 * @return {boolean} true if all of the text content of |nod| is whitespace, otherwise false.
	 */
	isAllWhitespace(node) {
		return !(/[^\t\n\r ]/.test(node.textContent));
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

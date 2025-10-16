import { UUID } from "../utils/utils.js";

/**
 * Parses and processes a flow of content (HTML or DOM nodes) offscreen.
 * Adds unique references to elements for later retrieval or tracking.
 *
 * @class
 */
class ContentParser {
	/**
	 * Create a new ContentParser instance.
	 *
	 * @param {string | Node} content - HTML string or DOM Node to be parsed.
	 * @param {Function} [cb] - Optional callback (currently unused).
	 * @returns {DocumentFragment | Node} The parsed DOM fragment or node.
	 */
	constructor(content, cb) {
		if (content && content.nodeType) {
			// Handle DOM Node input
			this.dom = this.add(content);
		} else if (typeof content === "string") {
			// Handle HTML string input
			this.dom = this.parse(content);
		}

		return this.dom;
	}

	/**
	 * Parses an HTML string into a DocumentFragment and adds `data-ref` attributes.
	 *
	 * @param {string} markup - The HTML markup to parse.
	 * @param {string} [mime] - Optional MIME type (currently unused).
	 * @returns {DocumentFragment} A document fragment with processed nodes.
	 */
	parse(markup, mime) {
		let range = document.createRange();
		let fragment = range.createContextualFragment(markup);

		this.addRefs(fragment);

		return fragment;
	}

	/**
	 * Processes a DOM Node by cloning its structure (if needed) and adding `data-ref` attributes.
	 *
	 * @param {Node} contents - A DOM Node or DocumentFragment to process.
	 * @returns {Node} The processed content with references.
	 */
	add(contents) {
		// let fragment = document.createDocumentFragment();
		//
		// let children = [...contents.childNodes];
		// for (let child of children) {
		// 	let clone = child.cloneNode(true);
		// 	fragment.appendChild(clone);
		// }
		this.addRefs(contents);

		return contents;
	}

	/**
	 * Walks the content tree and adds a `data-ref` attribute (UUID) to each element.
	 * Also preserves original `id` attributes via `data-id`.
	 *
	 * @param {Node} content - A DOM Node or DocumentFragment to annotate.
	 */
	addRefs(content) {
		const treeWalker = document.createTreeWalker(
			content,
			NodeFilter.SHOW_ELEMENT,
			null,
			false,
		);

		let node = treeWalker.nextNode();
		while (node) {
			if (!node.hasAttribute("data-ref")) {
				const uuid = UUID();
				node.setAttribute("data-ref", uuid);
			}

			if (node.id) {
				node.setAttribute("data-id", node.id);
			}

			node = treeWalker.nextNode();
		}
	}

	/**
	 * Finds a DOM node by its reference ID (this.refs must be pre-populated externally).
	 *
	 * @param {string} ref - The `data-ref` UUID to search for.
	 * @returns {HTMLElement|undefined} The associated element, if found.
	 */
	find(ref) {
		return this.refs?.[ref];
	}

	/**
	 * Cleans up the parser's references and DOM structure.
	 */
	destroy() {
		this.refs = undefined;
		this.dom = undefined;
	}
}

export default ContentParser;

import { UUID } from "../utils/utils";

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
		let parser = new DOMParser();

		let range = document.createRange();
		let fragment = range.createContextualFragment(markup);

		this.addRefs(fragment);

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

		return contents;
	}

	addRefs(content) {
		var treeWalker = document.createTreeWalker(
			content,
			NodeFilter.SHOW_ELEMENT,
		 	{ acceptNode: function(node) { return NodeFilter.FILTER_ACCEPT; } },
		 	false
		);

		let node;
		while(node = treeWalker.nextNode()) {
			let uuid = UUID();

			node.setAttribute("ref", uuid);
			node.setAttribute("data-children", node.childNodes.length);

			node.setAttribute("data-text", node.textContent.trim().length);
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

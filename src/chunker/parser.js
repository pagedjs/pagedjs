import {UUID} from "../utils/utils";

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
			null,
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

	find(ref) {
		return this.refs[ref];
	}

	destroy() {
		this.refs = undefined;
		this.dom = undefined;
	}
}

export default ContentParser;

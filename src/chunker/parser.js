/**
 * Render a flow of text offscreen
 * @class
 */
class Parser {

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
		let fragment = document.createDocumentFragment();

		let children = [...contents.childNodes];
		for (let child of children) {
			let clone = child.cloneNode(true);
			fragment.appendChild(clone);
		}

		this.addRefs(fragment);

		return fragment;
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
			let uuid = this.uuid();

			node.setAttribute("ref", uuid);
			node.setAttribute("children", node.childNodes.length);

			node.setAttribute("text", node.textContent.trim().length);
		}
	}

	find(ref) {
		return this.refs[ref];
	}

	*walk(start) {
		let node = start || this.dom[0];

		while (node) {
			yield node;

			if (node.childNodes && node.childNodes.length) {
				node = node.childNodes[0];
			} else if (node.nextSibling) {
				node = node.nextSibling;
			} else {
				while (node) {
					node = node.parentNode;
					if (node && node.nextSibling) {
						node = node.nextSibling;
						break;
					}
				}
			}
		}
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

	after(node) {
		let after = node;
		if (after.nextSibling) {
			after = after.nextSibling;
		} else {
			while (after) {
				after = after.parentNode;
				if (after && after.nextSibling) {
					after = after.nextSibling;
					break;
				}
			}
		}

		return after;
	}

	/**
 * Generates a UUID
 * based on: http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
 * @returns {string} uuid
 */
	uuid() {
		var d = new Date().getTime();
		if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
				d += performance.now(); //use high-precision timer if available
		}
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
				var r = (d + Math.random() * 16) % 16 | 0;
				d = Math.floor(d / 16);
				return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
		});
	}

	destroy() {
		this.refs = undefined;
		this.dom = undefined;
	}
}

export default Parser;

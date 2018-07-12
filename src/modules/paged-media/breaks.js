import Handler from "../handler";
import csstree from 'css-tree';
import { split, rebuildAncestors, elementAfter } from "../../utils/dom";

class Breaks extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		this.breaks = {};
	}

	onDeclaration(declaration, dItem, dList, rule) {
		let property = declaration.property;

		if (property === "page") {
			let children = declaration.value.children.first();
			let value = children.name;
			let selector = csstree.generate(rule.ruleNode.prelude);
			let name = value;

			let breaker = {
				property: property,
				value: value,
				selector: selector,
				name: name
			};

			selector.split(",").forEach((s) => {
				if (!this.breaks[s]) {
					this.breaks[s] = [breaker];
				} else {
					this.breaks[s].push(breaker);
				}
			})

			dList.remove(dItem);
		}

		if (property === "break-before" ||
				property === "break-after" ||
				property === "page-break-before" ||
				property === "page-break-after"
		) {
			let child = declaration.value.children.first();
			let value = child.name;
			let selector = csstree.generate(rule.ruleNode.prelude);

			if (property === "page-break-before") {
				property = "break-before";
			} else if (property === "page-break-after") {
				property = "break-after";
			}

			let breaker = {
				property: property,
				value: value,
				selector: selector
			};

			selector.split(",").forEach((s) => {
				if (!this.breaks[s]) {
					this.breaks[s] = [breaker];
				} else {
					this.breaks[s].push(breaker);
				}
			})

			// Always break -- handle right / left in module
			// declaration.property = property;
			// child.name = "column";

			dList.remove(dItem);
		}
	}

	afterParsed(parsed) {
		this.processBreaks(parsed, this.breaks);
	}

	processBreaks(parsed, breaks) {
		for (let b in breaks) {
			// Find elements
			let elements = parsed.querySelectorAll(b);
			// Add break data
			for (var i = 0; i < elements.length; i++) {
				for (let prop of breaks[b]) {

					if (prop.property === "break-after") {
						let nodeAfter = elementAfter(elements[i], parsed);

						if (nodeAfter) {
							nodeAfter.setAttribute("data-previous-break-after", prop.value);
						}
					}

					elements[i].setAttribute("data-" + prop.property, prop.value);
				}
			}
		}
	}

	mergeBreaks(pageBreaks, newBreaks) {
		for (let b in newBreaks) {
			if (b in pageBreaks) {
				pageBreaks[b] = pageBreaks[b].concat(newBreaks[b]);
			} else {
				pageBreaks[b] = newBreaks[b];
			}
		}
		return pageBreaks;
	}

	addBreakAttributes(page) {
		let before = page.wrapper.querySelector("[data-break-before]");
		let after = page.wrapper.querySelector("[data-break-after]");

		if (before) {
			if (before.dataset.splitFrom) {
				page.splitFrom = before.dataset.splitFrom;
				page.element.setAttribute("data-split-from", before.dataset.splitFrom);
			} else {
				page.breakBefore = before.dataset.breakBefore;
				page.element.setAttribute("data-break-before", before.dataset.breakBefore);
			}
		}

		if (after) {
			if (after.dataset.splitTo) {
				page.splitTo = after.dataset.splitTo;
				page.element.setAttribute("data-split-to", after.dataset.splitTo);
			} else {
				page.breakAfter = after.dataset.breakAfter;
				page.element.setAttribute("data-break-after", after.dataset.breakAfter);
			}
		}
	}


	addPageAttributes(page, start) {
		let named = start.dataset.page;

		if (named) {
			page.name = named;
			page.element.classList.add("pagedjs_" + named + "_page");
		}
	}

	getStartElement(content, breakToken) {
		let start = content;
		let node = breakToken.node;
		let index, ref, parent;

		// No break
		if (!node) {
			return content.children[0];
		}

		// Top level element
		if (node.nodeType === 1 && node.parentNode.nodeType === 11) {
			return node;
		}

		// Named page
		if (node.nodeType === 1 && node.dataset.page) {
			return node;
		}

		// Get top level Named parent
		let fragment = rebuildAncestors(node);
		let pages = fragment.querySelectorAll("[data-page]");

		if (pages.length) {
			return pages[pages.length - 1];
		} else {
			return fragment.children[0];
		}
	}

	beforePageLayout(page, contents, breakToken) {
		let start = this.getStartElement(contents, breakToken);
		if (start) {
			this.addPageAttributes(page, start);
		}
	}

	layout(pageElement, page) {
		this.addBreakAttributes(page);
	}
}

export default Breaks;

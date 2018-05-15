import Handler from "../handler";
import csstree from 'css-tree';
import { split } from "../../utils/dom";

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
		let selectors = [];
		for (let b in breaks) {
			// Find elements
			let elements = parsed.querySelectorAll(b);
			// Add break data
			for (var i = 0; i < elements.length; i++) {
				for (let prop of breaks[b]) {
					elements[i].setAttribute("data-" + prop.property, prop.value);
				}
			}
			// Add to global selector
			selectors.push(b);
		}

		// Add any other direct children
		let child;
		for (var i = 0; i < parsed.children.length; i++) {
			child = parsed.children[i];
			if ((child.noteType === 1 || child.nodeType === "3" || typeof child.noteType === "undefined")
					&& child.nodeName !== "SCRIPT") {
				selectors.push("[ref='"+child.getAttribute("ref")+"']");
			}
		}

		let s = selectors.join(",");
		let parts = Array.from(parsed.querySelectorAll(s));

		let part;
		let sections = [];

		for (var i = 0; i < parts.length; i++) {
			part = parts[i];

			if (part.parentNode && part.parentNode.nodeType === 1) {
				let parent = part.parentNode;
				let before = part.dataset.breakBefore;
				let after = part.dataset.breakAfter;
				let index = Array.prototype.indexOf.call(parent.childNodes, part);

				// Get the top parent
				let topParent = part.parentNode;
				while (topParent) {
					if(topParent.parentNode.nodeType === 1) {
						topParent = topParent.parentNode;
					} else {
						break;
					}
				}

				// Split
				let dup = split(topParent, part, before);

				if (dup) {
					// console.log("dup", part, dup);

					sections.concat(sections, dup);
				} else {
					// console.log("topParent", topParent);
					sections.push(topParent);
				}
			} else {
				// console.log("parT", part);

				sections.push(part);
			}
		}

		return sections;
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
}

export default Breaks;

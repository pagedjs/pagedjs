import Handler from "../handler";
import csstree from "css-tree";
import { displayedElementAfter, displayedElementBefore } from "../../utils/dom";

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
			});

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
			});

			// Remove from CSS -- handle right / left in module
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
						let nodeAfter = displayedElementAfter(elements[i], parsed);

						elements[i].setAttribute("data-break-after", prop.value);

						if (nodeAfter) {
							nodeAfter.setAttribute("data-previous-break-after", prop.value);
						}
					} else if (prop.property === "break-before") {
						let nodeBefore = displayedElementBefore(elements[i], parsed);

						elements[i].setAttribute("data-break-before", prop.value);

						if (nodeBefore) {
							nodeBefore.setAttribute("data-next-break-before", prop.value);
						}
					} else if (prop.property === "page") {
						elements[i].setAttribute("data-page", prop.value);

						let nodeAfter = displayedElementAfter(elements[i], parsed);

						if (nodeAfter) {
							nodeAfter.setAttribute("data-after-page", prop.value);
						}
					} else {
						elements[i].setAttribute("data-" + prop.property, prop.value);
					}
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

	addBreakAttributes(pageElement, page) {
		let before = pageElement.querySelector("[data-break-before]");
		let after = pageElement.querySelector("[data-break-after]");
		let previousBreakAfter = pageElement.querySelector("[data-previous-break-after]");

		if (before) {
			if (before.dataset.splitFrom) {
				page.splitFrom = before.dataset.splitFrom;
				pageElement.setAttribute("data-split-from", before.dataset.splitFrom);
			} else if (before.dataset.breakBefore && before.dataset.breakBefore !== "avoid") {
				page.breakBefore = before.dataset.breakBefore;
				pageElement.setAttribute("data-break-before", before.dataset.breakBefore);
			}
		}

		if (after && after.dataset) {
			if (after.dataset.splitTo) {
				page.splitTo = after.dataset.splitTo;
				pageElement.setAttribute("data-split-to", after.dataset.splitTo);
			} else if (after.dataset.breakAfter && after.dataset.breakAfter !== "avoid") {
				page.breakAfter = after.dataset.breakAfter;
				pageElement.setAttribute("data-break-after", after.dataset.breakAfter);
			}
		}

		if (previousBreakAfter && previousBreakAfter.dataset) {
			if (previousBreakAfter.dataset.previousBreakAfter && previousBreakAfter.dataset.previousBreakAfter !== "avoid") {
				page.previousBreakAfter = previousBreakAfter.dataset.previousBreakAfter;
			}
		}
	}

	afterPageLayout(pageElement, page) {
		this.addBreakAttributes(pageElement, page);
	}
}

export default Breaks;

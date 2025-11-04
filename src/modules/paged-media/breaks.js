import Handler from "../handler.js";
import csstree from "css-tree";
import {
	displayedElementAfter,
	displayedElementBefore,
	needsPageBreak,
} from "../../utils/dom.js";

class Breaks extends Handler {
	/**
	 * Handles CSS break properties for paged media.
	 * @param {Object} chunker - The chunker instance managing the pagination.
	 * @param {Object} polisher - The polisher instance managing CSS and styles.
	 * @param {Object} caller - The caller instance (optional, context info).
	 */
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		/**
		 * Stores break rules keyed by CSS selector.
		 * @type {Object.<string, Array.<Object>>}
		 */
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
				name: name,
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

		if (
			property === "break-before" ||
			property === "break-after" ||
			property === "page-break-before" ||
			property === "page-break-after"
		) {
			let child = declaration.value.children.first();
			let value = child.name;
			let selector = csstree.generate(rule.ruleNode.prelude);

			// Normalize legacy page-break properties
			if (property === "page-break-before") {
				property = "break-before";
			} else if (property === "page-break-after") {
				property = "break-after";
			}

			let breaker = {
				property: property,
				value: value,
				selector: selector,
			};

			selector.split(",").forEach((s) => {
				if (!this.breaks[s]) {
					this.breaks[s] = [breaker];
				} else {
					this.breaks[s].push(breaker);
				}
			});

			// Remove from CSS -- break rules handled by script
			dList.remove(dItem);
		}
	}

	afterParsed(parsed) {
		this.processBreaks(parsed, this.breaks);
	}

	/**
	 * Applies stored break rules to matching elements.
	 *
	 * @param {DocumentFragment} parsed - The parsed DOM fragment.
	 * @param {Object.<string, Array.<Object>>} breaks - Break rules keyed by selectors.
	 */
	processBreaks(parsed, breaks) {
		for (let b in breaks) {
			// Find elements matching the selector
			let elements = parsed.querySelectorAll(b);

			for (var i = 0; i < elements.length; i++) {
				for (let prop of breaks[b]) {
					if (prop.property === "break-after") {
						let nodeAfter = displayedElementAfter(elements[i], parsed);

						elements[i].setAttribute("data-break-after", prop.value);

						if (nodeAfter) {
							nodeAfter.setAttribute("data-previous-break-after", prop.value);
						}
					} else if (prop.property === "break-before") {
						let nodeBefore = displayedElementBefore(elements[i], parsed, true);

						// Breaks are only allowed between siblings, not between a box and its container.
						// If we cannot find a node before we should not break!
						// https://drafts.csswg.org/css-break-3/#break-propagation
						if (nodeBefore) {
							if (
								prop.value === "page" &&
								needsPageBreak(elements[i], nodeBefore)
							) {
								// Ignore explicit page break if implicit break already needed
								continue;
							}
							elements[i].setAttribute("data-break-before", prop.value);
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

	/**
	 * Merges new break rules into existing break rules.
	 *
	 * @param {Object.<string, Array.<Object>>} pageBreaks - Existing break rules.
	 * @param {Object.<string, Array.<Object>>} newBreaks - New break rules to merge.
	 * @returns {Object.<string, Array.<Object>>} The merged break rules.
	 */
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

	/**
	 * Adds break-related data attributes from elements on the page to the page object.
	 *
	 * @param {Element} pageElement - The page DOM element.
	 * @param {Object} page - The page metadata object to update.
	 */
	addBreakAttributes(pageElement, page) {
		let before = pageElement.querySelector("[data-break-before]");
		let after = pageElement.querySelector("[data-break-after]");
		let previousBreakAfter = pageElement.querySelector(
			"[data-previous-break-after]",
		);

		if (before) {
			if (before.dataset.splitFrom) {
				page.splitFrom = before.dataset.splitFrom;
				pageElement.setAttribute("data-split-from", before.dataset.splitFrom);
			} else if (
				before.dataset.breakBefore &&
				before.dataset.breakBefore !== "avoid"
			) {
				page.breakBefore = before.dataset.breakBefore;
				pageElement.setAttribute(
					"data-break-before",
					before.dataset.breakBefore,
				);
			}
		}

		if (after && after.dataset) {
			if (after.dataset.splitTo) {
				page.splitTo = after.dataset.splitTo;
				pageElement.setAttribute("data-split-to", after.dataset.splitTo);
			} else if (
				after.dataset.breakAfter &&
				after.dataset.breakAfter !== "avoid"
			) {
				page.breakAfter = after.dataset.breakAfter;
				pageElement.setAttribute("data-break-after", after.dataset.breakAfter);
			}
		}

		if (previousBreakAfter && previousBreakAfter.dataset) {
			if (
				previousBreakAfter.dataset.previousBreakAfter &&
				previousBreakAfter.dataset.previousBreakAfter !== "avoid"
			) {
				page.previousBreakAfter = previousBreakAfter.dataset.previousBreakAfter;
			}
		}
	}

	afterPageLayout(pageElement, page) {
		this.addBreakAttributes(pageElement, page);
	}
}

export default Breaks;

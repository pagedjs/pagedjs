import Handler from "../handler.js";
import csstree from "css-tree";
import { UUID } from "../../utils/utils.js";

/**
 * Handler for emulating pseudo-selectors like `:first-of-type`, `:last-of-type`, and `:nth-of-type`
 * by converting them into attribute-based selectors that can be used for styling after layout.
 */
class NthOfType extends Handler {
	/**
	 * Constructs the NthOfType handler.
	 * @param {Object} chunker - The chunker instance used to split content into pages.
	 * @param {Object} polisher - The polisher instance for handling styles.
	 * @param {Object} caller - The caller instance managing lifecycle hooks.
	 */
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		/** @type {CSSStyleSheet} */
		this.styleSheet = polisher.styleSheet;

		/**
		 * Map of selectors and their associated UUID and declarations.
		 * @type {Object.<string, [string, string]>}
		 */
		this.selectors = {};
	}

	/**
	 * Hook called during CSS rule parsing.
	 * Intercepts `:first-of-type`, `:last-of-type`, and `:nth-of-type` selectors,
	 * removes the rule, and stores the relevant declarations and a UUID for later use.
	 *
	 * @param {Object} ruleNode - The AST node representing the CSS rule.
	 * @param {Object} ruleItem - The rule item in the CSS rule list.
	 * @param {Object} rulelist - The list of all CSS rules.
	 */
	onRule(ruleNode, ruleItem, rulelist) {
		let selector = csstree.generate(ruleNode.prelude);
		if (selector.match(/:(first|last|nth)-of-type/)) {
			let declarations = csstree.generate(ruleNode.block);
			declarations = declarations.replace(/[{}]/g, "");

			let uuid = "nth-of-type-" + UUID();

			selector.split(",").forEach((s) => {
				if (!this.selectors[s]) {
					this.selectors[s] = [uuid, declarations];
				} else {
					this.selectors[s][1] = `${this.selectors[s][1]};${declarations}`;
				}
			});

			rulelist.remove(ruleItem); // Remove original pseudo selector rule
		}
	}

	/**
	 * Hook called after the entire content is parsed but before layout.
	 * Applies the transformed attribute-based selectors to relevant elements.
	 *
	 * @param {Document|HTMLElement} parsed - The parsed document or content element.
	 */
	afterParsed(parsed) {
		this.processSelectors(parsed, this.selectors);
	}

	/**
	 * Applies unique `data-nth-of-type` attributes to elements matching selectors,
	 * and dynamically inserts the converted rules into the stylesheet.
	 *
	 * @param {Document|HTMLElement} parsed - The parsed content.
	 * @param {Object.<string, [string, string]>} selectors - Map of selectors and their UUID + declarations.
	 */
	processSelectors(parsed, selectors) {
		for (let s in selectors) {
			let elements = parsed.querySelectorAll(s);

			for (let i = 0; i < elements.length; i++) {
				let dataNthOfType = elements[i].getAttribute("data-nth-of-type");

				if (dataNthOfType && dataNthOfType !== "") {
					// Append new UUID to existing attribute
					dataNthOfType = `${dataNthOfType},${selectors[s][0]}`;
					elements[i].setAttribute("data-nth-of-type", dataNthOfType);
				} else {
					elements[i].setAttribute("data-nth-of-type", selectors[s][0]);
				}
			}

			// Insert a new CSS rule using attribute selector
			let rule = `*[data-nth-of-type*='${selectors[s][0]}'] { ${selectors[s][1]}; }`;
			this.styleSheet.insertRule(rule, this.styleSheet.cssRules.length);
		}
	}
}

export default NthOfType;

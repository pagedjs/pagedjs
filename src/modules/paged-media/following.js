import Handler from "../handler.js";
import csstree from "css-tree";
import { UUID } from "../../utils/utils.js";

class Following extends Handler {
	/**
	 * Creates an instance of Following handler.
	 *
	 * @param {Object} chunker - The chunker instance.
	 * @param {Object} polisher - The polisher instance.
	 * @param {Object} caller - The caller instance.
	 */
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		/**
		 * Reference to the stylesheet where new CSS rules will be inserted.
		 */
		this.styleSheet = polisher.styleSheet;

		/**
		 * Stores selectors with their associated UUIDs and declarations.
		 * Structure: { selector: [uuid, declarations] }
		 */
		this.selectors = {};
	}

	onRule(ruleNode, ruleItem, rulelist) {
		let selector = csstree.generate(ruleNode.prelude);
		if (selector.match(/\+/)) {
			let declarations = csstree.generate(ruleNode.block);
			declarations = declarations.replace(/[{}]/g, "");

			let uuid = "following-" + UUID();

			selector.split(",").forEach((s) => {
				if (!this.selectors[s]) {
					this.selectors[s] = [uuid, declarations];
				} else {
					this.selectors[s][1] = `${this.selectors[s][1]};${declarations}`;
				}
			});

			try {
				rulelist.remove(ruleItem);
			}catch(e) {
				console.warn("Unable to remove rule (ignoring):", selector);
			}
		}
	}
	afterParsed(parsed) {
		this.processSelectors(parsed, this.selectors);
	}

	/**
	 * For each stored selector, finds matching elements in the parsed document,
	 * adds a data-following attribute with the selector's UUID,
	 * and inserts corresponding CSS rules into the stylesheet.
	 *
	 * @param {Document} parsed - The parsed document to query elements from.
	 * @param {Object} selectors - Map of selectors with UUID and declarations.
	 */
	processSelectors(parsed, selectors) {
		// add the new attributes to matching elements
		for (let s in selectors) {
			let elements = parsed.querySelectorAll(s);

			for (var i = 0; i < elements.length; i++) {
				let dataFollowing = elements[i].getAttribute("data-following");

				if (dataFollowing && dataFollowing != "") {
					dataFollowing = `${dataFollowing},${selectors[s][0]}`;
					elements[i].setAttribute("data-following", dataFollowing);
				} else {
					elements[i].setAttribute("data-following", selectors[s][0]);
				}
			}

			let rule = `*[data-following*='${selectors[s][0]}'] { ${selectors[s][1]}; }`;
			this.styleSheet.insertRule(rule, this.styleSheet.cssRules.length);
		}
	}
}

export default Following;

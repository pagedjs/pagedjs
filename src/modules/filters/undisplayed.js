import Handler from "../handler.js";
import csstree from "css-tree";
import { calculateSpecificity } from "clear-cut";
import { cleanSelector } from "../../utils/css.js";

/**
 * Handler that identifies and marks elements styled with `display: none` from CSS or inline styles.
 *
 * @class
 * @extends Handler
 */
class UndisplayedFilter extends Handler {
	/**
	 * Creates an instance of UndisplayedFilter.
	 *
	 * @param {Object} chunker - The chunker managing document flow.
	 * @param {Object} polisher - The polisher managing post-processing.
	 * @param {Object} caller - The entity invoking the handler.
	 */
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		/**
		 * A map of CSS selectors to display rules (`display: none`, etc).
		 * @type {Object.<string, Object>}
		 */
		this.displayRules = {};
	}

	/**
	 * Captures display declarations during CSS parsing.
	 *
	 * @param {Object} declaration - The CSS declaration node.
	 * @param {Object} dItem - The declaration item in the AST.
	 * @param {Array} dList - The list of declarations.
	 * @param {Object} rule - The associated CSS rule.
	 */
	onDeclaration(declaration, dItem, dList, rule) {
		if (declaration.property === "display") {
			const selector = csstree.generate(rule.ruleNode.prelude);
			const value = declaration.value.children.first().name;

			selector.split(",").forEach((s) => {
				this.displayRules[s] = {
					value: value,
					selector: s,
					specificity: calculateSpecificity(s),
					important: declaration.important,
				};
			});
		}
	}

	/**
	 * Filters out or marks elements that are not meant to be displayed.
	 *
	 * @param {HTMLElement | DocumentFragment} content - The DOM content to be filtered.
	 */
	filter(content) {
		const { matches, selectors } = this.sortDisplayedSelectors(
			content,
			this.displayRules,
		);

		// Process CSS-based display: none
		for (let i = 0; i < matches.length; i++) {
			const element = matches[i];
			const selector = selectors[i];
			const displayValue = selector[selector.length - 1].value;

			if (this.removable(element) && displayValue === "none") {
				element.dataset.undisplayed = "undisplayed";
			}
		}

		// Process inline styles
		const styledElements = content.querySelectorAll("[style]");
		for (let i = 0; i < styledElements.length; i++) {
			const element = styledElements[i];
			if (this.removable(element)) {
				element.dataset.undisplayed = "undisplayed";
			}
		}
	}

	/**
	 * Sorts display rules based on `!important` and specificity, used for resolving conflicts.
	 *
	 * @private
	 * @param {Object} a - First display rule.
	 * @param {Object} b - Second display rule.
	 * @returns {number} Sort order.
	 */
	sorter(a, b) {
		if (a.important && !b.important) {
			return 1;
		}

		if (b.important && !a.important) {
			return -1;
		}

		return a.specificity - b.specificity;
	}

	/**
	 * Matches display rules against elements and sorts them by specificity and importance.
	 *
	 * @param {HTMLElement | DocumentFragment} content - The DOM content to search.
	 * @param {Object.<string, Object>} displayRules - CSS display rules to apply.
	 * @returns {{ matches: HTMLElement[], selectors: Object[][] }} Matched elements and their rules.
	 */
	sortDisplayedSelectors(content, displayRules = {}) {
		let matches = [];
		let selectors = [];

		for (let d in displayRules) {
			const displayItem = displayRules[d];
			const selector = displayItem.selector;

			let query = [];

			try {
				try {
					query = content.querySelectorAll(selector);
				} catch (e) {
					query = content.querySelectorAll(cleanSelector(selector));
				}
			} catch (e) {
				query = [];
			}

			const elements = Array.from(query);

			for (let e of elements) {
				const index = matches.indexOf(e);
				if (index !== -1) {
					selectors[index].push(displayItem);
					selectors[index] = selectors[index].sort(this.sorter);
				} else {
					matches.push(e);
					selectors.push([displayItem]);
				}
			}
		}

		return { matches, selectors };
	}

	/**
	 * Determines whether an element is removable based on its inline display style.
	 *
	 * @param {HTMLElement} element - The element to check.
	 * @returns {boolean} True if the element is considered removable.
	 */
	removable(element) {
		if (
			element.style &&
			element.style.display !== "" &&
			element.style.display !== "none"
		) {
			return false;
		}

		return true;
	}
}

export default UndisplayedFilter;

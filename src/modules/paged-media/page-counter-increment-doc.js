import Handler from "../handler.js";
import csstree from "css-tree";

/**
 * Handles `counter-increment` rules related to the `page` counter.
 *
 * This class identifies `counter-increment: page` declarations that appear outside
 * of the `@page` context and applies them by inserting equivalent CSS custom property
 * rules. This allows for controlling page-based counters from regular content.
 *
 * Reference: https://www.w3.org/TR/css-page-3/#page-based-counters
 */
class PageCounterIncrement extends Handler {
	/**
	 * Constructs a PageCounterIncrement handler.
	 *
	 * @param {Object} chunker - The chunker instance used during pagination.
	 * @param {Object} polisher - The polisher instance used for styling.
	 * @param {Object} caller - The caller coordinating the handlers.
	 */
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		/** @type {CSSStyleSheet} */
		this.styleSheet = polisher.styleSheet;

		/**
		 * Tracks page counter increments and resets by selector.
		 * Only the "page" counter is processed.
		 * @type {{
		 *   name: string,
		 *   increments: Object.<string, {selector: string, number: number}>,
		 *   resets: Object
		 * }}
		 */
		this.pageCounter = {
			name: "page",
			increments: {},
			resets: {}, // Not used yet
		};
	}

	/**
	 * Handles CSS declarations during parsing.
	 * Specifically looks for `counter-increment: page` and collects them.
	 *
	 * @param {Object} declaration - The CSS declaration AST node.
	 * @param {Object} dItem - The item in the declaration list.
	 * @param {Object} dList - The list of declarations.
	 * @param {Object} rule - The parent rule node.
	 */
	onDeclaration(declaration, dItem, dList, rule) {
		const property = declaration.property;

		if (property === "counter-increment") {
			let inc = this.handleIncrement(declaration, rule);
			if (inc) {
				dList.remove(dItem); // Remove original declaration
			}
		}
	}

	/**
	 * Hook called after parsing is complete.
	 * Applies the processed counter-increments as CSS custom properties.
	 *
	 * @param {*} _ - Unused parameter (parsed content).
	 */
	afterParsed(_) {
		for (const inc in this.pageCounter.increments) {
			const increment = this.pageCounter.increments[inc];
			console.log(increment); // Debug logging
			this.insertRule(
				`${increment.selector} { --pagedjs-page-counter-increment: ${increment.number} }`,
			);
		}
	}

	/**
	 * Parses a `counter-increment` declaration and determines if it's relevant.
	 *
	 * @param {Object} declaration - The `counter-increment` declaration node.
	 * @param {Object} rule - The parent rule node.
	 * @returns {Object|undefined} The parsed increment object or undefined if ignored.
	 */
	handleIncrement(declaration, rule) {
		const identifier = declaration.value.children.first();
		const number =
			declaration.value.children.getSize() > 1
				? declaration.value.children.last().value
				: 1;
		const name = identifier && identifier.name;

		// Skip target-counter-* pseudo counters
		if (name && name.indexOf("target-counter-") === 0) {
			return;
		}

		// Only process 'page' counter
		if (name !== "page") {
			return;
		}

		// Skip if declaration is already inside @page rule
		if (rule.ruleNode.name === "page" && rule.ruleNode.type === "Atrule") {
			return;
		}

		// Convert selector to string
		const selector = csstree.generate(rule.ruleNode.prelude);

		// Store for later rule insertion
		return (this.pageCounter.increments[selector] = {
			selector: selector,
			number,
		});
	}

	/**
	 * Inserts a rule into the active stylesheet.
	 *
	 * @param {string} rule - The CSS rule string to insert.
	 */
	insertRule(rule) {
		this.styleSheet.insertRule(rule, this.styleSheet.cssRules.length);
	}
}

export default PageCounterIncrement;

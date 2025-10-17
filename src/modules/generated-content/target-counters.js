import Handler from "../handler.js";
import { attr, querySelectorEscape, UUID } from "../../utils/utils.js";
import csstree from "css-tree";

/**
 * Handler for processing CSS target-counter() functions.
 *
 * Parses CSS rules using target-counter(), replaces them with CSS counters,
 * and dynamically manages counter-reset rules based on page layout.
 *
 * This allows counters to track values of elements targeted via attributes,
 * supporting complex page-based counters in paged media.
 *
 * @extends Handler
 */
class TargetCounters extends Handler {
	/**
	 * Creates an instance of TargetCounters.
	 *
	 * @param {Object} chunker - The chunker instance managing pagination.
	 * @param {Object} polisher - The polisher instance responsible for CSS injection and post-processing.
	 * @param {Object} caller - The caller or controller managing this handler.
	 */
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		/**
		 * Reference to the stylesheet where counter rules will be inserted.
		 * @type {CSSStyleSheet}
		 */
		this.styleSheet = polisher.styleSheet;

		/**
		 * Stores parsed target counter definitions keyed by selector.
		 * @type {Object<string, Object>}
		 */
		this.counterTargets = {};
	}

	/**
	 * Processes CSS content function nodes to detect and handle `target-counter()` functions.
	 * Replaces the function with a CSS counter variable and stores necessary metadata.
	 *
	 * @param {Object} funcNode - The CSS function node representing `target-counter()`.
	 * @param {Object} fItem - The current function node item (unused).
	 * @param {Object} fList - The function list (unused).
	 * @param {Object} declaration - The CSS declaration node.
	 * @param {Object} rule - The CSS rule node containing the declaration.
	 */
	onContent(funcNode, fItem, fList, declaration, rule) {
		if (funcNode.name === "target-counter") {
			// Extract the selector for this rule
			let selector = csstree.generate(rule.ruleNode.prelude);

			// Get the first child function name (usually attr)
			let first = funcNode.children.first();
			let func = first.name;

			// Full generated CSS value of the target-counter function
			let value = csstree.generate(funcNode);

			// Extract arguments (identifiers) for the first child function
			let args = [];
			first.children.forEach((child) => {
				if (child.type === "Identifier") {
					args.push(child.name);
				}
			});

			let counter, style, styleIdentifier;

			// Extract counter name and optional style identifier
			funcNode.children.forEach((child) => {
				if (child.type === "Identifier") {
					if (!counter) {
						counter = child.name;
					} else if (!style) {
						styleIdentifier = csstree.clone(child);
						style = child.name;
					}
				}
			});

			// Generate a unique CSS variable name for this counter
			let variable = "target-counter-" + UUID();

			// Support multiple selectors by splitting and adding each individually
			selector.split(",").forEach((s) => {
				this.counterTargets[s] = {
					func: func,
					args: args,
					value: value,
					counter: counter,
					style: style,
					selector: s,
					fullSelector: selector,
					variable: variable,
				};
			});

			// Replace the original target-counter() function with a CSS counter() function
			funcNode.name = "counter";
			funcNode.children = new csstree.List();
			funcNode.children.appendData({
				type: "Identifier",
				loc: 0,
				name: variable,
			});

			// If a style identifier was provided, append it as a second argument
			if (styleIdentifier) {
				funcNode.children.appendData({
					type: "Operator",
					loc: null,
					value: ",",
				});
				funcNode.children.appendData(styleIdentifier);
			}
		}
	}

	/**
	 * Called after page layout to update CSS rules for counters targeting elements in the pages.
	 * Inserts CSS rules dynamically to reset counters on elements matching the target selectors.
	 *
	 * @param {DocumentFragment} fragment - The fragment of the current page.
	 * @param {Object} page - The page object (unused here).
	 * @param {Object} breakToken - The pagination break token (unused here).
	 * @param {Object} chunker - The chunker instance containing the pagesArea DOM.
	 */
	afterPageLayout(fragment, page, breakToken, chunker) {
		Object.keys(this.counterTargets).forEach((name) => {
			let target = this.counterTargets[name];
			// Split selector by pseudo elements/classes
			let split = target.selector.split(/::?/g);
			let query = split[0];

			// Select elements not yet processed (without the data attribute)
			let queried = chunker.pagesArea.querySelectorAll(
				query + ":not([data-" + target.variable + "])",
			);

			queried.forEach((selected) => {
				// Currently only supports `attr` function; skip others
				if (target.func !== "attr") {
					return;
				}

				// Get the attribute value used for targeting
				let val = attr(selected, target.args);
				let element = chunker.pagesArea.querySelector(querySelectorEscape(val));

				if (element) {
					// Generate a unique selector id for this instance
					let selector = UUID();

					// Mark the selected element as processed
					selected.setAttribute("data-" + target.variable, selector);

					// Handle pseudo elements if present
					let pseudo = "";
					if (split.length > 1) {
						pseudo += "::" + split[1];
					}

					if (target.counter === "page") {
						// Calculate page counter value by checking page resets and increments
						let pages = chunker.pagesArea.querySelectorAll(".pagedjs_page");
						let pg = 0;
						for (let i = 0; i < pages.length; i++) {
							let page = pages[i];
							let styles = window.getComputedStyle(page);
							let reset = styles["counter-reset"].replace("page", "").trim();
							let increment = styles["counter-increment"]
								.replace("page", "")
								.trim();

							if (reset !== "none") {
								pg = parseInt(reset);
							}
							if (increment !== "none") {
								pg += parseInt(increment);
							}

							if (page.contains(element)) {
								break;
							}
						}

						// Insert CSS rule to reset the custom counter variable on the targeted element
						this.styleSheet.insertRule(
							`[data-${target.variable}="${selector}"]${pseudo} { counter-reset: ${target.variable} ${pg}; }`,
							this.styleSheet.cssRules.length,
						);
					} else {
						// For other counters, get the value from a data attribute and set it
						let value = element.getAttribute(
							`data-counter-${target.counter}-value`,
						);
						if (value) {
							this.styleSheet.insertRule(
								`[data-${target.variable}="${selector}"]${pseudo} { counter-reset: ${target.variable} ${target.variable} ${parseInt(value)}; }`,
								this.styleSheet.cssRules.length,
							);
						}
					}

					// Force browser redraw by toggling display style
					let el = document.querySelector(
						`[data-${target.variable}="${selector}"]`,
					);
					if (el) {
						el.style.display = "none";
						el.clientHeight; // trigger reflow
						el.style.removeProperty("display");
					}
				}
			});
		});
	}
}

export default TargetCounters;

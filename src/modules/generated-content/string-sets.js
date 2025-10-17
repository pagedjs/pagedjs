import Handler from "../handler.js";
import csstree from "css-tree";
import { cleanPseudoContent } from "../../utils/css.js";

/**
 * Handles CSS string-set properties to create and manage CSS custom properties
 * for first, last, start, and first-except string values on paged content.
 *
 * Parses the `string-set` CSS declaration, transforms `string()` function content,
 * and updates CSS variables on each page after layout.
 *
 * @class
 * @extends Handler
 */
class StringSets extends Handler {
	/**
	 * Creates an instance of StringSets.
	 *
	 * @param {Object} chunker - Chunker instance to manage content chunking.
	 * @param {Object} polisher - Polisher instance for post-processing.
	 * @param {Object} caller - Calling controller instance.
	 */
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		/**
		 * Stores selectors and related string-set info keyed by identifier.
		 * @type {Object<string, {identifier: string, func: string, value: string, selector: string}>}
		 */
		this.stringSetSelectors = {};

		/**
		 * Holds the type of string currently processed (e.g. "first", "last").
		 * @type {string|undefined}
		 */
		this.type;

		/**
		 * Keeps track of the last string value per identifier on the previous page.
		 * @type {Object<string, string>|undefined}
		 */
		this.pageLastString;
	}

	/**
	 * Handles CSS declarations, looking specifically for `string-set` declarations.
	 * Parses identifiers and functions, storing them with selectors.
	 *
	 * @param {Object} declaration - The CSS declaration node.
	 * @param {Object} dItem - Declaration item (unused here).
	 * @param {Object} dList - Declaration list (unused here).
	 * @param {Object} rule - The CSS rule node containing the declaration.
	 */
	onDeclaration(declaration, dItem, dList, rule) {
		if (declaration.property === "string-set") {
			let selector = csstree.generate(rule.ruleNode.prelude);

			let identifiers = [];
			let functions = [];
			let values = [];

			declaration.value.children.forEach((child) => {
				if (child.type === "Identifier") {
					identifiers.push(child.name);
				}
				if (child.type === "Function") {
					functions.push(child.name);
					child.children.forEach((subchild) => {
						if (subchild.type === "Identifier") {
							values.push(subchild.name);
						}
					});
				}
			});

			identifiers.forEach((identifier, index) => {
				let func = functions[index];
				let value = values[index];
				this.stringSetSelectors[identifier] = {
					identifier,
					func,
					value,
					selector,
				};
			});
		}
	}

	/**
	 * Processes `string()` CSS function nodes within content declarations,
	 * transforming them into CSS variables referencing pagedjs-generated custom properties.
	 *
	 * @param {Object} funcNode - The function node representing `string()`.
	 * @param {Object} fItem - Function item node (unused here).
	 * @param {Object} fList - Function list node (unused here).
	 * @param {Object} declaration - The CSS declaration node.
	 * @param {Object} rule - The CSS rule node.
	 */
	onContent(funcNode, fItem, fList, declaration, rule) {
		if (funcNode.name === "string") {
			let identifier = funcNode.children && funcNode.children.first().name;
			this.type = funcNode.children.last().name;
			funcNode.name = "var";
			funcNode.children = new csstree.List();

			if (
				this.type === "first" ||
				this.type === "last" ||
				this.type === "start" ||
				this.type === "first-except"
			) {
				funcNode.children.append(
					funcNode.children.createItem({
						type: "Identifier",
						loc: null,
						name: `--pagedjs-string-${this.type}-${identifier}`,
					}),
				);
			} else {
				funcNode.children.append(
					funcNode.children.createItem({
						type: "Identifier",
						loc: null,
						name: `--pagedjs-string-first-${identifier}`,
					}),
				);
			}
		}
	}

	/**
	 * Called after page layout to update CSS custom properties for string-set variables.
	 * Computes first, last, start, and first-except string values and sets them as CSS variables.
	 *
	 * @param {DocumentFragment} fragment - The DOM fragment for the current page.
	 */
	afterPageLayout(fragment) {
		if (this.pageLastString === undefined) {
			this.pageLastString = {};
		}

		for (let name of Object.keys(this.stringSetSelectors)) {
			let set = this.stringSetSelectors[name];
			let value = set.value;
			let func = set.func;
			let selected = fragment.querySelectorAll(set.selector);

			// Previous page's last string value for this identifier
			let stringPrevPage =
				name in this.pageLastString ? this.pageLastString[name] : "";

			let varFirst, varLast, varStart, varFirstExcept;

			if (selected.length === 0) {
				// No matches on this page; carry forward previous value
				varFirst = stringPrevPage;
				varLast = stringPrevPage;
				varStart = stringPrevPage;
				varFirstExcept = stringPrevPage;
			} else {
				selected.forEach((sel) => {
					if (func === "content") {
						this.pageLastString[name] =
							selected[selected.length - 1].textContent;
					} else if (func === "attr") {
						this.pageLastString[name] =
							selected[selected.length - 1].getAttribute(value) || "";
					}
				});

				// FIRST
				if (func === "content") {
					varFirst = selected[0].textContent;
				} else if (func === "attr") {
					varFirst = selected[0].getAttribute(value) || "";
				}

				// LAST
				if (func === "content") {
					varLast = selected[selected.length - 1].textContent;
				} else if (func === "attr") {
					varLast = selected[selected.length - 1].getAttribute(value) || "";
				}

				// START — heuristic: element at the top of page content
				let selTop = selected[0].getBoundingClientRect().top;
				let pageContent = selected[0].closest(".pagedjs_page_content");
				let pageContentTop = pageContent.getBoundingClientRect().top;

				if (selTop === pageContentTop) {
					varStart = varFirst;
				} else {
					varStart = stringPrevPage;
				}

				// FIRST EXCEPT — currently empty string, can be implemented as needed
				varFirstExcept = "";
			}

			fragment.style.setProperty(
				`--pagedjs-string-first-${name}`,
				`"${cleanPseudoContent(varFirst)}"`,
			);
			fragment.style.setProperty(
				`--pagedjs-string-last-${name}`,
				`"${cleanPseudoContent(varLast)}"`,
			);
			fragment.style.setProperty(
				`--pagedjs-string-start-${name}`,
				`"${cleanPseudoContent(varStart)}"`,
			);
			fragment.style.setProperty(
				`--pagedjs-string-first-except-${name}`,
				`"${cleanPseudoContent(varFirstExcept)}"`,
			);
		}
	}
}

export default StringSets;

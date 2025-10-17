import Handler from "../handler.js";
import { UUID, attr, querySelectorEscape } from "../../utils/utils.js";
import { cleanPseudoContent } from "../../utils/css.js";
import csstree from "css-tree";

class TargetText extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		/** @type {CSSStyleSheet} */
		this.styleSheet = polisher.styleSheet;

		/** Stores target-text info keyed by selector */
		this.textTargets = {};

		/** Stores content strings from ::before pseudo */
		this.beforeContent = "";

		/** Stores content strings from ::after pseudo */
		this.afterContent = "";

		/** The current selector string */
		this.selector = {};
	}

	/**
	 * Processes `target-text()` CSS function.
	 * Extracts selector, arguments, and optional style,
	 * then replaces the function with a CSS variable reference.
	 *
	 * @param {Object} funcNode - AST node for the CSS function.
	 * @param {Object} fItem - function node item (unused here).
	 * @param {Object} fList - function list (unused here).
	 * @param {Object} declaration - CSS declaration node (unused).
	 * @param {Object} rule - CSS rule node containing the declaration.
	 */
	onContent(funcNode, fItem, fList, declaration, rule) {
		if (funcNode.name === "target-text") {
			// Get the full selector string for the rule
			this.selector = csstree.generate(rule.ruleNode.prelude);

			// Extract the first and last function arguments
			let first = funcNode.children.first();
			let last = funcNode.children.last();

			// The function inside target-text, e.g., "attr"
			let func = first.name;

			// Serialized original function value
			let value = csstree.generate(funcNode);

			// Extract arguments from first function's children
			let args = [];
			first.children.forEach((child) => {
				if (child.type === "Identifier") {
					args.push(child.name);
				}
			});

			// Optional style argument (like "before", "after", etc.)
			let style;
			if (last !== first) {
				style = last.name;
			}

			// Generate a unique CSS variable name for this target-text instance
			let variable = "--pagedjs-" + UUID();

			// Support multiple selectors separated by commas
			this.selector.split(",").forEach((s) => {
				this.textTargets[s] = {
					func: func,
					args: args,
					value: value,
					style: style || "content",
					selector: s,
					fullSelector: this.selector,
					variable: variable,
				};
			});

			// Replace target-text() with var(--pagedjs-UUID)
			funcNode.name = "var";
			funcNode.children = new csstree.List();
			funcNode.children.appendData({
				type: "Identifier",
				loc: 0,
				name: variable,
			});
		}
	}

	/**
	 * Extracts content strings from ::before and ::after pseudo-elements,
	 * used to populate dynamic CSS variables later.
	 *
	 * @param {Object} pseudoNode - AST node for the pseudo-element selector.
	 * @param {Object} pItem - pseudo node item (unused).
	 * @param {Object} pList - pseudo list (unused).
	 * @param {string} selector - The selector string for this rule.
	 * @param {Object} rule - The CSS rule node containing properties.
	 */
	onPseudoSelector(pseudoNode, pItem, pList, selector, rule) {
		rule.ruleNode.block.children.forEach((properties) => {
			if (pseudoNode.name === "before" && properties.property === "content") {
				properties.value.children.forEach((prop) => {
					if (prop.type === "String") {
						this.beforeContent = prop.value;
					}
				});
			} else if (
				pseudoNode.name === "after" &&
				properties.property === "content"
			) {
				properties.value.children.forEach((prop) => {
					if (prop.type === "String") {
						this.afterContent = prop.value;
					}
				});
			}
		});
	}

	/**
	 * Called after the document fragment is parsed.
	 * Queries elements matching the stored selectors,
	 * extracts text or pseudo content, and injects
	 * corresponding CSS custom properties with sanitized values.
	 *
	 * @param {DocumentFragment} fragment - The current page fragment.
	 */
	afterParsed(fragment) {
		Object.keys(this.textTargets).forEach((name) => {
			let target = this.textTargets[name];

			// Split selector to separate pseudo elements if any
			let split = target.selector.split(/::?/g);
			let query = split[0];

			let queried = fragment.querySelectorAll(query);
			let textContent;

			queried.forEach((selected) => {
				// Get the attribute value(s) for targeting (usually attr selectors)
				let val = attr(selected, target.args);
				let element = fragment.querySelector(querySelectorEscape(val));

				if (element) {
					if (target.style) {
						this.selector = UUID();
						selected.setAttribute("data-target-text", this.selector);

						let pseudo = "";
						if (split.length > 1) {
							pseudo += "::" + split[1];
						}

						// Determine the content depending on style (before, after, first-letter, or normal content)
						if (target.style === "before" || target.style === "after") {
							const pseudoType = `${target.style}Content`;
							textContent = cleanPseudoContent(this[pseudoType]);
						} else {
							textContent = cleanPseudoContent(element.textContent, " ");
						}

						// If style is first-letter, take only first char
						if (target.style === "first-letter") {
							textContent = textContent.charAt(0);
						}

						// Insert CSS rule to assign the variable with the extracted content
						this.styleSheet.insertRule(
							`[data-target-text="${this.selector}"]${pseudo} { ${target.variable}: "${textContent}" }`,
						);
					} else {
						console.warn("missed target", val);
					}
				}
			});
		});
	}
}

export default TargetText;

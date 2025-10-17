import Handler from "../handler.js";
import csstree from "css-tree";

/**
 * Handles CSS Running Headers/Footers using the `position: running()` and `content: element()` CSS features.
 *
 * Tracks selectors with running headers, manages their capture and placement,
 * and applies them during page layout.
 *
 * @class
 * @extends Handler
 */
class RunningHeaders extends Handler {
	/**
	 * Creates an instance of RunningHeaders.
	 *
	 * @param {Object} chunker - The chunker instance controlling content chunking.
	 * @param {Object} polisher - The polisher instance controlling polishing/styling.
	 * @param {Object} caller - The caller or controller invoking this handler.
	 */
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		/**
		 * Stores running header selectors keyed by the running identifier.
		 */
		this.runningSelectors = {};

		/**
		 * Stores element() CSS content references keyed by selector string.
		 */
		this.elements = {};
	}

	/**
	 * Processes CSS declarations to find and store `position: running()` and `content: element()` rules.
	 *
	 * @param {Object} declaration - The CSS declaration node.
	 * @param {Object} dItem - Declaration item (not used here).
	 * @param {Object} dList - Declaration list (not used here).
	 * @param {Object} rule - The CSS rule node that contains the declaration.
	 */
	onDeclaration(declaration, dItem, dList, rule) {
		if (declaration.property === "position") {
			let selector = csstree.generate(rule.ruleNode.prelude);
			let identifier = declaration.value.children.first().name;

			if (identifier === "running") {
				let value;
				csstree.walk(declaration, {
					visit: "Function",
					enter: (node) => {
						value = node.children.first().name;
					},
				});

				this.runningSelectors[value] = {
					identifier: identifier,
					value: value,
					selector: selector,
				};
			}
		}

		if (declaration.property === "content") {
			csstree.walk(declaration, {
				visit: "Function",
				enter: (funcNode) => {
					if (funcNode.name.indexOf("element") > -1) {
						let selector = csstree.generate(rule.ruleNode.prelude);
						let func = funcNode.name;
						let value = funcNode.children.first().name;
						let args = [value];
						let style = "first"; // Currently only supports 'first'

						selector.split(",").forEach((s) => {
							s = s.replace(/::after|::before/, "");
							this.elements[s] = {
								func: func,
								args: args,
								value: value,
								style: style,
								selector: s,
								fullSelector: selector,
							};
						});
					}
				},
			});
		}
	}

	/**
	 * Called after the DOM fragment is parsed.
	 * Hides running header elements by setting `display: none`.
	 *
	 * @param {DocumentFragment} fragment - The parsed DOM fragment.
	 */
	afterParsed(fragment) {
		for (let name of Object.keys(this.runningSelectors)) {
			let set = this.runningSelectors[name];
			let selected = Array.from(fragment.querySelectorAll(set.selector));

			if (set.identifier === "running") {
				for (let header of selected) {
					header.style.display = "none";
				}
			}
		}
	}

	/**
	 * Called after page layout is complete.
	 * Inserts cloned running header elements into their target containers.
	 *
	 * @param {DocumentFragment} fragment - The DOM fragment for the current page.
	 */
	afterPageLayout(fragment) {
		for (let name of Object.keys(this.runningSelectors)) {
			let set = this.runningSelectors[name];
			let selected = fragment.querySelector(set.selector);
			if (selected) {
				if (set.identifier === "running") {
					set.first = selected;
				} else {
					console.warn(set.value + " needs CSS replacement");
				}
			}
		}

		if (!this.orderedSelectors) {
			this.orderedSelectors = this.orderSelectors(this.elements);
		}

		for (let selector of this.orderedSelectors) {
			if (selector) {
				let el = this.elements[selector];
				let selected = fragment.querySelector(selector);
				if (selected) {
					let running = this.runningSelectors[el.args[0]];
					if (running && running.first) {
						selected.innerHTML = ""; // Clear node
						let clone = running.first.cloneNode(true);
						clone.style.display = null;
						selected.appendChild(clone);
					}
				}
			}
		}
	}

	/**
	 * Assigns a weight to @page selector classes for ordering.
	 *
	 * Weights:
	 * 1) page
	 * 2) left & right
	 * 3) blank
	 * 4) first & nth
	 * 5) named page
	 * 6) named left & right
	 * 7) named first & nth
	 *
	 * @param {string} [s] - The selector string.
	 * @returns {number} Weight value for ordering.
	 */
	pageWeight(s) {
		let weight = 1;
		let selector = s.split(" ");
		let parts = selector.length && selector[0].split(".");

		parts.shift(); // remove empty first part

		switch (parts.length) {
			case 4:
				if (/^pagedjs_[\w-]+_first_page$/.test(parts[3])) {
					weight = 7;
				} else if (
					parts[3] === "pagedjs_left_page" ||
					parts[3] === "pagedjs_right_page"
				) {
					weight = 6;
				}
				break;
			case 3:
				if (parts[1] === "pagedjs_named_page") {
					if (parts[2].indexOf(":nth-of-type") > -1) {
						weight = 7;
					} else {
						weight = 5;
					}
				}
				break;
			case 2:
				if (parts[1] === "pagedjs_first_page") {
					weight = 4;
				} else if (parts[1] === "pagedjs_blank_page") {
					weight = 3;
				} else if (
					parts[1] === "pagedjs_left_page" ||
					parts[1] === "pagedjs_right_page"
				) {
					weight = 2;
				}
				break;
			default:
				if (parts[0].indexOf(":nth-of-type") > -1) {
					weight = 4;
				} else {
					weight = 1;
				}
		}

		return weight;
	}

	/**
	 * Orders selectors based on their page weight.
	 *
	 * Does not deduplicate selectors; later selectors overwrite previous ones.
	 *
	 * @param {Object<string, any>} obj - The selectors object.
	 * @returns {Array<string>} Ordered selectors array.
	 */
	orderSelectors(obj) {
		let selectors = Object.keys(obj);
		let weighted = {
			1: [],
			2: [],
			3: [],
			4: [],
			5: [],
			6: [],
			7: [],
		};

		let orderedSelectors = [];

		for (let s of selectors) {
			let w = this.pageWeight(s);
			weighted[w].unshift(s);
		}

		for (let i = 1; i <= 7; i++) {
			orderedSelectors = orderedSelectors.concat(weighted[i]);
		}

		return orderedSelectors;
	}

	/**
	 * Adjusts CSS text before parsing.
	 *
	 * Fixes parsing issues with `element()` by renaming it to `element-ident()`.
	 *
	 * @param {string} text - The CSS text to parse.
	 * @param {Object} sheet - The CSS stylesheet object.
	 */
	beforeTreeParse(text, sheet) {
		// element(x) is parsed as image element selector, so update element to element-ident
		sheet.text = text.replace(
			/element[\s]*\(([^|^#)]*)\)/g,
			"element-ident($1)",
		);
	}
}

export default RunningHeaders;

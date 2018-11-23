import Handler from "../handler";
import csstree from "css-tree";

class RunningHeaders extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		this.runningSelectors = {};
		this.elements = {};
	}

	onDeclaration(declaration, dItem, dList, rule) {
		if (declaration.property === "position") {
			let selector = csstree.generate(rule.ruleNode.prelude);
			let identifier = declaration.value.children.first().name;

			if (identifier === "running") {
				let value;
				csstree.walk(declaration, {
					visit: "Function",
					enter: (node, item, list) => {
						value = node.children.first().name;
					}
				});

				this.runningSelectors[value] = {
					identifier: identifier,
					value: value,
					selector: selector
				};
			}
		}

		if (declaration.property === "content") {

			csstree.walk(declaration, {
				visit: "Function",
				enter: (funcNode, fItem, fList) => {

					if (funcNode.name.indexOf("element") > -1) {

						let selector = csstree.generate(rule.ruleNode.prelude);

						let func = funcNode.name;

						let value = funcNode.children.first().name;

						let args = [value];

						// we only handle first for now
						let style = "first";

						selector.split(",").forEach((s) => {
							// remove before / after
							s = s.replace(/::after|::before/, "");

							this.elements[s] = {
								func: func,
								args: args,
								value: value,
								style: style || "first",
								selector: s,
								fullSelector: selector
							};
						});
					}

				}
			});
		}
	}

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

	afterPageLayout(fragment) {
		for (let name of Object.keys(this.runningSelectors)) {
			let set = this.runningSelectors[name];
			let selected = fragment.querySelector(set.selector);
			if (selected) {
				// let cssVar;
				if (set.identifier === "running") {
					// cssVar = selected.textContent.replace(/\\([\s\S])|(["|'])/g,"\\$1$2");
					// this.styleSheet.insertRule(`:root { --string-${name}: "${cssVar}"; }`, this.styleSheet.cssRules.length);
					// fragment.style.setProperty(`--string-${name}`, `"${cssVar}"`);
					set.first = selected;
				} else {
					console.warn(set.value + "needs css replacement");
				}
			}
		}

		// move elements
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
						// selected.classList.add("pagedjs_clear-after"); // Clear ::after
						let clone = running.first.cloneNode(true);
						clone.style.display = null;
						selected.appendChild(clone);
					}
				}
			}
		}
	}

	/**
	* Assign a weight to @page selector classes
	* 1) page
	* 2) left & right
	* 3) blank
	* 4) first & nth
	* 5) named page
	* 6) named left & right
	* 7) named first & nth
	* @param {string} [s] selector string
	* @return {int} weight
	*/
	pageWeight(s) {
		let weight = 1;
		let selector = s.split(" ");
		let parts = selector.length && selector[0].split(".");

		parts.shift(); // remove empty first part

		switch (parts.length) {
			case 4:
				if (parts[3] === "pagedjs_first_page") {
					weight = 7;
				} else if (parts[3] === "pagedjs_left_page" || parts[3] === "pagedjs_right_page") {
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
				} else if (parts[1] === "pagedjs_left_page" || parts[1] === "pagedjs_right_page") {
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
	* Orders the selectors based on weight
	*
	* Does not try to deduplicate base on specifity of the selector
	* Previous matched selector will just be overwritten
	* @param {obj} [obj] selectors object
	* @return {Array} orderedSelectors
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
			7: []
		};

		let orderedSelectors = [];

		for (let s of selectors) {
			let w = this.pageWeight(s);
			weighted[w].unshift(s);
		}

		for (var i = 1; i <= 7; i++) {
			orderedSelectors = orderedSelectors.concat(weighted[i]);
		}

		return orderedSelectors;
	}

	beforeTreeParse(text, sheet) {
		// element(x) is parsed as image element selector, so update element to element-ident
		sheet.text = text.replace(/element[\s]*\(([^|^#)]*)\)/g, "element-ident($1)");
	}
}

export default RunningHeaders;

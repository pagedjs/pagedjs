import Handler from "../handler";
import csstree from 'css-tree';

class RunningHeaders extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		this.runningSelectors = {};
		this.elements = {};
	}

	onDeclaration(declaration, dItem, dList, rule) {
		if (declaration.property === "position") {
			let selector = csstree.generate(rule.ruleNode.prelude);

			let identifier = declaration.value.children.first().name

			if (identifier === "running") {
				let value;
				csstree.walk(declaration, {
					visit: 'Function',
					enter: (node, item, list) => {
						value = node.children.first().name;
					}
				});

				this.runningSelectors[value] = {
					identifier: identifier,
					value: value,
					selector: selector
				}
			}
		}

		if (declaration.property === "content") {
			// Handle Raw
			// element(x) is not parsed
			csstree.walk(declaration, {
				visit: 'Raw',
				enter: (funcNode, fItem, fList) => {

					if (funcNode.value.indexOf("element") > -1) {

						let selector = csstree.generate(rule.ruleNode.prelude);
						let parsed = funcNode.value.match(/([^(]+)\(([^)]+)\)/);

						let func = parsed[1];

						let value = funcNode.value;

						let args = [];

						if (parsed.length >= 3) {
							args.push(parsed[2]);
						}

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
							}
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
				let cssVar;
				if (set.identifier === "running") {
					// cssVar = selected.textContent.replace(/\\([\s\S])|(["|'])/g,"\\$1$2");
					// this.styleSheet.insertRule(`:root { --string-${name}: "${cssVar}"; }`, this.styleSheet.cssRules.length);
					// fragment.style.setProperty(`--string-${name}`, `"${cssVar}"`);
					set.first = selected;
				} else {
					console.log(set.value + "needs css replacement");
				}
			}
		}

		// move elements
		for (let selector of Object.keys(this.elements)) {
			if (selector) {
				let el = this.elements[selector];
				let selected = fragment.querySelector(selector);
				if (selected) {
					let running = this.runningSelectors[el.args[0]];
					if (running.first) {
						let clone = running.first.cloneNode(true);
						clone.style.display = null;
						selected.appendChild(clone);
					}
				}
			}
		}
	}
}

export default RunningHeaders;

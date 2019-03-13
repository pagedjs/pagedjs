import Handler from "../handler";
import csstree from "css-tree";

class StringSets extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		this.stringSetSelectors = {};
	}

	onDeclaration(declaration, dItem, dList, rule) {
		if (declaration.property === "string-set") {
			let selector = csstree.generate(rule.ruleNode.prelude);

			let identifier = declaration.value.children.first().name;

			let value;
			csstree.walk(declaration, {
				visit: "Function",
				enter: (node, item, list) => {
					value = csstree.generate(node);
				}
			});

			this.stringSetSelectors[identifier] = {
				identifier: identifier,
				value: value,
				selector: selector
			};
		}
	}

	onContent(funcNode, fItem, fList, declaration, rule) {
		if (funcNode.name === "string") {
			let identifier = funcNode.children && funcNode.children.first().name;
			funcNode.name = "var";
			funcNode.children = new csstree.List();

			funcNode.children.append(funcNode.children.createItem({
				type: "Identifier",
				loc: null,
				name: "--pagedjs-string-" + identifier
			}));
		}
	}

	afterPageLayout(fragment) {
		for (let name of Object.keys(this.stringSetSelectors)) {
			let set = this.stringSetSelectors[name];
			let selected = fragment.querySelector(set.selector);
			if (selected) {
				let cssVar;
				if (set.value === "content" || set.value === "content()" || set.value === "content(text)") {
					cssVar = selected.textContent.replace(/\\([\s\S])|(["|'])/g,"\\$1$2");
					// this.styleSheet.insertRule(`:root { --pagedjs-string-${name}: "${cssVar}"; }`, this.styleSheet.cssRules.length);
					// fragment.style.setProperty(`--pagedjs-string-${name}`, `"${cssVar}"`);
					set.first = cssVar;
					fragment.style.setProperty(`--pagedjs-string-${name}`, `"${set.first}"`);
				} else {
					console.warn(set.value + "needs css replacement");
				}
			} else {
				// Use the previous values
				if (set.first) {
					fragment.style.setProperty(`--pagedjs-string-${name}`, `"${set.first}"`);
				}
			}
		}
	}
}

export default StringSets;

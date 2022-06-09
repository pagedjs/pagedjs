import Handler from "../handler.js";
import { UUID, attr, querySelectorEscape } from "../../utils/utils.js";
import { cleanPseudoContent } from "../../utils/css.js";
import csstree from "css-tree";
// import { nodeAfter } from "../../utils/dom";

class TargetText extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		this.styleSheet = polisher.styleSheet;
		this.textTargets = {};
		this.beforeContent = "";
		this.afterContent = "";
		this.selector = {};
	}

	onContent(funcNode, fItem, fList, declaration, rule) {
		if (funcNode.name === "target-text") {
			this.selector = csstree.generate(rule.ruleNode.prelude);
			let first = funcNode.children.first();
			let last = funcNode.children.last();
			let func = first.name;

			let value = csstree.generate(funcNode);

			let args = [];

			first.children.forEach(child => {
				if (child.type === "Identifier") {
					args.push(child.name);
				}
			});

			let style;
			if (last !== first) {
				style = last.name;
			}

			let variable = "--pagedjs-" + UUID();

			this.selector.split(",").forEach(s => {
				this.textTargets[s] = {
					func: func,
					args: args,
					value: value,
					style: style || "content",
					selector: s,
					fullSelector: this.selector,
					variable: variable
				};
			});

			// Replace with variable
			funcNode.name = "var";
			funcNode.children = new csstree.List();
			funcNode.children.appendData({
				type: "Identifier",
				loc: 0,
				name: variable
			});
		}
	}

	//   parse this on the ONCONTENT : get all before and after and replace the value with a variable
	onPseudoSelector(pseudoNode, pItem, pList, selector, rule) {
		// console.log(pseudoNode);
		// console.log(rule);

		rule.ruleNode.block.children.forEach(properties => {
			if (pseudoNode.name === "before" && properties.property === "content") {
				// let beforeVariable = "--pagedjs-" + UUID();

				let contenu = properties.value.children;
				contenu.forEach(prop => {
					if (prop.type === "String") {
						this.beforeContent = prop.value;
					}
				});
			} else if (pseudoNode.name === "after" && properties.property === "content") {
				properties.value.children.forEach(prop => {
					if (prop.type === "String") {
						this.afterContent = prop.value;
					}
				});
			}
		});
	}

	afterParsed(fragment) {
		Object.keys(this.textTargets).forEach(name => {
			let target = this.textTargets[name];
			let split = target.selector.split("::");
			let query = split[0];
			let queried = fragment.querySelectorAll(query);
			let textContent;
			queried.forEach((selected, index) => {
				let val = attr(selected, target.args);
				let element = fragment.querySelector(querySelectorEscape(val));
				if (element) {
					// content & first-letter & before & after refactorized
					if (target.style) {
						this.selector = UUID();
						selected.setAttribute("data-target-text", this.selector);

						let psuedo = "";
						if (split.length > 1) {
							psuedo += "::" + split[1];
						}
						
						if (target.style === "before" || target.style === "after") {
							const pseudoType = `${target.style}Content`;
							textContent = cleanPseudoContent(this[pseudoType]);
						} else {
							textContent = cleanPseudoContent(element.textContent, " ");
						}
						textContent = target.style === "first-letter" ? textContent.charAt(0) : textContent;
						this.styleSheet.insertRule(`[data-target-text="${this.selector}"]${psuedo} { ${target.variable}: "${textContent}" }`);
					} else {
						console.warn("missed target", val);
					}
				}
			});
		});
	}
}

export default TargetText;


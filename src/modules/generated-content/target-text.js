import Handler from "../handler";
import { UUID, attr, querySelectorEscape } from "../../utils/utils";
import csstree from "css-tree";

class TargetText extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		this.styleSheet = polisher.styleSheet;
		this.textTargets = {};
	}

	onContent(funcNode, fItem, fList, declaration, rule) {
		if (funcNode.name === "target-text") {
			let selector = csstree.generate(rule.ruleNode.prelude);
			let first = funcNode.children.first();
			let last = funcNode.children.last();
			let func = first.name;

			let value = csstree.generate(funcNode);

			let args = [];

			first.children.forEach((child) => {
				if (child.type === "Identifier") {
					args.push(child.name);
				}
			});

			let style;
			if (last !== first) {
				style = last.name;
			}

			let variable = "--pagedjs-" + UUID();

			selector.split(",").forEach((s) => {
				this.textTargets[s] = {
					func: func,
					args: args,
					value: value,
					style: style || "content",
					selector: s,
					fullSelector: selector,
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

	afterParsed(fragment) {
		Object.keys(this.textTargets).forEach((name) => {
			let target = this.textTargets[name];
			let split = target.selector.split("::");
			let query = split[0];
			let queried = fragment.querySelectorAll(query);
			queried.forEach((selected, index) => {
				let val = attr(selected, target.args);
				let element = fragment.querySelector(querySelectorEscape(val));
				if (element) {
					if (target.style === "content") {
						let selector = UUID();
						selected.setAttribute("data-target-text", selector);

						let psuedo = "";
						if (split.length > 1) {
							psuedo += "::" + split[1];
						}

						let textContent = element.textContent.trim().replace(/["']/g, (match) => {
							return "\\" + match;
						}).replace(/[\n]/g, (match) => {
							return "\\00000A";
						});

						// this.styleSheet.insertRule(`[data-target-text="${selector}"]${psuedo} { content: "${element.textContent}" }`, this.styleSheet.cssRules.length);
						this.styleSheet.insertRule(`[data-target-text="${selector}"]${psuedo} { ${target.variable}: "${textContent}" }`, this.styleSheet.cssRules.length);

					}
				} else {
					console.warn("missed target", val);
				}
			});

		});
	}
}

export default TargetText;

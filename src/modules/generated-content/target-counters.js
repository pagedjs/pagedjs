import Handler from "../handler";
import { UUID, attr } from "../../utils/utils";
import csstree from 'css-tree';

class TargetCounters extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		this.styleSheet = polisher.styleSheet;

		this.counterTargets = {};
	}

	onContent(funcNode, fItem, fList, declaration, rule) {
		if (funcNode.name === "target-counter") {
			let selector = csstree.generate(rule.ruleNode.prelude);
			let first = funcNode.children.first();
			let last = funcNode.children.last();
			let func = first.name;

			let value = csstree.generate(funcNode);

			let args = []

			first.children.forEach((child) => {
				if (child.type === "Identifier") {
					args.push(child.name);
				}
			});

			let counter;
			if (last !== first) {
				counter = last.name;
			}

			let variable = "--" + UUID();

			selector.split(",").forEach((s) => {
				this.counterTargets[s] = {
					func: func,
					args: args,
					value: value,
					counter: counter,
					selector: s,
					fullSelector: selector,
					variable: variable
				}
			});

			// Replace with variable
			funcNode.name = "var";
			funcNode.children = new csstree.List()
			funcNode.children.appendData({
				type: "Identifier",
				loc: 0,
				name: variable
			});
		}
	}

	afterPageLayout(fragment, page, breakToken, chunker) {
 		Object.keys(this.counterTargets).forEach((name) => {
			let target = this.counterTargets[name];
			let split = target.selector.split("::");
			let query = split[0];
			let queried = chunker.pagesArea.querySelectorAll(query + ":not([data-target-counter])");

			queried.forEach((selected, index) => {
				// TODO: handle func other than attr
				if (target.func !== "attr") {
					return;
				}
				let val = attr(selected, target.args);
				let element = chunker.pagesArea.querySelector(val);

				if (element) {
					let selector = UUID();
					selected.setAttribute("data-target-counter", selector);
					// TODO: handle other counter types (by query)
					if (target.counter === "page") {
						let pages = chunker.pagesArea.querySelectorAll(".pagedjs_page");
						let pg = 0;
						for (var i = 0; i < pages.length; i++) {
							pg += 1;
							if (pages[i].contains( element )){
								break;
							}
						}

						let psuedo = "";
						if (split.length > 1) {
							psuedo += "::" + split[1];
						}

						// this.styleSheet.insertRule(`[data-target-counter="${selector}"]${psuedo} { content: "${pg}"; }`, this.styleSheet.cssRules.length);
						this.styleSheet.insertRule(`[data-target-counter="${selector}"]${psuedo} { ${target.variable}: "${pg}" }`, this.styleSheet.cssRules.length);
					}
				}
			});
		});
	}
}

export default TargetCounters;

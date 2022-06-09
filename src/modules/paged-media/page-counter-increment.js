import Handler from "../handler.js";
import csstree from "css-tree";

class PageCounterIncrement extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		this.styleSheet = polisher.styleSheet;
		this.pageCounter = {
			name: "page",
			increments: {},
			resets: {}
		};
	}

	onDeclaration(declaration, dItem, dList, rule) {
		const property = declaration.property;

		if (property === "counter-increment") {
			let inc = this.handleIncrement(declaration, rule);
			if (inc) {
				dList.remove(dItem);
			}
		}
	}

	afterParsed(_) {
		for (const inc in this.pageCounter.increments) {
			const increment = this.pageCounter.increments[inc];
			this.insertRule(`${increment.selector} { --pagedjs-page-counter-increment: ${increment.number} }`);
		}
	}

	handleIncrement(declaration, rule) {
		const identifier = declaration.value.children.first();
		const number = declaration.value.children.getSize() > 1 ? declaration.value.children.last().value : 1;
		const name = identifier && identifier.name;

		if (name && name.indexOf("target-counter-") === 0) {
			return;
		}
		// A counter named page is automatically created and incremented by 1 on every page of the document,
		// unless the counter-increment property in the page context explicitly specifies a different increment for the page counter.
		// https://www.w3.org/TR/css-page-3/#page-based-counters
		if (name !== "page") {
			return;
		}
		// the counter-increment property is not defined on the page context (i.e. @page rule), ignoring...
		if (rule.ruleNode.name === "page" && rule.ruleNode.type === "Atrule") {
			return;
		}
		const selector = csstree.generate(rule.ruleNode.prelude);
		return this.pageCounter.increments[selector] = {
			selector: selector,
			number
		};
	}

	insertRule(rule) {
		this.styleSheet.insertRule(rule, this.styleSheet.cssRules.length);
	}
}

export default PageCounterIncrement;

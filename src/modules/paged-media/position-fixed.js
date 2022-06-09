import Handler from "../handler.js";
import csstree from "css-tree";

class PositionFixed extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);
		this.styleSheet = polisher.styleSheet;
		this.fixedElementsSelector = [];
		this.fixedElements = [];
	}

	onDeclaration(declaration, dItem, dList, rule) {
		if (declaration.property === "position" && declaration.value.children.first().name === "fixed") {
			let selector = csstree.generate(rule.ruleNode.prelude);
			this.fixedElementsSelector.push(selector);
			dList.remove(dItem);
		}
	}

	afterParsed(fragment) {
		this.fixedElementsSelector.forEach(fixedEl => {
			fragment.querySelectorAll(`${fixedEl}`).forEach(el => {
				el.style.setProperty("position", "absolute");
				this.fixedElements.push(el);
				el.remove();
			});
		});
	}

	afterPageLayout(pageElement, page, breakToken) {
		this.fixedElements.forEach(el => {
			const clone = el.cloneNode(true);
			pageElement.querySelector(".pagedjs_pagebox").insertAdjacentElement("afterbegin", clone);
		});
	}
}





export default PositionFixed;


import Handler from "../handler";
import csstree from "css-tree";
// import { registerHandlers } from "../../utils/handlers";
// import { toMatchImageSnapshot } from "jest-image-snapshot";
// import { DefaultSerializer } from "v8";
// import { identifier } from "@babel/types";


// - check  if top, left, right or bottom properties are used and stock values in var.
// - remove the position fixed on the element and set absolute
// - for each new page, add the element as the first child of .pagedjs_page
// set css for this element as position: absolute and set the positionning css top/left/right/bottom

class PositionFixed extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);
		this.styleSheet = polisher.styleSheet;
		this.fixedElementsSelector = [];
		this.fixedElements = [];
		// this.selectors = {};
		// this.clone = {};
		// this.identifier = [];
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
				el.setAttribute("fixed-clone", "");
				this.fixedElements.push(el);
				console.log(this.fixedElements);
				el.remove()
			});
		});
	}

	// after page layout add the element and fix it on the page.
	afterPageLayout(pageElement, page, breakToken) {
		// pageElement.querySelectorAll(`[fixed-clone]`).forEach(source => source.remove());
		this.fixedElements.forEach(el => {
			const clone = el.cloneNode(true);
			page.element.querySelector(".pagedjs_pagebox").insertAdjacentElement("afterbegin", clone);
		})

	}


}





export default PositionFixed;


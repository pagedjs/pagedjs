import Handler from "../handler.js";
import csstree from "css-tree";
import {UUID} from "../../utils/utils.js";

class NthOfType extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		this.styleSheet = polisher.styleSheet;
		this.selectors = {};
	}

	onRule(ruleNode, ruleItem, rulelist) {
		let selector = csstree.generate(ruleNode.prelude);
		if (selector.match(/:(first|last|nth)-of-type/)) {
			
			let declarations = csstree.generate(ruleNode.block);
			declarations = declarations.replace(/[{}]/g,"");

			let uuid = "nth-of-type-" + UUID();

			selector.split(",").forEach((s) => {
				if (!this.selectors[s]) {
					this.selectors[s] = [uuid, declarations];
				} else {
					this.selectors[s][1] = `${this.selectors[s][1]};${declarations}` ;
				}
			});

			rulelist.remove(ruleItem);
		}
	}

	afterParsed(parsed) {
		this.processSelectors(parsed, this.selectors);
	}

	processSelectors(parsed, selectors) {
		// add the new attributes to matching elements
		for (let s in selectors) {
			let elements = parsed.querySelectorAll(s);

			for (var i = 0; i < elements.length; i++) {
				let dataNthOfType = elements[i].getAttribute("data-nth-of-type");

				if (dataNthOfType && dataNthOfType != "") {
					dataNthOfType = `${dataNthOfType},${selectors[s][0]}`;
					elements[i].setAttribute("data-nth-of-type", dataNthOfType);
				} else {
					elements[i].setAttribute("data-nth-of-type", selectors[s][0]);
				}
			}

			let rule = `*[data-nth-of-type*='${selectors[s][0]}'] { ${selectors[s][1]}; }`;
			this.styleSheet.insertRule(rule, this.styleSheet.cssRules.length);
		}
	}
}




export default NthOfType;


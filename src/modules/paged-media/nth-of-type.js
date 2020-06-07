import Handler from "../handler";
import csstree from "css-tree";
import {UUID} from "../../utils/utils";

class NthOfType extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		this.styleSheet = polisher.styleSheet;
		this.selectors = {};
	}

	onRule(ruleNode, ruleItem, rulelist) {
		let selector = csstree.generate(ruleNode.prelude);
		if (selector.match(/:(first|last|nth)-of-type/)) {
			// process it
			console.log(ruleNode);
			
			console.log(selector);

			let declarations = csstree.generate(ruleNode.block);
			declarations = declarations.replace(/[{}]/g,"");
			console.log("DECLART");
			console.log(declarations);

			let uuid = UUID();

			// does this selector already exist in the hash?
			// if yes, just create a new rule using the existing random string.
			// if no, create a random string for it and then create the new rule

			selector.split(",").forEach((s) => {
				if (!this.selectors[s]) {
					this.selectors[s] = [uuid, declarations];
					// make the new rule
				} else {
					this.selectors[s][1] = `${this.selectors[s][1]};${declarations}` ;
					// make the new rule
					// makeRule(this.selectors[s])
				}
			});

			rulelist.remove(ruleItem);
			console.log(this.selectors);
		}
	}

	afterParsed(parsed) {
		this.processSelectors(parsed, this.selectors);
	}

	processSelectors(parsed, selectors) {
		// add the new attributes to matching elements
		for (let s in selectors) {
			// Find elements
			let elements = parsed.querySelectorAll(s);

			for (var i = 0; i < elements.length; i++) {
				elements[i].setAttribute("data-css-rule", selectors[s][0]);
			}

			let rule = `*[data-css-rule='${selectors[s][0]}'] { ${selectors[s][1]}; }`;
			this.styleSheet.insertRule(rule, this.styleSheet.cssRules.length);
		}
		console.log(this.styleSheet);
	}
}




export default NthOfType;


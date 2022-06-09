import Handler from "../handler.js";
import csstree from "css-tree";
import {UUID} from "../../utils/utils.js";

class Following extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		this.styleSheet = polisher.styleSheet;
		this.selectors = {};
	}

	onRule(ruleNode, ruleItem, rulelist) {
		let selector = csstree.generate(ruleNode.prelude);
		if (selector.match(/\+/)) {
			
			let declarations = csstree.generate(ruleNode.block);
			declarations = declarations.replace(/[{}]/g,"");

			let uuid = "following-" + UUID();

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
				let dataFollowing = elements[i].getAttribute("data-following");

				if (dataFollowing && dataFollowing != "") {
					dataFollowing = `${dataFollowing},${selectors[s][0]}`;
					elements[i].setAttribute("data-following", dataFollowing);
				} else {
					elements[i].setAttribute("data-following", selectors[s][0]);
				}
			}

			let rule = `*[data-following*='${selectors[s][0]}'] { ${selectors[s][1]}; }`;
			this.styleSheet.insertRule(rule, this.styleSheet.cssRules.length);
		}
	}
}




export default Following;


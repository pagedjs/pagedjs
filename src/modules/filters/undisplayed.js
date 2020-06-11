import Handler from "../handler";
import csstree from "css-tree";
import { calculateSpecificity } from "clear-cut";
import { cleanSelector } from "../../utils/css";

class UndisplayedFilter extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);
		this.displayRules = {};
	}

	onDeclaration(declaration, dItem, dList, rule) {
		if (declaration.property === "display") {
			let selector = csstree.generate(rule.ruleNode.prelude);
			let value = declaration.value.children.first().name;

			selector.split(",").forEach((s) => {
				this.displayRules[s] = {
					value: value,
					selector: s,
					specificity: calculateSpecificity(s),
					important: declaration.important
				};
			});
		}
	}

	filter(content) {
		let { matches, selectors } = this.sortDisplayedSelectors(content, this.displayRules);

		// Find matching elements that have display styles
		for (let i = 0; i < matches.length; i++) {
			let element = matches[i];
			let selector = selectors[i];
			let displayValue = selector[selector.length-1].value;
			if(this.removable(element) && displayValue === "none") {
				element.dataset.undisplayed = "undisplayed";
			}
		}

		// Find elements that have inline styles
		let styledElements = content.querySelectorAll("[style]");
		for (let i = 0; i < styledElements.length; i++) {
			let element = styledElements[i];
			if (this.removable(element)) {
				element.dataset.undisplayed = "undisplayed";
			}
		}
	}

	sorter(a, b) {
		if (a.important && !b.important) {
			return 1;
		}

		if (b.important && !a.important) {
			return -1;
		}

		return a.specificity - b.specificity;
	}

	sortDisplayedSelectors(content, displayRules=[]) {
		let matches = [];
		let selectors = [];
		for (let d in displayRules) {
			let displayItem = displayRules[d];
			let selector = displayItem.selector;
			let query = [];
			try {
				try {
					query = content.querySelectorAll(selector);
				} catch (e) {
					query = content.querySelectorAll(cleanSelector(selector));
				}
			} catch (e) {
				query = [];
			}
			let elements = Array.from(query);
			for (let e of elements) {
				if (matches.includes(e)) {
					let index = matches.indexOf(e);
					selectors[index].push(displayItem);
					selectors[index] = selectors[index].sort(this.sorter);
				} else {
					matches.push(e);
					selectors.push([displayItem]);
				}
			}
		}

		return { matches, selectors };
	}

	removable(element) {
		if (element.style &&
				element.style.display !== "" &&
				element.style.display !== "none") {
			return false;
		}

		return true;
	}
}

export default UndisplayedFilter;

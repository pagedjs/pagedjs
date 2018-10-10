import Handler from "../handler";
import csstree from 'css-tree';
import { rebuildAncestors, elementAfter } from "../../utils/dom";

class Counters extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		this.styleSheet = polisher.styleSheet;
		this.counters = {};
	}

	onDeclaration(declaration, dItem, dList, rule) {
		let property = declaration.property;

		if (property === "counter-increment") {
			this.handleIncrement(declaration, rule);
			dList.remove(dItem);
		} else if (property === "counter-reset") {
			this.handleReset(declaration, rule);
			dList.remove(dItem);
		}
	}

	onContent(funcNode, fItem, fList, declaration, rule) {
		if (funcNode.name === "counter") {
			// console.log("counter", funcNode);
		}
	}

	afterParsed(parsed) {
		this.processCounters(parsed, this.counters);
	}

	addCounter(name) {
		if (name in this.counters) {
			return this.counters[name];
		}

		this.counters[name] = {
			name: name,
			increments: {},
			resets: {}
		}

		return this.counters[name];
	}

	handleIncrement(declaration, rule) {
		let identifier = declaration.value.children.first();
		let number = declaration.value.children.getSize() > 1
							&& declaration.value.children.last().value;
		let name = identifier && identifier.name;
		let selector = csstree.generate(rule.ruleNode.prelude);

		let counter;
		if (!(name in this.counters)) {
			counter = this.addCounter(name);
		} else {
			counter = this.counters[name];
		}

		counter.increments[selector] = {
			selector: selector,
			number: number || 1
		};
	}

	handleReset(declaration, rule) {
		let identifier = declaration.value.children.first();
		let number = declaration.value.children.getSize() > 1
							&& declaration.value.children.last().value;
		let name = identifier && identifier.name;
		let selector = csstree.generate(rule.ruleNode.prelude);

		let counter;
		if (!(name in this.counters)) {
			counter = this.addCounter(name);
		} else {
			counter = this.counters[name];
		}

		counter.resets[selector] = {
			selector: selector,
			number: number || 0
		};
	}

	processCounters(parsed, counters) {
		let counter;
		for (let c in counters) {
			counter = this.counters[c];
			this.processCounterIncrements(parsed, counter);
			this.processCounterResets(parsed, counter);
			this.addCounterValues(parsed, counter);
		}
	}

	processCounterIncrements(parsed, counter) {
		let increment;
		for (let inc in counter.increments) {
			increment = counter.increments[inc];
			// Find elements for increments
			let incrementElements = parsed.querySelectorAll(increment.selector);
			// Add counter data
			for (var i = 0; i < incrementElements.length; i++) {
				incrementElements[i].setAttribute("data-counter-"+ counter.name +"-increment", increment.number);
			}
		}
	}

	processCounterResets(parsed, counter) {
		let reset;
		for (let r in counter.resets) {
			reset = counter.resets[r];
			// Find elements for resets
			let resetElements = parsed.querySelectorAll(reset.selector);
			// Add counter data
			for (var i = 0; i < resetElements.length; i++) {
				resetElements[i].setAttribute("data-counter-"+ counter.name +"-reset", reset.number);
			}
		}
	}

	addCounterValues(parsed, counter) {
		let counterName = counter.name;
		let elements = parsed.querySelectorAll("[data-counter-"+ counterName +"-reset], [data-counter-"+ counterName +"-increment]");

		let count = 0;
		let element;
		let increment, reset;

		for (var i = 0; i < elements.length; i++) {
			element = elements[i];

			if (element.hasAttribute("data-counter-"+ counterName +"-reset")) {
				reset = element.getAttribute("data-counter-"+ counterName +"-reset");
				count = parseInt(reset);
			}

			if (element.hasAttribute("data-counter-"+ counterName +"-increment")) {

				increment = element.getAttribute("data-counter-"+ counterName +"-increment");

				this.styleSheet.insertRule(`[data-ref="${element.dataset.ref}"] { counter-reset: ${counterName} ${count} }`, this.styleSheet.cssRules.length);
				this.styleSheet.insertRule(`[data-ref="${element.dataset.ref}"] { counter-increment: ${counterName} ${increment}}`, this.styleSheet.cssRules.length);

				count += parseInt(increment);

				element.setAttribute("data-counter-"+counterName+"-value", count);
			}

		}
	}

}

export default Counters;

import Handler from "../handler.js";
import csstree from "css-tree";

class Counters extends Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		this.styleSheet = polisher.styleSheet;
		this.counters = {};
		this.resetCountersMap = new Map();
	}

	onDeclaration(declaration, dItem, dList, rule) {
		let property = declaration.property;

		if (property === "counter-increment") {
			this.handleIncrement(declaration, rule);
			// clean up empty declaration
			let hasProperities = false;
			declaration.value.children.forEach((data) => {
				if (data.type && data.type !== "WhiteSpace") {
					hasProperities = true;
				}
			});
			if (!hasProperities) {
				dList.remove(dItem);
			}
		} else if (property === "counter-reset") {
			this.handleReset(declaration, rule);
			// clean up empty declaration
			let hasProperities = false;
			declaration.value.children.forEach((data) => {
				if (data.type && data.type !== "WhiteSpace") {
					hasProperities = true;
				}
			});
			if (!hasProperities) {
				dList.remove(dItem);
			}
		}
	}

	afterParsed(parsed) {
		this.processCounters(parsed, this.counters);
		this.scopeCounters(this.counters);
	}

	addCounter(name) {
		if (name in this.counters) {
			return this.counters[name];
		}

		this.counters[name] = {
			name: name,
			increments: {},
			resets: {}
		};

		return this.counters[name];
	}

	handleIncrement(declaration, rule) {
		let increments = [];
		let children = declaration.value.children;

		children.forEach((data, item) => {
			if (data.type && data.type === "Identifier") {
				let name = data.name;

				if (name === "page" || name.indexOf("target-counter-") === 0) {
					return;
				}

				let whitespace, number, value;
				if (item.next && item.next.data.type === "WhiteSpace") {
					whitespace = item.next;
				}
				if (whitespace && whitespace.next && whitespace.next.data.type === "Number") {
					number = whitespace.next;
					value = parseInt(number.data.value);
				}

				let selector = csstree.generate(rule.ruleNode.prelude);

				let counter;
				if (!(name in this.counters)) {
					counter = this.addCounter(name);
				} else {
					counter = this.counters[name];
				}
				let increment = {
					selector: selector,
					number: value || 1
				};
				counter.increments[selector] = increment;
				increments.push(increment);

				// Remove the parsed resets
				children.remove(item);
				if (whitespace) {
					children.remove(whitespace);
				}
				if (number) {
					children.remove(number);
				}
			}
		});
		
		return increments;
	}

	handleReset(declaration, rule) {
		let children = declaration.value.children;

		children.forEach((data, item) => {
			if (data.type && data.type === "Identifier") {
				let name = data.name;
				let whitespace, number, value;
				if (item.next && item.next.data.type === "WhiteSpace") {
					whitespace = item.next;
				}
				if (whitespace && whitespace.next) {
					if (whitespace.next.data.type === "Number") {
						// The counter reset value is specified using a number. E.g. counter-reset: c2 5;
						number = whitespace.next;
						value = parseInt(number.data.value);
					} else if (whitespace.next.data.type === "Function" && whitespace.next.data.name === "var") {
						// The counter reset value is specified using a CSS variable (custom property).
						// E.g. counter-reset: c2 var(--my-variable);
						// See https://developer.mozilla.org/en-US/docs/Web/CSS/var
						number = whitespace.next;
						// Use the variable name (e.g. '--my-variable') as value for now. The actual value is resolved later by the
						// processCounterResets function.
						value = whitespace.next.data.children.head.data.name;
					}
				}

				let counter;
				let selector;
				let prelude = rule.ruleNode.prelude;

				if (rule.ruleNode.type === "Atrule" && rule.ruleNode.name === "page") {
					selector = ".pagedjs_page";
				} else {
					selector = csstree.generate(prelude || rule.ruleNode);
				}

				if (name === "footnote") {
					this.addFootnoteMarkerCounter(declaration.value.children);
				}

				if (!(name in this.counters)) {
					counter = this.addCounter(name);
				} else {
					counter = this.counters[name];
				}

				let reset = {
					selector: selector,
					number: value || 0
				};

				counter.resets[selector] = reset;

				if (selector !== ".pagedjs_page") {
					// Remove the parsed resets
					children.remove(item);
					if (whitespace) {
						children.remove(whitespace);
					}
					if (number) {
						children.remove(number);
					}
				}
			}
		});
	}

	processCounters(parsed, counters) {
		let counter;
		for (let c in counters) {
			counter = this.counters[c];
			this.processCounterIncrements(parsed, counter);
			this.processCounterResets(parsed, counter);
			if (c !== "page") {
				this.addCounterValues(parsed, counter);
			}
		}
	}

	scopeCounters(counters) {
		let countersArray = [];
		for (let c in counters) {
			if(c !== "page") {
				countersArray.push(`${counters[c].name} 0`);
			}
		}
		// Add to pages to allow cross page scope
		this.insertRule(`.pagedjs_pages { counter-reset: ${countersArray.join(" ")} page 0 pages var(--pagedjs-page-count) footnote var(--pagedjs-footnotes-count) footnote-marker var(--pagedjs-footnotes-count)}`);
	}

	insertRule(rule) {
		this.styleSheet.insertRule(rule, this.styleSheet.cssRules.length);
	}

	processCounterIncrements(parsed, counter) {
		let increment;
		for (let inc in counter.increments) {
			increment = counter.increments[inc];
			// Find elements for increments
			let incrementElements = parsed.querySelectorAll(increment.selector);
			// Add counter data
			for (let i = 0; i < incrementElements.length; i++) {
				incrementElements[i].setAttribute("data-counter-"+ counter.name +"-increment", increment.number);
				if (incrementElements[i].getAttribute("data-counter-increment")) {
					incrementElements[i].setAttribute("data-counter-increment", incrementElements[i].getAttribute("data-counter-increment") + " " + counter.name);
				} else {
					incrementElements[i].setAttribute("data-counter-increment", counter.name);
				}
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
				let value = reset.number;
				if (typeof value === "string" && value.startsWith("--")) {
					// The value is specified using a CSS variable (custom property).
					// FIXME: We get the variable value only from the inline style of the element because at this point the
					// element is detached and thus using:
					//
					//		getComputedStyle(resetElements[i]).getPropertyValue(value)
					//
					// always returns an empty string. We could try to temporarily attach the element to get its computed style,
					// but for now using the inline style is enough for us.
					value = resetElements[i].style.getPropertyValue(value) || 0;
				}
				resetElements[i].setAttribute("data-counter-"+ counter.name +"-reset", value);
				if (resetElements[i].getAttribute("data-counter-reset")) {
					resetElements[i].setAttribute("data-counter-reset", resetElements[i].getAttribute("data-counter-reset") + " " + counter.name);
				} else {
					resetElements[i].setAttribute("data-counter-reset", counter.name);
				}
			}
		}
	}

	addCounterValues(parsed, counter) {
		let counterName = counter.name;

		if (counterName === "page" || counterName === "footnote") {
			return;
		}

		let elements = parsed.querySelectorAll("[data-counter-"+ counterName +"-reset], [data-counter-"+ counterName +"-increment]");

		let count = 0;
		let element;
		let increment, reset;
		let resetValue, incrementValue, resetDelta;
		let incrementArray;

		for (let i = 0; i < elements.length; i++) {
			element = elements[i];
			resetDelta = 0;
			incrementArray = [];

			if (element.hasAttribute("data-counter-"+ counterName +"-reset")) {
				reset = element.getAttribute("data-counter-"+ counterName +"-reset");
				resetValue = parseInt(reset);

				// Use negative increment value inplace of reset
				resetDelta = resetValue - count;
				incrementArray.push(`${counterName} ${resetDelta}`);

				count = resetValue;
			}

			if (element.hasAttribute("data-counter-"+ counterName +"-increment")) {

				increment = element.getAttribute("data-counter-"+ counterName +"-increment");
				incrementValue = parseInt(increment);

				count += incrementValue;

				element.setAttribute("data-counter-"+counterName+"-value", count);

				incrementArray.push(`${counterName} ${incrementValue}`);
			}

			if (incrementArray.length > 0) {
				this.incrementCounterForElement(element, incrementArray);
			}

		}
	}

	addFootnoteMarkerCounter(list) {
		let markers = [];
		csstree.walk(list, {
			visit: "Identifier",
			enter: (identNode, iItem, iList) => {
				markers.push(identNode.name);
			}
		});

		// Already added
		if (markers.includes("footnote-maker")) {
			return;
		}

		list.insertData({
			type: "WhiteSpace",
			value: " "
		});

		list.insertData({
			type: "Identifier",
			name: "footnote-marker"
		});

		list.insertData({
			type: "WhiteSpace",
			value: " "
		});

		list.insertData({
			type: "Number",
			value: 0
		});
	}

	incrementCounterForElement(element, incrementArray) {
		if (!element || !incrementArray || incrementArray.length === 0) return;

		const ref = element.dataset.ref;
		const increments = Array.from(this.styleSheet.cssRules).filter((rule) => {
			return rule.selectorText === `[data-ref="${element.dataset.ref}"]:not([data-split-from])`
						 && rule.style[0] === "counter-increment";
		}).map(rule => rule.style.counterIncrement);

		// Merge the current increments by summing the values because we generate both a decrement and an increment when the
		// element resets and increments the counter at the same time. E.g. ['c1 -7', 'c1 1'] should lead to 'c1 -6'.
		increments.push(this.mergeIncrements(incrementArray,
			(prev, next) => (parseInt(prev) || 0) + (parseInt(next) || 0)));

		// Keep the last value for each counter when merging with the previous increments. E.g. ['c1 -7 c2 3', 'c1 1']
		// should lead to 'c1 1 c2 3'.
		const counterIncrement = this.mergeIncrements(increments, (prev, next) => next);
		this.insertRule(`[data-ref="${ref}"]:not([data-split-from]) { counter-increment: ${counterIncrement} }`);
	}

	/**
	 * Merge multiple values of a counter-increment CSS rule, using the specified operator.
	 *
	 * @param {Array} incrementArray the values to merge, e.g. ['c1 1', 'c1 -7 c2 1']
	 * @param {Function} operator the function used to merge counter values (e.g. keep the last value of a counter or sum
	 *					the counter values)
	 * @return {string} the merged value of the counter-increment CSS rule
	 */
	mergeIncrements(incrementArray, operator) {
		const increments = {};
		incrementArray.forEach(increment => {
			let values = increment.split(" ");
			for (let i = 0; i < values.length; i+=2) {
				increments[values[i]] = operator(increments[values[i]], values[i + 1]);
			}
		});

		return Object.entries(increments).map(([key, value]) => `${key} ${value}`).join(" ");
	}

	afterPageLayout(pageElement, page) {
		let resets = [];

		let pgreset = pageElement.querySelectorAll("[data-counter-page-reset]:not([data-split-from])");
		pgreset.forEach((reset) => {
			const ref = reset.dataset && reset.dataset.ref;
			if (ref && this.resetCountersMap.has(ref)) {
				// ignoring, the counter-reset directive has already been taken into account.
			} else {
				if (ref) {
					this.resetCountersMap.set(ref, "");
				}
				let value = reset.dataset.counterPageReset;
				resets.push(`page ${value}`);
			}
		});

		let notereset = pageElement.querySelectorAll("[data-counter-footnote-reset]:not([data-split-from])");
		notereset.forEach((reset) => {
			let value = reset.dataset.counterFootnoteReset;
			resets.push(`footnote ${value}`);
			resets.push(`footnote-marker ${value}`);
		});

		if (resets.length) {
			this.styleSheet.insertRule(`[data-page-number="${pageElement.dataset.pageNumber}"] { counter-increment: none; counter-reset: ${resets.join(" ")} }`, this.styleSheet.cssRules.length);
		}
	}

}

export default Counters;

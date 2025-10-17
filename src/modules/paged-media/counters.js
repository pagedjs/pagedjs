import Handler from "../handler.js";
import csstree from "css-tree";

class Counters extends Handler {
	/**
	 * Handles CSS counter properties for paged media.
	 * @param {Object} chunker - The chunker instance managing pagination.
	 * @param {Object} polisher - The polisher instance managing CSS and styles.
	 * @param {Object} caller - The caller instance (optional, context info).
	 */
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);

		/** @type {CSSStyleSheet} */
		this.styleSheet = polisher.styleSheet;

		/**
		 * Stores counters keyed by counter name.
		 * Each counter has increments and resets keyed by selector.
		 * @type {Object.<string, {name:string, increments:Object.<string,Object>, resets:Object.<string,Object>}>}
		 */
		this.counters = {};

		/**
		 * Map tracking counters that have been reset by element reference.
		 * @type {Map<string, string>}
		 */
		this.resetCountersMap = new Map();
	}

	/**
	 * Handles a CSS declaration related to counters.
	 * Cleans up declarations once processed.
	 * @param {Object} declaration - The CSS declaration node.
	 * @param {Object} dItem - The item in the declaration list.
	 * @param {Object} dList - The list of declarations.
	 * @param {Object} rule - The CSS rule node containing the declaration.
	 */
	onDeclaration(declaration, dItem, dList, rule) {
		let property = declaration.property;

		if (property === "counter-increment") {
			this.handleIncrement(declaration, rule);
			if (!this.hasNonWhitespaceChildren(declaration.value.children)) {
				dList.remove(dItem);
			}
		} else if (property === "counter-reset") {
			this.handleReset(declaration, rule);
			if (!this.hasNonWhitespaceChildren(declaration.value.children)) {
				dList.remove(dItem);
			}
		}
	}

	/**
	 * Helper to check if node children contain non-whitespace tokens.
	 * @param {Object} children - The children node list.
	 * @returns {boolean} True if any non-whitespace tokens found.
	 */
	hasNonWhitespaceChildren(children) {
		let hasProperties = false;
		children.forEach((data) => {
			if (data.type && data.type !== "WhiteSpace") {
				hasProperties = true;
			}
		});
		return hasProperties;
	}

	/**
	 * Called after the parsed document fragment is ready.
	 * Processes counters and scopes them appropriately.
	 * @param {DocumentFragment} parsed - The parsed DOM fragment.
	 */
	afterParsed(parsed) {
		this.processCounters(parsed, this.counters);
		this.scopeCounters(this.counters);
	}

	/**
	 * Adds a new counter to the counters map or returns existing one.
	 * @param {string} name - The name of the counter.
	 * @returns {Object} The counter object.
	 */
	addCounter(name) {
		if (name in this.counters) {
			return this.counters[name];
		}

		this.counters[name] = {
			name: name,
			increments: {},
			resets: {},
		};

		return this.counters[name];
	}

	/**
	 * Parses and handles counter-increment declarations.
	 * Updates counters with increment info.
	 * @param {Object} declaration - The CSS declaration node.
	 * @param {Object} rule - The CSS rule node.
	 * @returns {Array<Object>} List of increments parsed.
	 */
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
				if (
					whitespace &&
					whitespace.next &&
					whitespace.next.data.type === "Number"
				) {
					number = whitespace.next;
					value = parseInt(number.data.value);
				}

				let selector = csstree.generate(rule.ruleNode.prelude);

				let counter = this.counters[name] || this.addCounter(name);

				let increment = {
					selector: selector,
					number: value || 1,
				};
				counter.increments[selector] = increment;
				increments.push(increment);

				// Remove the parsed increments from children
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

	/**
	 * Parses and handles counter-reset declarations.
	 * Updates counters with reset info.
	 * @param {Object} declaration - The CSS declaration node.
	 * @param {Object} rule - The CSS rule node.
	 */
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
						number = whitespace.next;
						value = parseInt(number.data.value);
					} else if (
						whitespace.next.data.type === "Function" &&
						whitespace.next.data.name === "var"
					) {
						// CSS variable as reset value
						number = whitespace.next;
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

				counter = this.counters[name] || this.addCounter(name);

				let reset = {
					selector: selector,
					number: value || 0,
				};

				counter.resets[selector] = reset;

				if (selector !== ".pagedjs_page") {
					// Remove parsed resets from children
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

	/**
	 * Processes all counters on the parsed fragment.
	 * Calls handlers for increments, resets, and value assignment.
	 * @param {DocumentFragment} parsed - The parsed DOM fragment.
	 * @param {Object} counters - The counters map.
	 */
	processCounters(parsed, counters) {
		for (let c in counters) {
			let counter = this.counters[c];
			this.processCounterIncrements(parsed, counter);
			this.processCounterResets(parsed, counter);
			if (c !== "page") {
				this.addCounterValues(parsed, counter);
			}
		}
	}

	/**
	 * Adds counter-reset CSS rules scoped on pages to allow cross page scope.
	 * @param {Object} counters - The counters map.
	 */
	scopeCounters(counters) {
		let countersArray = [];
		for (let c in counters) {
			if (c !== "page") {
				countersArray.push(`${counters[c].name} 0`);
			}
		}
		this.insertRule(
			`.pagedjs_pages { counter-reset: ${countersArray.join(" ")} page 0 pages var(--pagedjs-page-count) footnote var(--pagedjs-footnotes-count) footnote-marker var(--pagedjs-footnotes-count)}`,
		);
	}

	/**
	 * Inserts a CSS rule into the stylesheet.
	 * @param {string} rule - The CSS rule string.
	 */
	insertRule(rule) {
		this.styleSheet.insertRule(rule, this.styleSheet.cssRules.length);
	}

	/**
	 * Adds data attributes for counter increments to matching elements.
	 * @param {DocumentFragment} parsed - The parsed DOM fragment.
	 * @param {Object} counter - The counter object.
	 */
	processCounterIncrements(parsed, counter) {
		for (let inc in counter.increments) {
			let increment = counter.increments[inc];
			let incrementElements = parsed.querySelectorAll(increment.selector);
			for (let i = 0; i < incrementElements.length; i++) {
				incrementElements[i].setAttribute(
					`data-counter-${counter.name}-increment`,
					increment.number,
				);
				if (incrementElements[i].getAttribute("data-counter-increment")) {
					incrementElements[i].setAttribute(
						"data-counter-increment",
						incrementElements[i].getAttribute("data-counter-increment") +
							" " +
							counter.name,
					);
				} else {
					incrementElements[i].setAttribute(
						"data-counter-increment",
						counter.name,
					);
				}
			}
		}
	}

	/**
	 * Adds data attributes for counter resets to matching elements.
	 * Resolves CSS variables when possible.
	 * @param {DocumentFragment} parsed - The parsed DOM fragment.
	 * @param {Object} counter - The counter object.
	 */
	processCounterResets(parsed, counter) {
		for (let r in counter.resets) {
			let reset = counter.resets[r];
			let resetElements = parsed.querySelectorAll(reset.selector);
			for (var i = 0; i < resetElements.length; i++) {
				let value = reset.number;
				if (typeof value === "string" && value.startsWith("--")) {
					// Attempt to get value from inline style
					value = resetElements[i].style.getPropertyValue(value) || 0;
				}
				resetElements[i].setAttribute(
					`data-counter-${counter.name}-reset`,
					value,
				);
				if (resetElements[i].getAttribute("data-counter-reset")) {
					resetElements[i].setAttribute(
						"data-counter-reset",
						resetElements[i].getAttribute("data-counter-reset") +
							" " +
							counter.name,
					);
				} else {
					resetElements[i].setAttribute("data-counter-reset", counter.name);
				}
			}
		}
	}

	/**
	 * Calculates and adds counter values on elements.
	 * @param {DocumentFragment} parsed - The parsed DOM fragment.
	 * @param {Object} counter - The counter object.
	 */
	addCounterValues(parsed, counter) {
		let counterName = counter.name;

		if (counterName === "page" || counterName === "footnote") {
			return;
		}

		let elements = parsed.querySelectorAll(
			"[data-counter-" +
				counterName +
				"-reset], [data-counter-" +
				counterName +
				"-increment]",
		);

		let count = 0;
		let element;
		let increment, reset;
		let resetValue, incrementValue, resetDelta;
		let incrementArray;

		for (let i = 0; i < elements.length; i++) {
			element = elements[i];
			resetDelta = 0;
			incrementArray = [];

			if (element.hasAttribute("data-counter-" + counterName + "-reset")) {
				reset = element.getAttribute("data-counter-" + counterName + "-reset");
				resetValue = parseInt(reset);

				// Use negative increment value inplace of reset
				resetDelta = resetValue - count;
				incrementArray.push(`${counterName} ${resetDelta}`);

				count = resetValue;
			}

			if (element.hasAttribute("data-counter-" + counterName + "-increment")) {
				increment = element.getAttribute(
					"data-counter-" + counterName + "-increment",
				);
				incrementValue = parseInt(increment);

				count += incrementValue;

				element.setAttribute("data-counter-" + counterName + "-value", count);

				incrementArray.push(`${counterName} ${incrementValue}`);
			}

			if (incrementArray.length > 0) {
				this.incrementCounterForElement(element, incrementArray);
			}
		}
	}
	/**
	 * Ensures the footnote marker counter is included in the counter list.
	 * If "footnote-maker" is already present, it does nothing.
	 *
	 * @param {Object} list - The CSS AST list node to modify.
	 */
	addFootnoteMarkerCounter(list) {
		let markers = [];
		csstree.walk(list, {
			visit: "Identifier",
			enter: (identNode, iItem, iList) => {
				markers.push(identNode.name);
			},
		});

		// Already added
		if (markers.includes("footnote-maker")) {
			return;
		}

		list.insertData({
			type: "WhiteSpace",
			value: " ",
		});

		list.insertData({
			type: "Identifier",
			name: "footnote-marker",
		});

		list.insertData({
			type: "WhiteSpace",
			value: " ",
		});

		list.insertData({
			type: "Number",
			value: 0,
		});
	}

	/**
	 * Increment the CSS counters for a specific element, merging with existing increments.
	 *
	 * @param {HTMLElement} element - The element to update.
	 * @param {string[]} incrementArray - Array of counter-increment strings, e.g. ['c1 1', 'c2 -3'].
	 */

	incrementCounterForElement(element, incrementArray) {
		if (!element || !incrementArray || incrementArray.length === 0) return;

		const ref = element.dataset.ref;
		const increments = Array.from(this.styleSheet.cssRules)
			.filter((rule) => {
				return (
					rule.selectorText ===
						`[data-ref="${element.dataset.ref}"]:not([data-split-from])` &&
					rule.style[0] === "counter-increment"
				);
			})
			.map((rule) => rule.style.counterIncrement);

		// Merge the current increments by summing the values because we generate both a decrement and an increment when the
		// element resets and increments the counter at the same time. E.g. ['c1 -7', 'c1 1'] should lead to 'c1 -6'.
		increments.push(
			this.mergeIncrements(
				incrementArray,
				(prev, next) => (parseInt(prev) || 0) + (parseInt(next) || 0),
			),
		);

		// Keep the last value for each counter when merging with the previous increments. E.g. ['c1 -7 c2 3', 'c1 1']
		// should lead to 'c1 1 c2 3'.
		const counterIncrement = this.mergeIncrements(
			increments,
			(prev, next) => next,
		);
		this.insertRule(
			`[data-ref="${ref}"]:not([data-split-from]) { counter-increment: ${counterIncrement} }`,
		);
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
		incrementArray.forEach((increment) => {
			let values = increment.split(" ");
			for (let i = 0; i < values.length; i += 2) {
				increments[values[i]] = operator(increments[values[i]], values[i + 1]);
			}
		});

		return Object.entries(increments)
			.map(([key, value]) => `${key} ${value}`)
			.join(" ");
	}

	/**
	 * Called after page layout to apply counter-reset and counter-increment CSS rules based on page and footnote resets.
	 *
	 * @param {HTMLElement} pageElement - The page element after layout.
	 * @param {Object} page - The page metadata (not used directly here).
	 */
	afterPageLayout(pageElement, page) {
		let resets = [];

		let pgreset = pageElement.querySelectorAll(
			"[data-counter-page-reset]:not([data-split-from])",
		);
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

		let notereset = pageElement.querySelectorAll(
			"[data-counter-footnote-reset]:not([data-split-from])",
		);
		notereset.forEach((reset) => {
			let value = reset.dataset.counterFootnoteReset;
			resets.push(`footnote ${value}`);
			resets.push(`footnote-marker ${value}`);
		});

		if (resets.length) {
			this.styleSheet.insertRule(
				`[data-page-number="${pageElement.dataset.pageNumber}"] { counter-increment: none; counter-reset: ${resets.join(" ")} }`,
				this.styleSheet.cssRules.length,
			);
		}
	}
}

export default Counters;

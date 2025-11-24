/**
 * Gets the bounding client rectangle of an element.
 * Falls back to using Range if element.getBoundingClientRect is undefined.
 *
 * @param {Element} element - The DOM element to get the bounding rectangle for.
 * @returns {DOMRect | undefined} The bounding client rectangle or undefined if no element.
 */
export function getBoundingClientRect(element) {
	if (!element) {
		return;
	}
	let rect;
	if (typeof element.getBoundingClientRect !== "undefined") {
		rect = element.getBoundingClientRect();
	} else {
		let range = document.createRange();
		range.selectNode(element);
		rect = range.getBoundingClientRect();
	}
	return rect;
}

/**
 * Gets the client rectangles of an element.
 * Falls back to using Range if element.getClientRects is undefined.
 *
 * @param {Element} element - The DOM element to get client rectangles for.
 * @returns {DOMRectList | undefined} The client rectangles or undefined if no element.
 */
export function getClientRects(element) {
	if (!element) {
		return;
	}
	let rect;
	if (typeof element.getClientRects !== "undefined") {
		rect = element.getClientRects();
	} else {
		let range = document.createRange();
		range.selectNode(element);
		rect = range.getClientRects();
	}
	return rect;
}

/**
 * Generates a UUID (version 4).
 * Based on: http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
 *
 * @returns {string} A UUID string.
 */
export function UUID() {
	var d = new Date().getTime();
	if (
		typeof performance !== "undefined" &&
		typeof performance.now === "function"
	) {
		d += performance.now(); //use high-precision timer if available
	}
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
		var r = (d + Math.random() * 16) % 16 | 0;
		d = Math.floor(d / 16);
		return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
	});
}

/**
 * Find the position of an element in a NodeList.
 *
 * @param {Element} element - The element to find.
 * @param {NodeList} nodeList - The NodeList to search within.
 * @returns {number} The index of the element in the NodeList, or -1 if not found.
 */
export function positionInNodeList(element, nodeList) {
	for (let i = 0; i < nodeList.length; i++) {
		if (element === nodeList[i]) {
			return i;
		}
	}
	return -1;
}

/**
 * Finds a unique CSS selector for a given element.
 * The selector is unique within the element's document.
 *
 * @param {Element} ele - The element to find a selector for.
 * @returns {string} A unique CSS selector string.
 */
export function findCssSelector(ele) {
	let document = ele.ownerDocument;

	let cssEscape = window.CSS.escape;

	if (
		ele.id &&
		document.querySelectorAll("#" + cssEscape(ele.id)).length === 1
	) {
		return "#" + cssEscape(ele.id);
	}

	let tagName = ele.localName;
	if (tagName === "html") {
		return "html";
	}
	if (tagName === "head") {
		return "head";
	}
	if (tagName === "body") {
		return "body";
	}

	let selector, index, matches;
	if (ele.classList.length > 0) {
		for (let i = 0; i < ele.classList.length; i++) {
			selector = "." + cssEscape(ele.classList.item(i));
			matches = document.querySelectorAll(selector);
			if (matches.length === 1) {
				return selector;
			}
			selector = cssEscape(tagName) + selector;
			matches = document.querySelectorAll(selector);
			if (matches.length === 1) {
				return selector;
			}
			index = positionInNodeList(ele, ele.parentNode.children) + 1;
			selector = selector + ":nth-child(" + index + ")";
			matches = document.querySelectorAll(selector);
			if (matches.length === 1) {
				return selector;
			}
		}
	}

	if (ele.parentNode !== document && ele.parentNode.nodeType === 1) {
		index = positionInNodeList(ele, ele.parentNode.children) + 1;
		selector =
			findCssSelector(ele.parentNode) +
			" > " +
			cssEscape(tagName) +
			":nth-child(" +
			index +
			")";
	}

	return selector;
}

/**
 * Returns the value of the first attribute found from the given list on the element.
 *
 * @param {Element} element - The element to check attributes on.
 * @param {string[]} attributes - Array of attribute names to look for.
 * @returns {string | null | undefined} The attribute value, or undefined if none found.
 */
export function attr(element, attributes) {
	for (var i = 0; i < attributes.length; i++) {
		if (element.hasAttribute(attributes[i])) {
			return element.getAttribute(attributes[i]);
		}
	}
}

/**
 * Escapes a string for use in a CSS selector.
 * Allows # and . characters.
 *
 * @param {string} value - The string to escape.
 * @returns {string} The escaped string.
 * @throws {TypeError} If no argument is provided.
 */
export function querySelectorEscape(value) {
	if (arguments.length == 0) {
		throw new TypeError("`CSS.escape` requires an argument.");
	}
	var string = String(value);

	var length = string.length;
	var index = -1;
	var codeUnit;
	var result = "";
	var firstCodeUnit = string.charCodeAt(0);
	while (++index < length) {
		codeUnit = string.charCodeAt(index);

		if (codeUnit == 0x0000) {
			result += "\uFFFD";
			continue;
		}

		if (
			(codeUnit >= 0x0001 && codeUnit <= 0x001f) ||
			codeUnit == 0x007f ||
			(index == 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
			(index == 1 &&
				codeUnit >= 0x0030 &&
				codeUnit <= 0x0039 &&
				firstCodeUnit == 0x002d)
		) {
			result += "\\" + codeUnit.toString(16) + " ";
			continue;
		}

		if (index == 0 && length == 1 && codeUnit == 0x002d) {
			result += "\\" + string.charAt(index);
			continue;
		}

		if (codeUnit == 0x002e) {
			if (string.charAt(0) == "#") {
				result += "\\.";
				continue;
			}
		}

		if (
			codeUnit >= 0x0080 ||
			codeUnit == 0x002d ||
			codeUnit == 0x005f ||
			codeUnit == 35 || // Allow #
			codeUnit == 46 || // Allow .
			(codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
			(codeUnit >= 0x0041 && codeUnit <= 0x005a) ||
			(codeUnit >= 0x0061 && codeUnit <= 0x007a)
		) {
			result += string.charAt(index);
			continue;
		}

		result += "\\" + string.charAt(index);
	}
	return result;
}

/**
 * Creates a deferred object with promise, resolve, and reject.
 *
 * @returns {object} Deferred object with properties:
 *   - promise: {Promise} The promise object.
 *   - resolve: {function} Function to resolve the promise.
 *   - reject: {function} Function to reject the promise.
 *   - id: {string} Unique identifier.
 */
export function defer() {
	this.resolve = null;
	this.reject = null;
	this.id = UUID();

	this.promise = new Promise((resolve, reject) => {
		this.resolve = resolve;
		this.reject = reject;
	});
	Object.freeze(this);
}

/**
 * Uses requestIdleCallback if available, otherwise falls back to requestAnimationFrame.
 */
export const requestIdleCallback =
	typeof window !== "undefined" &&
	("requestIdleCallback" in window
		? window.requestIdleCallback
		: window.requestAnimationFrame);

/**
 * Converts a CSSValue object to a string representation.
 *
 * @param {Object} obj - The CSSValue object.
 * @returns {string} The combined CSS value and unit string.
 */
export function CSSValueToString(obj) {
	return obj.value + (obj.unit || "");
}

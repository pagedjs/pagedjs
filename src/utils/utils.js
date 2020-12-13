export function getBoundingClientRect(element) {
	if (!element) {
		return;
	}
	let rect;
	if (typeof element.getBoundingClientRect !== "undefined") {
		rect = element.getBoundingClientRect();

		let writeableRect = new Object;
		writeableRect.bottom = rect.bottom;
		writeableRect.height = rect.height;
		writeableRect.left = rect.left;
		writeableRect.right = rect.right;
		writeableRect.top = rect.top;
		writeableRect.width = rect.width;
		writeableRect.x = rect.x;
		writeableRect.y = rect.y;
		rect = writeableRect;

		// Fix for Safari
		// Check left and right values of all children
		// to detect if element overflows full or partially
		let children = element.querySelectorAll('*');
		for (let i = 0; i < children.length; i++) {
			let childRect = children[i].getBoundingClientRect();
			if (childRect.right > rect.right) { 
				rect.right = childRect.right;
			}
			if (childRect.left < rect.left) {
				rect.left = childRect.left;
			}
		}
	} else {
		let range = document.createRange();
		range.selectNode(element);
		rect = range.getBoundingClientRect();
	}
	return rect;
}

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
 * Generates a UUID
 * based on: http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
 * @returns {string} uuid
 */
export function UUID() {
	var d = new Date().getTime();
	if (typeof performance !== "undefined" && typeof performance.now === "function") {
		d += performance.now(); //use high-precision timer if available
	}
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
		var r = (d + Math.random() * 16) % 16 | 0;
		d = Math.floor(d / 16);
		return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
	});
}

// From: https://hg.mozilla.org/mozilla-central/file/tip/toolkit/modules/css-selector.js#l52

/**
 * Find the position of [element] in [nodeList].
 * @param {Element} element to check
 * @param {NodeList} nodeList to find in
 * @returns {int} an index of the match, or -1 if there is no match
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
 * Find a unique CSS selector for a given element
 * @param {Element} ele to check
 * @returns {string} a string such that ele.ownerDocument.querySelector(reply) === ele
 * and ele.ownerDocument.querySelectorAll(reply).length === 1
 */
export function findCssSelector(ele) {
	let document = ele.ownerDocument;
	// Fred: commented out to allow for parsing in fragments
	// if (!document || !document.contains(ele)) {
	//   throw new Error("findCssSelector received element not inside document");
	// }

	let cssEscape = window.CSS.escape;

	// document.querySelectorAll("#id") returns multiple if elements share an ID
	if (ele.id &&
		document.querySelectorAll("#" + cssEscape(ele.id)).length === 1) {
		return "#" + cssEscape(ele.id);
	}

	// Inherently unique by tag name
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

	// We might be able to find a unique class name
	let selector, index, matches;
	if (ele.classList.length > 0) {
		for (let i = 0; i < ele.classList.length; i++) {
			// Is this className unique by itself?
			selector = "." + cssEscape(ele.classList.item(i));
			matches = document.querySelectorAll(selector);
			if (matches.length === 1) {
				return selector;
			}
			// Maybe it's unique with a tag name?
			selector = cssEscape(tagName) + selector;
			matches = document.querySelectorAll(selector);
			if (matches.length === 1) {
				return selector;
			}
			// Maybe it's unique using a tag name and nth-child
			index = positionInNodeList(ele, ele.parentNode.children) + 1;
			selector = selector + ":nth-child(" + index + ")";
			matches = document.querySelectorAll(selector);
			if (matches.length === 1) {
				return selector;
			}
		}
	}

	// Not unique enough yet.  As long as it's not a child of the document,
	// continue recursing up until it is unique enough.
	if (ele.parentNode !== document && ele.parentNode.nodeType === 1) {
		index = positionInNodeList(ele, ele.parentNode.children) + 1;
		selector = findCssSelector(ele.parentNode) + " > " +
			cssEscape(tagName) + ":nth-child(" + index + ")";
	}

	return selector;
}

export function attr(element, attributes) {
	for (var i = 0; i < attributes.length; i++) {
		if (element.hasAttribute(attributes[i])) {
			return element.getAttribute(attributes[i]);
		}
	}
}

/* Based on by https://mths.be/cssescape v1.5.1 by @mathias | MIT license
 * Allows # and .
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



		// Note: there’s no need to special-case astral symbols, surrogate
		// pairs, or lone surrogates.

		// If the character is NULL (U+0000), then the REPLACEMENT CHARACTER
		// (U+FFFD).
		if (codeUnit == 0x0000) {
			result += "\uFFFD";
			continue;
		}

		if (
			// If the character is in the range [\1-\1F] (U+0001 to U+001F) or is
			// U+007F, […]
			(codeUnit >= 0x0001 && codeUnit <= 0x001F) || codeUnit == 0x007F ||
			// If the character is the first character and is in the range [0-9]
			// (U+0030 to U+0039), […]
			(index == 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
			// If the character is the second character and is in the range [0-9]
			// (U+0030 to U+0039) and the first character is a `-` (U+002D), […]
			(
				index == 1 &&
				codeUnit >= 0x0030 && codeUnit <= 0x0039 &&
				firstCodeUnit == 0x002D
			)
		) {
			// https://drafts.csswg.org/cssom/#escape-a-character-as-code-point
			result += "\\" + codeUnit.toString(16) + " ";
			continue;
		}

		if (
			// If the character is the first character and is a `-` (U+002D), and
			// there is no second character, […]
			index == 0 &&
			length == 1 &&
			codeUnit == 0x002D
		) {
			result += "\\" + string.charAt(index);
			continue;
		}

		// support for period character in id
		if (codeUnit == 0x002E) {
			if (string.charAt(0) == "#") {
				result += "\\.";
				continue;
			}
		}


		// If the character is not handled by one of the above rules and is
		// greater than or equal to U+0080, is `-` (U+002D) or `_` (U+005F), or
		// is in one of the ranges [0-9] (U+0030 to U+0039), [A-Z] (U+0041 to
		// U+005A), or [a-z] (U+0061 to U+007A), […]
		if (
			codeUnit >= 0x0080 ||
			codeUnit == 0x002D ||
			codeUnit == 0x005F ||
			codeUnit == 35 || // Allow #
			codeUnit == 46 || // Allow .
			codeUnit >= 0x0030 && codeUnit <= 0x0039 ||
			codeUnit >= 0x0041 && codeUnit <= 0x005A ||
			codeUnit >= 0x0061 && codeUnit <= 0x007A
		) {
			// the character itself
			result += string.charAt(index);
			continue;
		}

		// Otherwise, the escaped character.
		// https://drafts.csswg.org/cssom/#escape-a-character
		result += "\\" + string.charAt(index);

	}
	return result;
}

/**
 * Creates a new pending promise and provides methods to resolve or reject it.
 * From: https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Promise.jsm/Deferred#backwards_forwards_compatible
 * @returns {object} defered
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

export const requestIdleCallback = typeof window !== "undefined" && ("requestIdleCallback" in window ? window.requestIdleCallback : window.requestAnimationFrame);

export function CSSValueToString(obj) {
	return obj.value + (obj.unit || "");
}

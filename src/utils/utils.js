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
	if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
			d += performance.now(); //use high-precision timer if available
	}
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			var r = (d + Math.random() * 16) % 16 | 0;
			d = Math.floor(d / 16);
			return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
	});
}

// From: https://hg.mozilla.org/mozilla-central/file/tip/toolkit/modules/css-selector.js#l52

/**
 * Find the position of [element] in [nodeList].
 * @returns an index of the match, or -1 if there is no match
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
 * @returns a string such that ele.ownerDocument.querySelector(reply) === ele
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
};

export function attr(element, attributes) {
	for (var i = 0; i < attributes.length; i++) {
		if(element.hasAttribute(attributes[i])) {
			return element.getAttribute(attributes[i]);
		}
	}
}

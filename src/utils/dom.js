import { getBoundingClientRect } from "./utils.js";
export function isElement(node) {

	return node && node.nodeType === 1;
}

export function isText(node) {
	return node && node.nodeType === 3;
}

export function* walk(start, limiter) {
	let node = start;

	while (node) {

		yield node;

		if (node.childNodes.length) {
			node = node.firstChild;
		} else if (node.nextSibling) {
			if (limiter && node === limiter) {
				node = undefined;
				break;
			}
			node = node.nextSibling;
		} else {
			while (node) {
				node = node.parentNode;
				if (limiter && node === limiter) {
					node = undefined;
					break;
				}
				if (node && node.nextSibling) {
					node = node.nextSibling;
					break;
				}

			}
		}
	}
}

export function nodeAfter(node, limiter, descend = false) {
	if (limiter && node === limiter) {
		return;
	}
	if (descend && node.childNodes.length) {
		let child = node.firstChild;
		if (isIgnorable(child)) {
			child = nextSignificantNode(child);
		}
		if (child) {
			return child;
		}
	}
	let significantNode = nextSignificantNode(node);
	if (significantNode) {
		return significantNode;
	}
	if (node.parentNode) {
		while ((node = node.parentNode)) {
			if (limiter && node === limiter) {
				return;
			}
			significantNode = nextSignificantNode(node);
			if (significantNode) {
				return significantNode;
			}
		}
	}
}

function findLastSignificantDescendant(node) {
	let done = false;

	while (!done) {
		let child = node.lastChild;
		if (child && isIgnorable(child)) {
			child = previousSignificantNode(child);
		}
		if (child && isElement(child)) {
			node = child;
		}
		else {
			done = true;
		}
	}

	return node;
}

export function nodeBefore(node, limiter, descend = false) {
	do {
		if (limiter && node === limiter) {
			return;
		}

		let significantNode = previousSignificantNode(node);
		if (significantNode) {
			if (descend) {
				significantNode = findLastSignificantDescendant(significantNode);
			}
			return significantNode;
		}

		node = node.parentNode;
	} while (node);
}

export function elementAfter(node, limiter, descend = false) {
	let after = nodeAfter(node, limiter, descend);

	while (after && after.nodeType !== 1) {
		after = nodeAfter(after, limiter, descend);
	}

	return after;
}

export function elementBefore(node, limiter, descend = false) {
	let before = nodeBefore(node, limiter, descend);

	while (before && before.nodeType !== 1) {
		before = nodeBefore(before, limiter, descend);
	}

	return before;
}

export function displayedElementAfter(node, limiter, descend = false) {
	let after = elementAfter(node, limiter, descend);

	while (after && after.dataset.undisplayed) {
		after = elementAfter(after, limiter, descend);
	}

	return after;
}

export function displayedElementBefore(node, limiter, descend = false) {
	let before = elementBefore(node, limiter, descend);

	while (before && before.dataset.undisplayed) {
		before = elementBefore(before, limiter, descend);
	}

	return before;
}

export function stackChildren(currentNode, stacked) {
	let stack = stacked || [];

	stack.unshift(currentNode);

	let children = currentNode.children;
	for (var i = 0, length = children.length; i < length; i++) {
		stackChildren(children[i], stack);
	}

	return stack;
}

function copyWidth(originalElement, destElement) {
	let originalStyle = getComputedStyle(originalElement);
	let bounds = getBoundingClientRect(originalElement);
	let width = parseInt(originalStyle.width || bounds.width);
	if (width) {
		destElement.style.width = width + 'px';
	}
}

export function rebuildTableRow(node, alreadyRendered, existingChildren) {
	let currentCol = 0, maxCols = 0, nextInitialColumn = 0;
	let rebuilt = node.cloneNode(false);
	const initialColumns = Array.from(node.children);

	// Find the max number of columns.
	let earlierRow = node.parentElement.children[0];
	while (earlierRow && earlierRow !== node) {
		if (earlierRow.children.length > maxCols) {
			maxCols = earlierRow.children.length;
		}
		earlierRow = earlierRow.nextElementSibling;
	}

	if (!maxCols) {
		let existing = findElement(node, alreadyRendered);
		maxCols = existing?.children.length || 0;
	}

	// The next td to use in each tr.
	// Doesn't take account of rowspans above that might make extra columns.
	let rowOffsets = Array(maxCols).fill(0);

	// Duplicate rowspans and our initial columns.
	while (currentCol < maxCols) {
		let earlierRow = node.parentElement.children[0];
		let earlierRowIndex = 0;
		let rowspan, column;
		// Find the nth column we'll duplicate (rowspan) or use.
		while (earlierRow && earlierRow !== node) {
			if (rowspan == undefined) {
				column = earlierRow.children[currentCol - rowOffsets[nextInitialColumn]];
				if (column && column.rowSpan !== undefined && column.rowSpan > 1) {
					rowspan = column.rowSpan;
				}
			}
			// If rowspan === 0 the entire remainder of the table row is used.
			if (rowspan) {
				// Tracking how many rows in the overflow.
				if (rowspan < 2) {
					rowspan = undefined;
				}
				else {
					rowspan--;
				}
			}
			earlierRow = earlierRow.nextElementSibling;
			earlierRowIndex++;
		}

		let destColumn;
		if (rowspan) {
			if (!existingChildren) {
				destColumn = column.cloneNode(false);
				// Adjust rowspan value.
				destColumn.rowSpan = !column.rowSpan ? 0 : rowspan;
			}
		} else {
			// Fill the gap with the initial columns (if exists).
			destColumn = column = initialColumns[nextInitialColumn++]?.cloneNode(false);
		}
		if (column && destColumn) {
			if (alreadyRendered) {
				let existing = findElement(column, alreadyRendered);
				if (existing) {
					column = existing;
				}
			}
			copyWidth(column, destColumn);
			if (destColumn) {
				rebuilt.appendChild(destColumn);
			}
		}
		currentCol++;
	}
	return rebuilt;
}

export function rebuildTree (node, fragment, alreadyRendered) {
	let parent, subject;
	let ancestors = [];
	let added = [];
	let dupSiblings = false;
	let freshPage = !fragment;
	let numListItems = 0;

	if (!fragment) {
		fragment = document.createDocumentFragment();
	}

	// Gather all ancestors
	let element = node;

	if (!isText(node)) {
		ancestors.unshift(node);
		if (node.tagName == "LI") {
			numListItems++;
		}
	}
	while (element.parentNode && element.parentNode.nodeType === 1) {
		ancestors.unshift(element.parentNode);
		if (element.parentNode.tagName == "LI") {
			numListItems++;
		}
		element = element.parentNode;
	}

	for (var i = 0; i < ancestors.length; i++) {
		subject = ancestors[i];

		let container, split;
		if (added.length) {
			container = added[added.length - 1];
		} else {
			container = fragment;
		}

		if (subject.nodeName == "TR") {
			parent = findElement(subject, container);
			if (!parent) {
				parent = rebuildTableRow(subject, alreadyRendered, container.childElementCount);
				container.appendChild(parent);
			}
		}
		else if (dupSiblings) {
			let sibling = subject.parentElement ? subject.parentElement.children[0] : subject;

			while (sibling) {
				let existing = findElement(sibling, container), siblingClone;
				if (!existing) {
					let split = inIndexOfRefs(subject, alreadyRendered);
					siblingClone = cloneNodeAncestor(sibling);
					if (alreadyRendered) {
						let originalElement = findElement(sibling, alreadyRendered);
						if (originalElement) {
							copyWidth(originalElement, siblingClone);
						}
					}
					container.appendChild(siblingClone);
				}

				if (sibling == subject) {
					parent = siblingClone || existing;
				}
				sibling = sibling.nextElementSibling;
			}
		} else {
			parent = findElement(subject, container);
			if (!parent) {
				parent = cloneNodeAncestor(subject);
				if (alreadyRendered) {
					let originalElement = findElement(subject, alreadyRendered);
					if (originalElement) {
						copyWidth(originalElement, parent);

						// Colgroup to clone?
						Array.from(originalElement.children).forEach(child => {
							if (child.tagName == "COLGROUP") {
								parent.append(child.cloneNode(true));
							}
						});
					}
				}
				container.appendChild(parent);
			}
		}

		if (subject.previousElementSibling?.nodeName == 'THEAD') {
			// Clone the THEAD too.
			let sibling = subject.previousElementSibling;

			let existing = findElement(sibling, container), siblingClone;
			if (!existing) {
				siblingClone = cloneNodeAncestor(sibling, true);
				if (alreadyRendered) {
					let originalElement = findElement(sibling, alreadyRendered);
					if (originalElement) {
						let walker = walk(siblingClone, siblingClone);
						let next, pos, done;
						while (!done) {
							next = walker.next();
							pos = next.value;
							done = next.done;

							if (isElement(pos)) {
								originalElement = findElement(pos, alreadyRendered);
								copyWidth(originalElement, pos);

								// I've tried to make the THEAD invisible; this is the best
								// I could achieve. It gets a zero height but still somehow
								// affects the container height by a couple of pixels in my
								// testing. :(
								// Next step is to change the "true" below to use a custom
								// attribute that lets you control whether the header is shown.
								if (true) {
									pos.style.visibility = 'collapse';
									pos.style.marginTop = '0px';
									pos.style.marginBottom = '0px';
									pos.style.paddingTop = '0px';
									pos.style.paddingBottom = '0px';
									pos.style.borderTop = '0px';
									pos.style.borderBottom = '0px';
									pos.style.lineHeight = '0px';
									pos.style.opacity = 0;
								}
							}
						}
					}
				}
				container.insertBefore(siblingClone, container.firstChild);
			}

			if (sibling == subject) {
				parent = siblingClone || existing;
			}
			sibling = sibling.nextElementSibling;
		}

		split = inIndexOfRefs(subject, alreadyRendered);
		if (split) {
			setSplit(split, parent);
		}

		dupSiblings = (subject.dataset.clonesiblings == true ||
			['grid', 'flex', 'table-row'].indexOf(subject.style.display) > -1);
		added.push(parent);

		if (subject.tagName == "LI") {
			numListItems--;
		}

		if (freshPage && (isText(node) || numListItems)) {
			// Flag the first node on the page so we can suppress list styles on
			// a continued item and list item numbers except the list one
			// if an item number should be printed.
			parent.dataset.suppressListStyle = true;
		}
	}

	added = undefined;
	return fragment;
}

function setSplit(orig, clone) {
	if (orig.dataset.splitTo) {
		clone.setAttribute("data-split-from", clone.getAttribute("data-ref"));
	}

	// This will let us split a table with multiple columns correctly.
	orig.setAttribute("data-split-to", clone.getAttribute("data-ref"));
}

function cloneNodeAncestor (node, deep=false) {
	let result = node.cloneNode(deep);

	if (result.hasAttribute("id")) {
		let dataID = result.getAttribute("id");
		result.setAttribute("data-id", dataID);
		result.removeAttribute("id");
	}

	// This is handled by css :not, but also tidied up here
	if (result.hasAttribute("data-break-before")) {
		result.removeAttribute("data-break-before");
	}

	if (result.hasAttribute("data-previous-break-after")) {
		result.removeAttribute("data-previous-break-after");
	}

	return result;
}

export function rebuildAncestors (node) {
	let parent, ancestor;
	let ancestors = [];
	let added = [];

	let fragment = document.createDocumentFragment();

	// Gather all ancestors
	let element = node;
	while(element.parentNode && element.parentNode.nodeType === 1) {
		ancestors.unshift(element.parentNode);
		element = element.parentNode;
	}

	for (var i = 0; i < ancestors.length; i++) {
		ancestor = ancestors[i];
		parent = ancestor.cloneNode(false);
	
		parent.setAttribute("data-split-from", parent.getAttribute("data-ref"));

		if (parent.hasAttribute("id")) {
			let dataID = parent.getAttribute("id");
			parent.setAttribute("data-id", dataID);
			parent.removeAttribute("id");
		}

		// This is handled by css :not, but also tidied up here
		if (parent.hasAttribute("data-break-before")) {
			parent.removeAttribute("data-break-before");
		}

		if (parent.hasAttribute("data-previous-break-after")) {
			parent.removeAttribute("data-previous-break-after");
		}

		if (added.length) {
			let container = added[added.length-1];
			container.appendChild(parent);
		} else {
			fragment.appendChild(parent);
		}
		added.push(parent);

		// rebuild table rows
		if (parent.nodeName === "TD" && ancestor.parentElement.contains(ancestor)) {
			let td = ancestor;
			let prev = parent;
			while ((td = td.previousElementSibling)) {
				let sib = td.cloneNode(false);
				parent.parentElement.insertBefore(sib, prev);
				prev = sib;
			}
			
		}
	}

	added = undefined;
	return fragment;
}
/*
export function split(bound, cutElement, breakAfter) {
		let needsRemoval = [];
		let index = indexOf(cutElement);

		if (!breakAfter && index === 0) {
			return;
		}

		if (breakAfter && index === (cutElement.parentNode.children.length - 1)) {
			return;
		}

		// Create a fragment with rebuilt ancestors
		let fragment = rebuildTree(cutElement);

		// Clone cut
		if (!breakAfter) {
			let clone = cutElement.cloneNode(true);
			let ref = cutElement.parentNode.getAttribute('data-ref');
			let parent = fragment.querySelector("[data-ref='" + ref + "']");
			parent.appendChild(clone);
			needsRemoval.push(cutElement);
		}

		// Remove all after cut
		let next = nodeAfter(cutElement, bound);
		while (next) {
			let clone = next.cloneNode(true);
			let ref = next.parentNode.getAttribute('data-ref');
			let parent = fragment.querySelector("[data-ref='" + ref + "']");
			parent.appendChild(clone);
			needsRemoval.push(next);
			next = nodeAfter(next, bound);
		}

		// Remove originals
		needsRemoval.forEach((node) => {
			if (node) {
				node.remove();
			}
		});

		// Insert after bounds
		bound.parentNode.insertBefore(fragment, bound.nextSibling);
		return [bound, bound.nextSibling];
}
*/

export function needsBreakBefore(node) {
	if( typeof node !== "undefined" &&
			typeof node.dataset !== "undefined" &&
			typeof node.dataset.breakBefore !== "undefined" &&
			(node.dataset.breakBefore === "always" ||
			 node.dataset.breakBefore === "page" ||
			 node.dataset.breakBefore === "left" ||
			 node.dataset.breakBefore === "right" ||
			 node.dataset.breakBefore === "recto" ||
			 node.dataset.breakBefore === "verso")
		 ) {
		return true;
	}

	return false;
}

export function needsBreakAfter(node) {
	if( typeof node !== "undefined" &&
			typeof node.dataset !== "undefined" &&
			typeof node.dataset.breakAfter !== "undefined" &&
			(node.dataset.breakAfter === "always" ||
			 node.dataset.breakAfter === "page" ||
			 node.dataset.breakAfter === "left" ||
			 node.dataset.breakAfter === "right" ||
			 node.dataset.breakAfter === "recto" ||
			 node.dataset.breakAfter === "verso")
		 ) {
		return true;
	}

	return false;
}

export function needsPreviousBreakAfter(node) {
	if( typeof node !== "undefined" &&
			typeof node.dataset !== "undefined" &&
			typeof node.dataset.previousBreakAfter !== "undefined" &&
			(node.dataset.previousBreakAfter === "always" ||
			 node.dataset.previousBreakAfter === "page" ||
			 node.dataset.previousBreakAfter === "left" ||
			 node.dataset.previousBreakAfter === "right" ||
			 node.dataset.previousBreakAfter === "recto" ||
			 node.dataset.previousBreakAfter === "verso")
		 ) {
		return true;
	}

	return false;
}

export function needsPageBreak(node, previousSignificantNode) {
	if (typeof node === "undefined" || !previousSignificantNode || isIgnorable(node)) {
		return false;
	}
	if (node.dataset && node.dataset.undisplayed) {
		return false;
	}
	let previousSignificantNodePage = previousSignificantNode.dataset ? previousSignificantNode.dataset.page : undefined;
	if (typeof previousSignificantNodePage === "undefined") {
		const nodeWithNamedPage = getNodeWithNamedPage(previousSignificantNode);
		if (nodeWithNamedPage) {
			previousSignificantNodePage = nodeWithNamedPage.dataset.page;
		}
	}
	let currentNodePage = node.dataset ? node.dataset.page : undefined;
	if (typeof currentNodePage === "undefined") {
		const nodeWithNamedPage = getNodeWithNamedPage(node, previousSignificantNode);
		if (nodeWithNamedPage) {
			currentNodePage = nodeWithNamedPage.dataset.page;
		}
	}
	return currentNodePage !== previousSignificantNodePage;
}

export function *words(node) {
	let currentText = node.nodeValue;
	let max = currentText.length;
	let currentOffset = 0;
	let currentLetter;

	let range;
	const significantWhitespaces = node.parentElement && node.parentElement.nodeName === "PRE";

	while (currentOffset < max) {
		currentLetter = currentText[currentOffset];
		if (/^[\S\u202F\u00A0]$/.test(currentLetter) || significantWhitespaces) {
			if (!range) {
				range = document.createRange();
				range.setStart(node, currentOffset);
			}
		} else {
			if (range) {
				range.setEnd(node, currentOffset);
				yield range;
				range = undefined;
			}
		}

		currentOffset += 1;
	}

	if (range) {
		range.setEnd(node, currentOffset);
		yield range;
	}
}

export function *letters(wordRange) {
	let currentText = wordRange.startContainer;
	let max = currentText.length;
	let currentOffset = wordRange.startOffset;
	// let currentLetter;

	let range;

	while(currentOffset < max) {
		 // currentLetter = currentText[currentOffset];
		 range = document.createRange();
		 range.setStart(currentText, currentOffset);
		 range.setEnd(currentText, currentOffset+1);

		 yield range;

		 currentOffset += 1;
	}
}

export function isContainer(node) {
	let container;

	if (typeof node.tagName === "undefined") {
		return true;
	}

	if (node.style && node.style.display === "none") {
		return false;
	}

	switch (node.tagName) {
		// Inline
		case "A":
		case "ABBR":
		case "ACRONYM":
		case "B":
		case "BDO":
		case "BIG":
		case "BR":
		case "BUTTON":
		case "CITE":
		case "CODE":
		case "DFN":
		case "EM":
		case "I":
		case "IMG":
		case "INPUT":
		case "KBD":
		case "LABEL":
		case "MAP":
		case "OBJECT":
		case "Q":
		case "SAMP":
		case "SCRIPT":
		case "SELECT":
		case "SMALL":
		case "SPAN":
		case "STRONG":
		case "SUB":
		case "SUP":
		case "TEXTAREA":
		case "TIME":
		case "TT":
		case "VAR":
		case "P":
		case "H1":
		case "H2":
		case "H3":
		case "H4":
		case "H5":
		case "H6":
		case "FIGCAPTION":
		case "BLOCKQUOTE":
		case "PRE":
		case "LI":
		case "TD":
		case "DT":
		case "DD":
		case "VIDEO":
		case "CANVAS":
			container = false;
			break;
		default:
			container = true;
	}

	return container;
}

export function cloneNode(n, deep=false) {
	return n.cloneNode(deep);
}

export function inIndexOfRefs(node, doc) {
	if (!doc || !doc.indexOfRefs) return;
	const ref = node.getAttribute("data-ref");
	return doc.indexOfRefs[ref];
}

export function replaceOrAppendElement(parentNode, child) {
	if (!isText(child)) {
		let childRef = child.getAttribute("data-ref");
		for (let index = 0; index < parentNode.children.length; index++) {
			if (parentNode.children[index].getAttribute("data-ref") == childRef) {
				parentNode.replaceChild(child, parentNode.childNodes[index]);
				return;
			}
		}
	}

	parentNode.appendChild(child);
}

export function findElement(node, doc, forceQuery) {
	if (!doc) return;
	const ref = node.getAttribute("data-ref");
	return findRef(ref, doc, forceQuery);
}

export function findRef(ref, doc, forceQuery) {
	if (!forceQuery && doc.indexOfRefs && doc.indexOfRefs[ref]) {
		return doc.indexOfRefs[ref];
	} else {
		return doc.querySelector(`[data-ref='${ref}']`);
	}
}

export function validNode(node) {
	if (isText(node)) {
		return true;
	}

	if (isElement(node) && node.dataset.ref) {
		return true;
	}

	return false;
}

export function prevValidNode(node) {
	while (!validNode(node)) {
		if (node.previousSibling) {
			node = node.previousSibling;
		} else {
			node = node.parentNode;
		}

		if (!node) {
			break;
		}
	}

	return node;
}

export function nextValidNode(node) {
	while (!validNode(node)) {
		if (node.nextSibling) {
			node = node.nextSibling;
		} else {
			node = node.parentNode.nextSibling;
		}

		if (!node) {
			break;
		}
	}

	return node;
}


export function indexOf(node) {
	let parent = node.parentNode;
	if (!parent) {
		return 0;
	}
	return Array.prototype.indexOf.call(parent.childNodes, node);
}

export function child(node, index) {
	return node.childNodes[index];
}

export function isVisible(node) {
	if (isElement(node) && window.getComputedStyle(node).display !== "none") {
		return true;
	} else if (isText(node) &&
			hasTextContent(node) &&
			window.getComputedStyle(node.parentNode).display !== "none") {
		return true;
	}
	return false;
}

export function hasContent(node) {
	if (isElement(node)) {
		return true;
	} else if (isText(node) &&
			node.textContent.trim().length) {
		return true;
	}
	return false;
}

export function hasTextContent(node) {
	if (isElement(node)) {
		let child;
		for (var i = 0; i < node.childNodes.length; i++) {
			child = node.childNodes[i];
			if (child && isText(child) && child.textContent.trim().length) {
				return true;
			}
		}
	} else if (isText(node) &&
			node.textContent.trim().length) {
		return true;
	}
	return false;
}

export function indexOfTextNode(node, parent, hyphen) {
	if (!isText(node)) {
		return -1;
	}

	// Use previous element's dataref to match if possible. Matching the text
	// will potentially return the wrong node.
	if (node.previousSibling) {
		let matchingNode = parent.querySelector(`[data-ref='${node.previousSibling.dataset.ref}']`);
		return Array.prototype.indexOf.call(parent.childNodes, matchingNode) + 1;
	}

	let nodeTextContent = node.textContent;
	// Remove hyphenation if necessary.
	if (nodeTextContent.substring(nodeTextContent.length - hyphen.length) == hyphen) {
		nodeTextContent = nodeTextContent.substring(0, nodeTextContent.length - hyphen.length);
	}
	let child;
	let index = -1;
	for (var i = 0; i < parent.childNodes.length; i++) {
		child = parent.childNodes[i];
		if (child.nodeType === 3) {
			let text = parent.childNodes[i].textContent;
			if (text.includes(nodeTextContent)) {
				index = i;
				break;
			}
		}
	}

	return index;
}


/**
 * Throughout, whitespace is defined as one of the characters
 *  "\t" TAB \u0009
 *  "\n" LF  \u000A
 *  "\r" CR  \u000D
 *  " "  SPC \u0020
 *
 * This does not use Javascript's "\s" because that includes non-breaking
 * spaces (and also some other characters).
 */

/**
 * Determine if a node should be ignored by the iterator functions.
 * taken from https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Whitespace#Whitespace_helper_functions
 *
 * @param {Node} node An object implementing the DOM1 |Node| interface.
 * @return {boolean} true if the node is:
 *  1) A |Text| node that is all whitespace
 *  2) A |Comment| node
 *  and otherwise false.
 */
export function isIgnorable(node) {
	return (node.nodeType === 8) || // A comment node
		((node.nodeType === 3) && isAllWhitespace(node)); // a text node, all whitespace
}

/**
 * Determine whether a node's text content is entirely whitespace.
 *
 * @param {Node} node  A node implementing the |CharacterData| interface (i.e., a |Text|, |Comment|, or |CDATASection| node
 * @return {boolean} true if all of the text content of |nod| is whitespace, otherwise false.
 */
export function isAllWhitespace(node) {
	return !(/[^\t\n\r ]/.test(node.textContent));
}

/**
 * Version of |previousSibling| that skips nodes that are entirely
 * whitespace or comments.  (Normally |previousSibling| is a property
 * of all DOM nodes that gives the sibling node, the node that is
 * a child of the same parent, that occurs immediately before the
 * reference node.)
 *
 * @param {ChildNode} sib  The reference node.
 * @return {Node|null} Either:
 *  1) The closest previous sibling to |sib| that is not ignorable according to |is_ignorable|, or
 *  2) null if no such node exists.
 */
export function previousSignificantNode(sib) {
	while ((sib = sib.previousSibling)) {
		if (!isIgnorable(sib)) return sib;
	}
	return null;
}

function getNodeWithNamedPage(node, limiter) {
	if (node && node.dataset && node.dataset.page) {
		return node;
	}
	if (node.parentNode) {
		while ((node = node.parentNode)) {
			if (limiter && node === limiter) {
				return;
			}
			if (node.dataset && node.dataset.page) {
				return node;
			}
		}
	}
	return null;
}

export function breakInsideAvoidParentNode(node) {
	while ((node = node.parentNode)) {
		if (node && node.dataset && node.dataset.breakInside === "avoid") {
			return node;
		}
	}
	return null;
}

/**
 * Find a parent with a given node name.
 * @param {Node} node - initial Node
 * @param {string} nodeName - node name (eg. "TD", "TABLE", "STRONG"...)
 * @param {Node} limiter - go up to the parent until there's no more parent or the current node is equals to the limiter
 * @returns {Node|undefined} - Either:
 *  1) The closest parent for a the given node name, or
 *  2) undefined if no such node exists.
 */
export function parentOf(node, nodeName, limiter) {
	if (limiter && node === limiter) {
		return;
	}
	if (node.parentNode) {
		while ((node = node.parentNode)) {
			if (limiter && node === limiter) {
				return;
			}
			if (node.nodeName === nodeName) {
				return node;
			}
		}
	}
}

/**
 * Version of |nextSibling| that skips nodes that are entirely
 * whitespace or comments.
 *
 * @param {ChildNode} sib  The reference node.
 * @return {Node|null} Either:
 *  1) The closest next sibling to |sib| that is not ignorable according to |is_ignorable|, or
 *  2) null if no such node exists.
 */
export function nextSignificantNode(sib) {
	while ((sib = sib.nextSibling)) {
		if (!isIgnorable(sib)) return sib;
	}
	return null;
}

export function filterTree(content, func, what) {
	const treeWalker = document.createTreeWalker(
		content || this.dom,
		what || NodeFilter.SHOW_ALL,
		func ? { acceptNode: func } : null,
		false
	);

	let node;
	let current;
	node = treeWalker.nextNode();
	while(node) {
		current = node;
		node = treeWalker.nextNode();
		current.parentNode.removeChild(current);
	}
}

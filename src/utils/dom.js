import { getBoundingClientRect } from "./utils.js";

/**
 * Checks if a given node is an Element node.
 *
 * @param {Node} node - The node to check.
 * @returns {boolean} True if the node is an Element (nodeType === 1), else false.
 */
export function isElement(node) {
	return node && node.nodeType === 1;
}

/**
 * Checks if a given node is a Text node.
 *
 * @param {Node} node - The node to check.
 * @returns {boolean} True if the node is a Text node (nodeType === 3), else false.
 */
export function isText(node) {
	return node && node.nodeType === 3;
}

/**
 * Generator function that walks the DOM tree starting from the given node,
 * traversing depth-first and yielding nodes until the limiter node is reached (if provided).
 *
 * @param {Node} start - The starting node for traversal.
 * @param {Node} [limiter] - Optional node at which traversal stops.
 * @yields {Node} Nodes in the DOM tree in depth-first order.
 */
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

/**
 * Finds the next significant node after the given node, optionally descending into children.
 * Returns undefined if the limiter node is reached.
 *
 * @param {Node} node - The reference node.
 * @param {Node} [limiter] - Optional node at which traversal stops.
 * @param {boolean} [descend=false] - Whether to descend into child nodes.
 * @returns {Node|undefined} The next significant node or undefined if none found.
 */
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

/**
 * Finds the last significant descendant of a node.
 * Descends the last child path, skipping ignorable nodes.
 *
 * @param {Node} node - The node to find the last significant descendant for.
 * @returns {Node} The last significant descendant node.
 * @private
 */
function findLastSignificantDescendant(node) {
	let done = false;

	while (!done) {
		let child = node.lastChild;
		if (child && isIgnorable(child)) {
			child = previousSignificantNode(child);
		}
		if (child && isElement(child)) {
			node = child;
		} else {
			done = true;
		}
	}

	return node;
}

/**
 * Finds the previous significant node before the given node, optionally descending into children.
 * Returns undefined if the limiter node is reached.
 *
 * @param {Node} node - The reference node.
 * @param {Node} [limiter] - Optional node at which traversal stops.
 * @param {boolean} [descend=false] - Whether to descend into child nodes.
 * @returns {Node|undefined} The previous significant node or undefined if none found.
 */
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

/**
 * Finds the next Element node after the given node.
 * Skips non-element nodes.
 *
 * @param {Node} node - The reference node.
 * @param {Node} [limiter] - Optional node at which traversal stops.
 * @param {boolean} [descend=false] - Whether to descend into child nodes.
 * @returns {Element|undefined} The next Element node or undefined if none found.
 */
export function elementAfter(node, limiter, descend = false) {
	let after = nodeAfter(node, limiter, descend);

	while (after && after.nodeType !== 1) {
		after = nodeAfter(after, limiter, descend);
	}

	return after;
}

/**
 * Finds the previous Element node before the given node.
 * Skips non-element nodes.
 *
 * @param {Node} node - The reference node.
 * @param {Node} [limiter] - Optional node at which traversal stops.
 * @param {boolean} [descend=false] - Whether to descend into child nodes.
 * @returns {Element|undefined} The previous Element node or undefined if none found.
 */
export function elementBefore(node, limiter, descend = false) {
	let before = nodeBefore(node, limiter, descend);

	while (before && before.nodeType !== 1) {
		before = nodeBefore(before, limiter, descend);
	}

	return before;
}

/**
 * Finds the next displayed Element node after the given node.
 * Skips elements marked as undisplayed via `dataset.undisplayed`.
 *
 * @param {Node} node - The reference node.
 * @param {Node} [limiter] - Optional node at which traversal stops.
 * @param {boolean} [descend=false] - Whether to descend into child nodes.
 * @returns {Element|undefined} The next displayed Element node or undefined if none found.
 */
export function displayedElementAfter(node, limiter, descend = false) {
	let after = elementAfter(node, limiter, descend);

	while (after && after.dataset.undisplayed) {
		after = elementAfter(after, limiter, descend);
	}

	return after;
}

/**
 * Finds the previous displayed Element node before the given node.
 * Skips elements marked as undisplayed via `dataset.undisplayed`.
 *
 * @param {Node} node - The reference node.
 * @param {Node} [limiter] - Optional node at which traversal stops.
 * @param {boolean} [descend=false] - Whether to descend into child nodes.
 * @returns {Element|undefined} The previous displayed Element node or undefined if none found.
 */
export function displayedElementBefore(node, limiter, descend = false) {
	let before = elementBefore(node, limiter, descend);

	while (before && before.dataset.undisplayed) {
		before = elementBefore(before, limiter, descend);
	}

	return before;
}

/**
 * Recursively builds a stack (array) of a node and all its descendant elements,
 * in depth-first order, starting with the current node at the front.
 *
 * @param {Element} currentNode - The current node to add and process.
 * @param {Element[]} [stacked] - The accumulator array to hold stacked nodes.
 * @returns {Element[]} An array with the current node and all descendants stacked.
 */
export function stackChildren(currentNode, stacked) {
	let stack = stacked || [];

	stack.unshift(currentNode);

	let children = currentNode.children;
	for (var i = 0, length = children.length; i < length; i++) {
		stackChildren(children[i], stack);
	}

	return stack;
}

/**
 * Copies the width style from an original element to a destination element.
 * The width is computed using getComputedStyle and fallback bounding rect if needed.
 *
 * @param {Element} originalElement - The element to copy width from.
 * @param {Element} destElement - The element to apply the copied width to.
 */
function copyWidth(originalElement, destElement) {
	let originalStyle = getComputedStyle(originalElement);
	let bounds = getBoundingClientRect(originalElement);
	let width = parseInt(originalStyle.width || bounds.width);
	if (width) {
		destElement.style.width = width + "px";
	}
}

/**
 * Rebuilds a table row element by cloning and adjusting its columns, including handling rowspans.
 * Uses an existing rendered DOM tree to maintain styles and structure.
 *
 * @param {HTMLTableRowElement} node - The table row element to rebuild.
 * @param {Element} alreadyRendered - The root element containing the already rendered content for reference.
 * @param {number} [existingChildren] - Number of existing children in the container (optional).
 * @returns {HTMLTableRowElement} A new cloned and rebuilt table row element.
 */
export function rebuildTableRow(node, alreadyRendered, existingChildren) {
	let currentCol = 0,
		maxCols = 0,
		nextInitialColumn = 0;
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
				column =
					earlierRow.children[currentCol - rowOffsets[nextInitialColumn]];
				if (column && column.rowSpan !== undefined && column.rowSpan > 1) {
					rowspan = column.rowSpan;
				}
			}
			// If rowspan === 0 the entire remainder of the table row is used.
			if (rowspan) {
				// Tracking how many rows in the overflow.
				if (rowspan < 2) {
					rowspan = undefined;
				} else {
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
			destColumn = column =
				initialColumns[nextInitialColumn++]?.cloneNode(false);
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

/**
 * Rebuilds the ancestor tree for a given node, appending clones or existing elements to a document fragment.
 * Handles table rows, siblings duplication, and other special cases.
 *
 * @param {Node} node - The starting node for rebuilding.
 * @param {DocumentFragment} [fragment] - Optional document fragment to append rebuilt nodes to. Created if omitted.
 * @param {Element} [alreadyRendered] - Root element with already rendered DOM for reference and style copying.
 * @returns {DocumentFragment} The fragment containing the rebuilt ancestor tree.
 */
export function rebuildTree(node, fragment, alreadyRendered) {
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
				parent = rebuildTableRow(
					subject,
					alreadyRendered,
					container.childElementCount,
				);
				container.appendChild(parent);
			}
		} else if (dupSiblings) {
			let sibling = subject.parentElement
				? subject.parentElement.children[0]
				: subject;

			while (sibling) {
				let existing = findElement(sibling, container),
					siblingClone;
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
						Array.from(originalElement.children).forEach((child) => {
							if (child.tagName == "COLGROUP") {
								parent.append(child.cloneNode(true));
							}
						});
					}
				}
				container.appendChild(parent);
			}
		}

		if (subject.previousElementSibling?.nodeName == "THEAD") {
			// Clone the THEAD too.
			let sibling = subject.previousElementSibling;

			let existing = findElement(sibling, container),
				siblingClone;
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
									pos.style.visibility = "collapse";
									pos.style.marginTop = "0px";
									pos.style.marginBottom = "0px";
									pos.style.paddingTop = "0px";
									pos.style.paddingBottom = "0px";
									pos.style.borderTop = "0px";
									pos.style.borderBottom = "0px";
									pos.style.lineHeight = "0px";
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

		dupSiblings =
			subject.dataset.clonesiblings == true ||
			["grid", "flex", "table-row"].indexOf(subject.style.display) > -1;
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
/**
 * Sets split attributes between original and clone elements for table splitting.
 *
 * @param {HTMLElement} orig The original element to be split.
 * @param {HTMLElement} clone The cloned element that receives attributes.
 */
function setSplit(orig, clone) {
	if (orig.dataset.splitTo) {
		clone.setAttribute("data-split-from", clone.getAttribute("data-ref"));
	}

	// This will let us split a table with multiple columns correctly.
	orig.setAttribute("data-split-to", clone.getAttribute("data-ref"));
}

/**
 * Clones a node and removes certain attributes like 'id' and break-related attributes.
 *
 * @param {Node} node The node to clone.
 * @param {boolean} [deep=false] Whether to perform a deep clone.
 * @returns {Node} The cloned node with adjusted attributes.
 */
function cloneNodeAncestor(node, deep = false) {
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

/**
 * Rebuilds the ancestor tree of a given node as a document fragment.
 *
 * @param {Node} node The node for which ancestors are rebuilt.
 * @returns {DocumentFragment} A fragment containing cloned ancestors of the node.
 */
export function rebuildAncestors(node) {
	let parent, ancestor;
	let ancestors = [];
	let added = [];

	let fragment = document.createDocumentFragment();

	// Gather all ancestors
	let element = node;
	while (element.parentNode && element.parentNode.nodeType === 1) {
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
			let container = added[added.length - 1];
			container.appendChild(parent);
		} else {
			fragment.appendChild(parent);
		}
		added.push(parent);
		
		// rebuild table headers and columns
		if (parent.nodeName === "TABLE" && ancestor.parentElement.contains(ancestor)) {
			let table = ancestor;
			let thead = table.querySelector("thead");
			if (thead) {
				let clone = thead.cloneNode(true);
				parent.prepend(clone);
			}

			let colgroup = table.querySelector("colgroup");
			if (colgroup) {
				let clone = colgroup.cloneNode(true);
				parent.prepend(clone);
			}
		}
		
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

/**
 * Checks if a node requires a break before it according to dataset.breakBefore attribute.
 *
 * @param {Node} node The node to check.
 * @returns {boolean} True if a break before is needed, false otherwise.
 */
export function needsBreakBefore(node) {
	if (
		typeof node !== "undefined" &&
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

/**
 * Checks if a node requires a break before it according to dataset.breakBefore attribute.
 *
 * @param {Node} node The node to check.
 * @returns {boolean} True if a break before is needed, false otherwise.
 */
export function needsBreakAfter(node) {
	if (
		typeof node !== "undefined" &&
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

/**
 * Checks if a node's previous sibling requires a break after it according to dataset.previousBreakAfter attribute.
 *
 * @param {Node} node The node to check.
 * @returns {boolean} True if the previous break after is needed, false otherwise.
 */
export function needsPreviousBreakAfter(node) {
	if (
		typeof node !== "undefined" &&
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

/**
 * Determines if a page break is needed between the given node and the previous significant node.
 *
 * @param {Node} node The current node.
 * @param {Node} previousSignificantNode The previous significant node.
 * @returns {boolean} True if a page break is needed, false otherwise.
 */
export function needsPageBreak(node, previousSignificantNode) {
	if (
		typeof node === "undefined" ||
		!previousSignificantNode ||
		isIgnorable(node)
	) {
		return false;
	}
	if (node.dataset && node.dataset.undisplayed) {
		return false;
	}
	let previousSignificantNodePage = previousSignificantNode.dataset
		? previousSignificantNode.dataset.page
		: undefined;
	if (typeof previousSignificantNodePage === "undefined") {
		const nodeWithNamedPage = getNodeWithNamedPage(previousSignificantNode);
		if (nodeWithNamedPage) {
			previousSignificantNodePage = nodeWithNamedPage.dataset.page;
		}
	}
	let currentNodePage = node.dataset ? node.dataset.page : undefined;
	if (typeof currentNodePage === "undefined") {
		const nodeWithNamedPage = getNodeWithNamedPage(
			node,
			previousSignificantNode,
		);
		if (nodeWithNamedPage) {
			currentNodePage = nodeWithNamedPage.dataset.page;
		}
	}
	return currentNodePage !== previousSignificantNodePage;
}

/**
 * Generator function to yield word ranges from a text node.
 *
 * @param {Text} node The text node to extract words from.
 * @yields {Range} A Range object for each word found.
 */
export function* words(node) {
	let currentText = node.nodeValue;
	let max = currentText.length;
	let currentOffset = 0;
	let currentLetter;

	let range;
	const significantWhitespaces =
		node.parentElement && node.parentElement.nodeName === "PRE";

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

/**
 * Generator function to yield letter ranges from a word range.
 *
 * @param {Range} wordRange The Range object representing a word.
 * @yields {Range} A Range object for each letter in the word.
 */
export function* letters(wordRange) {
	let currentText = wordRange.startContainer;
	let max = currentText.length;
	let currentOffset = wordRange.startOffset;
	// let currentLetter;

	let range;

	while (currentOffset < max) {
		// currentLetter = currentText[currentOffset];
		range = document.createRange();
		range.setStart(currentText, currentOffset);
		range.setEnd(currentText, currentOffset + 1);

		yield range;

		currentOffset += 1;
	}
}
/**
 * Determines if a node is considered a container (block) element.
 *
 * @param {Node} node The node to check.
 * @returns {boolean} True if the node is a container, false if it is inline or hidden.
 */
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

/**
 * Clones a node.
 *
 * @param {Node} n The node to clone.
 * @param {boolean} [deep=false] Whether to clone deeply.
 * @returns {Node} The cloned node.
 */
export function cloneNode(n, deep = false) {
	return n.cloneNode(deep);
}

/**
 * Retrieves the index of a node's reference in the document's indexOfRefs.
 *
 * @param {Node} node The node with a data-ref attribute.
 * @param {Document} doc The document containing indexOfRefs.
 * @returns {number|undefined} The index of the reference, or undefined if not found.
 */
export function inIndexOfRefs(node, doc) {
	if (!doc || !doc.indexOfRefs) return;
	const ref = node.getAttribute("data-ref");
	return doc.indexOfRefs[ref];
}

/**
 * Replaces a child element in the parent node if a child with the same data-ref exists,
 * otherwise appends the child.
 *
 * @param {HTMLElement} parentNode The parent element.
 * @param {Node} child The child element to replace or append.
 */
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

/**
 * Finds an element in the document by the node's data-ref attribute.
 *
 * @param {Node} node The node with a data-ref attribute.
 * @param {Document} doc The document to search in.
 * @param {boolean} [forceQuery=false] Whether to force a querySelector search.
 * @returns {Element|undefined} The found element or undefined.
 */
export function findElement(node, doc, forceQuery) {
	if (!doc) return;
	const ref = node.getAttribute("data-ref");
	return findRef(ref, doc, forceQuery);
}

/**
 * Finds an element in the document by data-ref value.
 *
 * @param {string} ref The data-ref string to find.
 * @param {Document} doc The document to search in.
 * @param {boolean} [forceQuery=false] Whether to force querySelector search.
 * @returns {Element|null} The found element or null.
 */
export function findRef(ref, doc, forceQuery) {
	if (!forceQuery && doc.indexOfRefs && doc.indexOfRefs[ref]) {
		return doc.indexOfRefs[ref];
	} else {
		return doc.querySelector(`[data-ref='${ref}']`);
	}
}

/**
 * Validates if a node is either a text node or an element with a data-ref attribute.
 *
 * @param {Node} node The node to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
export function validNode(node) {
	if (isText(node)) {
		return true;
	}

	if (isElement(node) && node.dataset.ref) {
		return true;
	}

	return false;
}

/**
 * Finds the previous valid node in the sibling/parent chain.
 *
 * @param {Node} node The starting node.
 * @returns {Node|null} The previous valid node or null.
 */
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
/**
 * Finds the next valid node in the sibling/parent chain.
 *
 * @param {Node} node The starting node.
 * @returns {Node|null} The next valid node or null.
 */
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
/**
 * Gets the index of a node among its siblings.
 *
 * @param {Node} node The node to find the index for.
 * @returns {number} The index of the node.
 */
export function indexOf(node) {
	let parent = node.parentNode;
	if (!parent) {
		return 0;
	}
	return Array.prototype.indexOf.call(parent.childNodes, node);
}
/**
 * Returns the child node at a specific index.
 *
 * @param {Node} node The parent node.
 * @param {number} index The index of the child.
 * @returns {Node} The child node.
 */
export function child(node, index) {
	return node.childNodes[index];
}

/**
 * Checks if a node is visible (not display:none).
 *
 * @param {Node} node The node to check.
 * @returns {boolean} True if visible, false otherwise.
 */
export function isVisible(node) {
	if (isElement(node) && window.getComputedStyle(node).display !== "none") {
		return true;
	} else if (
		isText(node) &&
		hasTextContent(node) &&
		window.getComputedStyle(node.parentNode).display !== "none"
	) {
		return true;
	}
	return false;
}

/**
 * Checks if a node has any content.
 * Returns true for element nodes or non-empty text nodes.
 *
 * @param {Node} node The node to check.
 * @returns {boolean} True if the node has content, false otherwise.
 */
export function hasContent(node) {
	if (isElement(node)) {
		return true;
	} else if (isText(node) && node.textContent.trim().length) {
		return true;
	}
	return false;
}

/**
 * Checks if a node or any of its immediate child text nodes have non-empty text content.
 *
 * @param {Node} node The node to check.
 * @returns {boolean} True if the node or any child text node has non-empty text content, false otherwise.
 */
export function hasTextContent(node) {
	if (isElement(node)) {
		let child;
		for (var i = 0; i < node.childNodes.length; i++) {
			child = node.childNodes[i];
			if (child && isText(child) && child.textContent.trim().length) {
				return true;
			}
		}
	} else if (isText(node) && node.textContent.trim().length) {
		return true;
	}
	return false;
}

/**
 * Finds the index of a text node within its parent's child nodes.
 * If the text node has a previous sibling, tries to find the matching element by data-ref attribute
 * and returns its index + 1. Otherwise, matches by text content.
 * Optionally considers hyphenation removal in the text.
 *
 * @param {Node} node The text node to find the index for.
 * @param {Node} parent The parent node containing the child nodes.
 * @param {string} hyphen The hyphenation string to remove if present at the end of the text.
 * @returns {number} The index of the text node within the parent's child nodes, or -1 if not found.
 */
export function indexOfTextNode(node, parent, hyphen) {
	if (!isText(node)) {
		return -1;
	}

	// Use previous element's dataref to match if possible. Matching the text
	// will potentially return the wrong node.
	if (node.previousSibling) {
		let matchingNode = parent.querySelector(
			`[data-ref='${node.previousSibling.dataset.ref}']`,
		);
		return Array.prototype.indexOf.call(parent.childNodes, matchingNode) + 1;
	}

	let nodeTextContent = node.textContent;
	// Remove hyphenation if necessary.
	if (
		nodeTextContent.substring(nodeTextContent.length - hyphen.length) == hyphen
	) {
		nodeTextContent = nodeTextContent.substring(
			0,
			nodeTextContent.length - hyphen.length,
		);
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
	return (
		node.nodeType === 8 || // A comment node
		(node.nodeType === 3 && isAllWhitespace(node))
	); // a text node, all whitespace
}

/**
 * Determine whether a node's text content is entirely whitespace.
 *
 * @param {Node} node  A node implementing the |CharacterData| interface (i.e., a |Text|, |Comment|, or |CDATASection| node
 * @return {boolean} true if all of the text content of |nod| is whitespace, otherwise false.
 */
export function isAllWhitespace(node) {
	return !/[^\t\n\r ]/.test(node.textContent);
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

/**
 * Finds the closest ancestor (including the node itself) that has a dataset.page attribute.
 * Traverses up the DOM tree until the optional limiter node is reached.
 *
 * @param {Node} node - The starting node to search from.
 * @param {Node} [limiter] - Optional ancestor node to stop the search at (exclusive).
 * @returns {Node|null|undefined} The closest node with dataset.page, null if none found,
 *                               or undefined if limiter is reached without finding.
 */
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

/**
 * Finds the closest ancestor of a node with a dataset.breakInside attribute equal to "avoid".
 * Traverses up the DOM tree until such a node is found or root is reached.
 *
 * @param {Node} node - The starting node to search from.
 * @returns {Node|null} The closest ancestor node with dataset.breakInside === "avoid",
 *                      or null if none found.
 */
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

/**
 * Traverses a DOM subtree and removes nodes that match a filter function.
 *
 * @param {Node} content - The root node to start traversal from. If falsy, defaults to `this.dom`.
 * @param {function(Node): number} [func] - Optional filter function used by the TreeWalker.
 *        Should return one of the constants from NodeFilter:
 *        - NodeFilter.FILTER_ACCEPT to keep the node,
 *        - NodeFilter.FILTER_REJECT or FILTER_SKIP to exclude it.
 * @param {number} [what=NodeFilter.SHOW_ALL] - Optional mask specifying which node types to show.
 *        Defaults to all nodes.
 */
export function filterTree(content, func, what) {
	const treeWalker = document.createTreeWalker(
		content || this.dom,
		what || NodeFilter.SHOW_ALL,
		func ? { acceptNode: func } : null,
		false,
	);

	let node;
	let current;
	node = treeWalker.nextNode();
	while (node) {
		current = node;
		node = treeWalker.nextNode();
		current.parentNode.removeChild(current);
	}
}

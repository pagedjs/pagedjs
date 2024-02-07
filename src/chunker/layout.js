import { getBoundingClientRect } from "../utils/utils.js";
import {
	child,
	cloneNode,
	findElement,
	hasContent,
	indexOf,
	indexOfTextNode,
	isContainer,
	isElement,
	isText,
	letters,
	needsBreakBefore,
	needsPageBreak,
	needsPreviousBreakAfter,
	nodeAfter,
	nodeBefore,
	parentOf,
	prevValidNode,
	rebuildTree,
	validNode,
	walk,
	words
} from "../utils/dom.js";
import BreakToken from "./breaktoken.js";
import RenderResult from "./renderresult.js";
import EventEmitter from "event-emitter";
import Hook from "../utils/hook.js";
import Overflow from "./overflow.js";

const MAX_CHARS_PER_BREAK = 1500;

/**
 * Layout
 * @class
 */
class Layout {

	constructor(element, hooks, options) {
		this.element = element;

		this.bounds = this.element.getBoundingClientRect();
		this.parentBounds = this.element.offsetParent?.getBoundingClientRect() ||
			{ left: 0 };
		let gap = parseFloat(window.getComputedStyle(this.element).columnGap);

		if (gap) {
			let leftMargin = this.bounds.left - this.parentBounds.left;
			this.gap = gap - leftMargin;
		} else {
			this.gap = 0;
		}

		if (hooks) {
			this.hooks = hooks;
		} else {
			this.hooks = {};
			this.hooks.onPageLayout = new Hook();
			this.hooks.layout = new Hook();
			this.hooks.renderNode = new Hook();
			this.hooks.layoutNode = new Hook();
			this.hooks.getOverflow = new Hook();
			this.hooks.beforeOverflow = new Hook();
			this.hooks.onOverflow = new Hook();
			this.hooks.afterOverflowRemoved = new Hook();
			this.hooks.afterOverflowAdded = new Hook();
			this.hooks.onBreakToken = new Hook();
			this.hooks.beforeRenderResult = new Hook();
		}

		this.settings = options || {};

		this.maxChars = this.settings.maxChars || MAX_CHARS_PER_BREAK;
		this.forceRenderBreak = false;
	}

	async renderTo(wrapper, source, breakToken, prevPage = null, bounds = this.bounds) {
		let start = this.getStart(source, breakToken);
		let firstDivisible = source;

		while (firstDivisible.children.length == 1) {
			firstDivisible = firstDivisible.children[0];
		}

		let walker = walk(start, source);

		let node;
		let done;
		let next;
		let forcedBreakQueue = [];

		let prevBreakToken = breakToken || new BreakToken(start);

		this.hooks && this.hooks.onPageLayout.trigger(wrapper, prevBreakToken, this);

		// Add overflow, and check that it doesn't have overflow itself.
		this.addOverflowToPage(wrapper, breakToken, prevPage);

		// Footnotes may change the bounds.
		bounds = this.element.getBoundingClientRect();

		let newBreakToken = this.findBreakToken(wrapper, source, bounds, prevBreakToken, start);

		if (prevBreakToken.isFinished()) {
			if (newBreakToken) {
				newBreakToken.setFinished();
			}
			return new RenderResult(newBreakToken);
		}

		let hasRenderedContent = !!wrapper.childNodes.length;

		if (prevBreakToken) {
			forcedBreakQueue = prevBreakToken.getForcedBreakQueue();
		}

		while (!done && !newBreakToken) {
			next = walker.next();
			node = next.value;
			done = next.done;

			if (node) {
				this.hooks && this.hooks.layoutNode.trigger(node);

				// Footnotes may change the bounds.
				bounds = this.element.getBoundingClientRect();

				// Check if the rendered element has a break set
				// Remember the node but don't apply the break until we have laid
				// out the rest of any parent content - this lets a table or divs
				// side by side still add content to this page before we start a new
				// one.
				if (this.shouldBreak(node) && hasRenderedContent) {
					forcedBreakQueue.push(node);
				}

				if (!forcedBreakQueue.length && node.dataset && node.dataset.page) {
					let named = node.dataset.page;
					let page = this.element.closest(".pagedjs_page");
					page.classList.add("pagejs_named_page");
					page.classList.add("pagedjs_" + named + "_page");
					if (!node.dataset.splitFrom) {
						page.classList.add("pagedjs_" + named + "_first_page");
					}
				}
			}

			// Check whether we have overflow when we've completed laying out a top
			// level element. This lets it have multiple children overflowing and
			// allows us to move all of the overflows onto the next page together.
			if (forcedBreakQueue.length || !node || !node.parentElement || node.parentElement == firstDivisible) {
				this.hooks && this.hooks.layout.trigger(wrapper, this);

				let imgs = wrapper.querySelectorAll("img");
				if (imgs.length) {
					await this.waitForImages(imgs);
				}

				newBreakToken = this.findBreakToken(wrapper, source, bounds, prevBreakToken, node);

				if (newBreakToken && node === undefined) {
					// We have run out of content. Do add the overflow to a new page but
					// don't repeat the whole thing again.
					newBreakToken.setFinished();
				}

				if (forcedBreakQueue.length) {
					if (newBreakToken) {
						newBreakToken.setForcedBreakQueue(forcedBreakQueue);
					}
					else {
						newBreakToken = this.breakAt(forcedBreakQueue.shift(), 0, forcedBreakQueue);
					}
				}

				if (newBreakToken && newBreakToken.equals(prevBreakToken)) {
					this.failed = true;
					return new RenderResult(undefined, "Unable to layout item: " + node);
				}

				if (!node || newBreakToken) {
					return new RenderResult(newBreakToken);
				}
			}

			// Should the Node be a shallow or deep clone?
			let shallow = isContainer(node);

			this.append(node, wrapper, breakToken, shallow);
			bounds = this.element.getBoundingClientRect();

			// Check whether layout has content yet.
			if (!hasRenderedContent) {
				hasRenderedContent = hasContent(node);
			}

			// Skip to the next node if a deep clone was rendered.
			if (!shallow) {
				walker = walk(nodeAfter(node, source), source);
			}
		}

		this.hooks && this.hooks.beforeRenderResult.trigger(newBreakToken, wrapper, this);
		return new RenderResult(newBreakToken);
	}

	breakAt(node, offset = 0, forcedBreakQueue = []) {
		let newBreakToken = new BreakToken(
			node,
			offset,
			forcedBreakQueue
		);
		let breakHooks = this.hooks.onBreakToken.triggerSync(newBreakToken, undefined, node, this);
		breakHooks.forEach((newToken) => {
			if (typeof newToken != "undefined") {
				newBreakToken = newToken;
			}
		});

		return newBreakToken;
	}

	shouldBreak(node, limiter) {
		let previousNode = nodeBefore(node, limiter);
		let parentNode = node.parentNode;
		let parentBreakBefore = needsBreakBefore(node) && parentNode && !previousNode && needsBreakBefore(parentNode);
		let doubleBreakBefore;

		if (parentBreakBefore) {
			doubleBreakBefore = node.dataset.breakBefore === parentNode.dataset.breakBefore;
		}

		return !doubleBreakBefore && needsBreakBefore(node) || needsPreviousBreakAfter(node) || needsPageBreak(node, previousNode);
	}

	forceBreak() {
		this.forceRenderBreak = true;
	}

	getStart(source, breakToken) {
		let start;
		let node = breakToken && breakToken.node;
		let finished = breakToken && breakToken.finished;

		if (node) {
			start = node;
		} else {
			start = source.firstChild;
		}

		return finished ? undefined : start;
	}

	/**
	 * Merge items from source into dest which don't yet exist in dest.
	 *
	 * @param {element} dest
	 *   A destination DOM node tree.
	 * @param {element} source
	 *   A source DOM node tree.
	 *
	 * @returns {void}
	 */
	addOverflowNodes(dest, source) {
		// Since we are modifying source as we go, we need to remember what
		Array.from(source.childNodes).forEach((item) => {
			if (isText(item)) {
				// If we get to a text node, we assume for now an earlier element
				// would have prevented duplication.
				dest.append(item);
			} else {
				let match = findElement(item, dest);
				if (match) {
					this.addOverflowNodes(match, item);
				} else {
					dest.appendChild(item);
				}
			}
		});
	}

	/**
	 * Add overflow to new page.
	 *
	 * @param {element} dest
	 *   The page content being built.
	 * @param {breakToken} breakToken
	 *   The current break cotent.
	 * @param {element} alreadyRendered
	 *   The content that has already been rendered.
	 *
	 * @returns {void}
	 */
	addOverflowToPage(dest, breakToken, alreadyRendered) {

		if (!breakToken || !breakToken.overflow.length) {
			return;
		}

		let fragment;

		breakToken.overflow.forEach((overflow) => {
			// A handy way to dump the contents of a fragment.
			// console.log([].map.call(overflow.content.children, e => e.outerHTML).join('\n'));

			fragment = rebuildTree(overflow.node, fragment, alreadyRendered);
			// Find the parent to which overflow.content should be added.
			// Overflow.content can be a much shallower start than
			// overflow.node, if the range end was outside of the range
			// start part of the tree. For this reason, we use a match against
			// the parent element of overflow.content if it exists, or fall back
			// to overflow.node's parent element.
			let addTo = overflow.ancestor ? findElement(overflow.ancestor, fragment) : fragment;
			this.addOverflowNodes(addTo, overflow.content);
		});

		// Record refs.
		Array.from(fragment.querySelectorAll('[data-ref]')).forEach(ref => {
			let refId = ref.dataset['ref'];
			if (!dest.querySelector(`[data-ref='${refId}']`)) {
				if (!dest.indexOfRefs) {
					dest.indexOfRefs = {};
				}
				dest.indexOfRefs[refId] = ref;
			}
		});
		dest.appendChild(fragment);

		this.hooks && this.hooks.afterOverflowAdded.trigger(dest);
	}

	/**
	 * Add text to new page.
	 *
	 * @param {element} node
	 *   The node being appended to the destination.
	 * @param {element} dest
	 *   The destination to which content is being added.
	 * @param {breakToken} breakToken
	 *   The current breakToken.
	 * @param {bool} shallow
	 *	 Whether to do a shallow copy of the node.
	 * @param {bool} rebuild
	 *   Whether to rebuild parents.
	 *
	 * @returns {ChildNode}
	 *   The cloned node.
	 */
	append(node, dest, breakToken, shallow = true, rebuild = true) {

		let clone = cloneNode(node, !shallow);

		if (node.parentNode && isElement(node.parentNode)) {
			let parent = findElement(node.parentNode, dest);
			// Rebuild chain
			if (parent) {
				parent.appendChild(clone);
			} else if (rebuild) {
				let fragment = rebuildTree(node.parentElement);
				parent = findElement(node.parentNode, fragment);
				parent.appendChild(clone);
				dest.appendChild(fragment);
			} else {
				dest.appendChild(clone);
			}

		} else {
			dest.appendChild(clone);
		}

		if (clone.dataset && clone.dataset.ref) {
			if (!dest.indexOfRefs) {
				dest.indexOfRefs = {};
			}
			dest.indexOfRefs[clone.dataset.ref] = clone;
		}

		let nodeHooks = this.hooks.renderNode.triggerSync(clone, node, this);
		nodeHooks.forEach((newNode) => {
			if (typeof newNode != "undefined") {
				clone = newNode;
			}
		});

		return clone;
	}

	rebuildTableFromBreakToken(breakToken, dest) {
		if (!breakToken || !breakToken.node) {
			return;
		}
		let node = breakToken.node;
		let td = isElement(node) ? node.closest("td") : node.parentElement.closest("td");
		if (td) {
			let rendered = findElement(td, dest, true);
			if (!rendered) {
				return;
			}
			while ((td = td.nextElementSibling)) {
				this.append(td, dest, null, true);
			}
		}
	}

	async waitForImages(imgs) {
		let results = Array.from(imgs).map(async (img) => {
			return this.awaitImageLoaded(img);
		});
		await Promise.all(results);
	}

	async awaitImageLoaded(image) {
		return new Promise(resolve => {
			if (image.complete !== true) {
				image.onload = function () {
					let { width, height } = window.getComputedStyle(image);
					resolve(width, height);
				};
				image.onerror = function (e) {
					let { width, height } = window.getComputedStyle(image);
					resolve(width, height, e);
				};
			} else {
				let { width, height } = window.getComputedStyle(image);
				resolve(width, height);
			}
		});
	}

	avoidBreakInside(node, limiter) {
		let breakNode;

		while (node.parentNode) {
			if (node === limiter) {
				break;
			}

			if (window.getComputedStyle(node)["break-inside"] === "avoid") {
				breakNode = node;
				break;
			}

			node = node.parentNode;
		}
		return breakNode;
	}

	createOverflow(overflow, rendered, source) {
		let container = overflow.startContainer;
		let offset = overflow.startOffset;
		let node, renderedNode, parent, index, temp;

		if (isElement(container)) {
			if (container.nodeName == "INPUT") {
				temp = container;
			} else {
				// Offset can be incorrect in tables spanning multiple pages.
				// To reproduce, fill a specification composite "prepared by" field
				// with a ton of lorem ipsum.
				temp = child(container, offset) || child(container, 0);
			}

			if (isElement(temp)) {
				renderedNode = findElement(temp, rendered);

				if (!renderedNode) {
					// Find closest element with data-ref
					let prevNode = prevValidNode(temp);
					if (!isElement(prevNode)) {
						prevNode = prevNode.parentElement;
					}
					renderedNode = findElement(prevNode, rendered);
					// Check if temp is the last rendered node at its level.
					if (!temp.nextSibling) {
						// We need to ensure that the previous sibling of temp is fully rendered.
						const renderedNodeFromSource = findElement(renderedNode, source);
						const walker = document.createTreeWalker(renderedNodeFromSource, NodeFilter.SHOW_ELEMENT);
						const lastChildOfRenderedNodeFromSource = walker.lastChild();
						const lastChildOfRenderedNodeMatchingFromRendered = findElement(lastChildOfRenderedNodeFromSource, rendered);
						// Check if we found that the last child in source
						if (!lastChildOfRenderedNodeMatchingFromRendered) {
							// Pending content to be rendered before virtual break token
							return;
						}
						// Otherwise we will return a break token as per below
					}
					// renderedNode is actually the last unbroken box that does not overflow.
					// Break Token is therefore the next sibling of renderedNode within source node.
					node = findElement(renderedNode, source).nextSibling;
					offset = 0;
				} else {
					node = findElement(renderedNode, source);
					offset = 0;
				}
			} else {
				renderedNode = findElement(container, rendered);

				if (!renderedNode) {
					renderedNode = findElement(prevValidNode(container), rendered);
				}

				parent = findElement(renderedNode, source);
				index = indexOfTextNode(temp, parent);
				// No seperatation for the first textNode of an element
				if (index === 0) {
					node = parent;
					offset = 0;
				} else {
					node = child(parent, index);
					offset = 0;
				}
			}
		} else {
			renderedNode = findElement(container.parentNode, rendered);

			if (!renderedNode) {
				renderedNode = findElement(prevValidNode(container.parentNode), rendered);
			}

			parent = findElement(renderedNode, source);
			index = indexOfTextNode(container, parent);

			if (index === -1) {
				return;
			}

			node = child(parent, index);

			offset += node.textContent.indexOf(container.textContent);
		}

		if (!node) {
			// console.log(isElement(container), child(container, offset), temp);
			return;
		}

		return new Overflow(
			node,
			offset,
			overflow.getBoundingClientRect().height,
			overflow
		);

	}

	lastChildCheck(parentElement, rootElement) {
		if (parentElement.childElementCount) {
			this.lastChildCheck(parentElement.lastElementChild, rootElement);
		}

		let refId = parentElement.dataset['ref'];

		if (['TR', 'math', 'P'].indexOf(parentElement.tagName) > -1 && parentElement.textContent.trim() == '') {
			parentElement.parentNode.removeChild(parentElement);
		}
		else if (refId && !rootElement.indexOfRefs[refId]) {
			rootElement.indexOfRefs[refId] = parentElement;
		}
	}

	processOverflowResult(ranges, rendered, source, bounds, prevBreakToken, node, extract) {
		let breakToken, breakLetter;

		ranges.forEach((overflowRange) => {

			let overflowHooks = this.hooks.onOverflow.triggerSync(overflowRange, rendered, bounds, this);
			overflowHooks.forEach((newOverflow) => {
				if (typeof newOverflow != "undefined") {
					overflowRange = newOverflow;
				}
			});

			let overflow = this.createOverflow(overflowRange, rendered, source);
			if (!breakToken) {
				breakToken = new BreakToken(node, [overflow]);
			} else {
				breakToken.overflow.push(overflow);
			}

			// breakToken is nullable
			let breakHooks = this.hooks.onBreakToken.triggerSync(breakToken, overflowRange, rendered, this);
			breakHooks.forEach((newToken) => {
				if (typeof newToken != "undefined") {
					breakToken = newToken;
				}
			});

			// Stop removal if we are in a loop
			if (breakToken.equals(prevBreakToken)) {
				return;
			}

			if (overflow?.node && overflow?.offset && overflow?.node?.textContent) {
				breakLetter = overflow.node.textContent.charAt(overflow.offset);
			} else {
				breakLetter = undefined;
			}

			if (overflow?.node && extract) {
				overflow.ancestor = findElement(overflow.range.commonAncestorContainer, source);
				overflow.content = this.removeOverflow(overflowRange, breakLetter);
			}
		});

		// For each overflow that is removed, see if we have an empty td that can be removed.
		// Also check that the data-ref is set so we get all the split-froms and tos. If a copy
		// of a node wasn't shallow, the indexOfRefs entry won't be there yet.
		ranges.forEach((overflowRange) => {
			this.lastChildCheck(rendered, rendered);
		});

		// And then see if the last element has been completely removed and not split.
		if (rendered.indexOfRefs && extract && breakToken.overflow.length) {
			let firstOverflow = breakToken.overflow[0];
			if (firstOverflow?.node && firstOverflow.content) {
				// Remove data-refs in the overflow from the index.
				Array.from(firstOverflow.content.querySelectorAll('[data-ref]')).forEach(ref => {
					let refId = ref.dataset['ref'];
					if (!rendered.querySelector(`[data-ref='${refId}']`)) {
						delete(rendered.indexOfRefs[refId]);
					}
				});
			}
		}

		breakToken.overflow.forEach((overflow) => {
				this.hooks && this.hooks.afterOverflowRemoved.trigger(overflow.content, rendered, this);
		})


		return breakToken;
	}

	findBreakToken(rendered, source, bounds = this.bounds, prevBreakToken, node = null, extract = true) {
		let breakToken;

		let overflowResult = this.getOverflow(rendered, bounds, source);
		if (overflowResult) {
			breakToken = this.processOverflowResult(overflowResult, rendered, source, bounds, prevBreakToken, node, extract);

			// Hooks (eg footnotes) might alter the flow in response to the above removal of overflow,
			// potentially resulting in more reflow.
			let secondOverflow = this.getOverflow(rendered, bounds, source);
			if (secondOverflow && secondOverflow.length && extract) {
				let secondToken = this.processOverflowResult(secondOverflow, rendered, source, bounds, prevBreakToken, node, extract);
				if (!secondToken.equals(breakToken)) {
					// Prepend.
					breakToken.overflow = secondToken.overflow.concat(breakToken.overflow);
				}
			}
		}
		return breakToken;
	}

	/**
	 * Does the element exceed the bounds?
	 *
	 * @param {element} element
	 *   The element being constrained.
	 * @param {array} bounds
	 *   The bounding element.
	 *
	 * @returns {bool}
	 *   Whether the element is within bounds.
	 */
	hasOverflow(element, bounds = this.bounds) {
		let constrainingElement = element && element.parentNode; // this gets the element, instead of the wrapper for the width workaround
		if (constrainingElement.classList.contains("pagedjs_page_content")) {
			constrainingElement = element;
		}
		let { width, height } = element.getBoundingClientRect();
		let scrollWidth = constrainingElement ? constrainingElement.scrollWidth : 0;
		let scrollHeight = constrainingElement ? constrainingElement.scrollHeight : 0;
		return (Math.max(Math.ceil(width), scrollWidth) > Math.ceil(bounds.width)) ||
			Math.max(Math.ceil(height), scrollHeight) > Math.ceil(bounds.height);
	}

	/**
	 * Returns the first child that overflows the bounds.
	 *
	 * There may be no children that overflow (the height might be extended
	 * by a sibling). In this case, this function returns NULL.
	 *
	 * @param {node} node
	 *   The parent node of the children we are searching.
	 * @param {array} bounds
	 *   The bounds of the page area.
	 * @returns {ChildNode | null | undefined}
	 *   The first overflowing child within the node.
	 */
	firstOverflowingChild(node, bounds) {
		let bLeft = Math.ceil(bounds.left);
		let bRight = Math.floor(bounds.right);
		let bTop = Math.ceil(bounds.top);
		let bBottom = Math.floor(bounds.bottom);

		for (const child of node.childNodes) {
			if (child.tagName == "COLGROUP") {
				continue;
			}

			let pos = getBoundingClientRect(child);
			let bottomMargin = 0;

			if (isElement(child)) {
				let styles = window.getComputedStyle(child);
				bottomMargin = parseInt(styles["margin-bottom"]);
			}

			let left = Math.ceil(pos.left);
			let right = Math.floor(pos.right);
			let top = Math.ceil(pos.top);
			let bottom = Math.floor(pos.bottom + bottomMargin);

			if (!(pos.height + bottomMargin)) {
				continue;
			}

			if (left < bLeft || right > bRight || top < bTop || bottom > bBottom) {
				return child;
			}
		}
	}

	startOfOverflow(node, bounds) {
		let childNode, done = false;
		let prev;
		let anyOverflowFound = false;

		do {
			prev = node;
			do {
				childNode = this.firstOverflowingChild(node, bounds);
				if (childNode) {
					anyOverflowFound = true;
				} else {
					// The overflow isn't caused by children. It could be caused by:
					// * a sibling div / td / element with height that stretches this
					//   element
					// * margin / padding on this element
					// In the former case, we want to ignore this node and take the
					// sibling. In the later case, we want to move this node.
					let intrinsicBottom = 0, intrinsicRight = 0;
					if (isElement(node)) {
						let styles = window.getComputedStyle(node);

						if (node.childNodes.length) {
							let lastChild = node.childNodes[node.childNodes.length - 1];
							let childBounds = getBoundingClientRect(lastChild);
							intrinsicRight = childBounds.right;
							intrinsicBottom = childBounds.bottom;
						} else {
							// Has no children so should have no height, all other things
							// being equal.
							let childBounds = getBoundingClientRect(node);
							intrinsicRight = getBoundingClientRect(node).right;
							intrinsicBottom = getBoundingClientRect(node).top;
							let intrinsicLeft = getBoundingClientRect(node).x;

							// Check for possible Chromium bug case.
							if (intrinsicBottom < bounds.bottom && intrinsicLeft > (bounds.x + bounds.width)) {
								done = true;
							}
						}

						intrinsicRight += parseInt(styles["paddingRight"]) + parseInt(styles["marginRight"]);
						intrinsicBottom += parseInt(styles["paddingBottom"]) + parseInt(styles["marginBottom"]);
					} else {
						let childBounds = getBoundingClientRect(node);
						intrinsicRight = getBoundingClientRect(node).right;
						intrinsicBottom = getBoundingClientRect(node).bottom;
					}
					if (intrinsicBottom <= bounds.bottom && intrinsicRight <= bounds.right) {
						node = node.nextElementSibling;
					} else {
						// Node is causing the overflow via padding and margin or text content.
						done = true;
					}
				}
			} while (node && !childNode && !done);

			if (node) {
				node = childNode;
			}
		} while (node && !done);

		return [prev, anyOverflowFound];
	}

	rowspanNeedsBreakAt(tableRow, rendered) {
		if (tableRow.nodeName !== 'TR') {
			return;
		}

		const table = parentOf(tableRow, "TABLE", rendered);
		if (!table) {
			return;
		}

		const rowspan = table.querySelector("[colspan]");
		if (!rowspan) {
			return;
		}

		let columnCount = 0;
		for (const cell of Array.from(table.rows[0].cells)) {
			columnCount += parseInt(cell.getAttribute("colspan") || "1");
		}
		if (tableRow.cells.length !== columnCount) {
			let previousRow = tableRow;
			let previousRowColumnCount;
			while (previousRow !== null) {
				previousRowColumnCount = 0;
				for (const cell of Array.from(previousRow.cells)) {
					previousRowColumnCount += parseInt(cell.getAttribute("colspan") || "1");
				}
				if (previousRowColumnCount === columnCount) {
					break;
				}
				previousRow = previousRow.previousElementSibling;
			}
			if (previousRowColumnCount === columnCount) {
				return previousRow;
			}
		}
	}

	getOverflow(rendered, bounds, source) {
		this.hooks && this.hooks.getOverflow.trigger(rendered, bounds, source, this);
		return this.findOverflow(rendered, bounds, source);
	}

	findOverflow(rendered, bounds, source) {

		if (!this.hasOverflow(rendered, bounds)) {
			return;
		}

		let start = bounds.left;
		let end = bounds.right;
		let vStart = bounds.top;
		let vEnd = bounds.bottom;
		let range, anyOverflowFound;

		// Find the deepest element that is the first in set of siblings with
		// overflow. There may be others. We just take the first we find and
		// are called again to check for additional instances.
		let node = rendered, prev, startRemainder;

		while (isText(node)) {
			node = node.nextElementSibling;
		}

		[prev, anyOverflowFound] = this.startOfOverflow(node, bounds);

		if (!anyOverflowFound) {
			return;
		}

		// The node we finished on may be within something asking not to have its
		// contents split. It - or a parent - may also have to be split because
		// the content is just too big for the page.
		// Resolve those requirements, deciding on a node that will be split in
		// the following way:
		// 1) Prefer the smallest node we can (start with the one we ended on).
		//    While going back up the ancestors, use an ancestor instead if it
		//    has siblings that will be rendered below this one. (For columns
		//    or TD side by side, we want to do separate overflows).
		// 2) Take the shallowest parent asking not to be split that will fit
		//    within a page.
		// 3) If that resulting node doesn't fit on this page, it is the start
		//    of the overflow. If it does fit, following siblings start the range.
		// The range runs to the end of the list of siblings of the resulting
		// node. This may not be the end of where we rendered because we render
		// until the top level element is completed, so that if there is a
		// container that has multiple children laid out side by side and more
		// than one of them overflow, all the overflow gets handled correctly.
		// In this case, this function will get called multiple times, returning
		// each piece of overflow until nothing overflows the page anymore
		// (the caller does the removal of the overflow before calling us again).
		// Lastly, as we go back up the tree, we need to look for parents (or
		// the original node) having siblings that extend the overflow. They
		// should be included in this range.

		let check = startRemainder = node = prev, rangeEndNode = check, lastcheck = check;
		let mustSplit = false;
		let siblingRangeStart, siblingRangeEnd, container;
		let checkIsFirstChild = false, rowCandidate;

		// Check whether we have a td with overflow or divs laid out side by side.
		// If we do and it's within content that can be or must be split, remove
		// the overflow as our first range, and take the remaining content after
		// this TR / set of side by side divs as a second range.
		do {
			if (isElement(check)) {
				let checkBounds = getBoundingClientRect(check);

				if (checkBounds.height > bounds.height) {
					mustSplit = true;
				}

				let styles = window.getComputedStyle(check);
				if (this.avoidBreakInside(check, rendered)) {
					let rowspanNeedsBreakAt = this.rowspanNeedsBreakAt(check, rendered);
					if (rowspanNeedsBreakAt) {
						// No question - break earlier.
						siblingRangeEnd = undefined;
						prev = rowspanNeedsBreakAt;
						break;
					}

					// If there is a TD with overflow and it is within a break-inside:
					// avoid, we take the whole container, provided that it will fit
					// on a page by itself. The normal handling below will take care
					// of that.
					if (!mustSplit) {
						siblingRangeStart = siblingRangeEnd = undefined;
						prev = check;
					}

					if (!rowCandidate) {
						rowCandidate = check;
					}
				}

				if (check.nextElementSibling) {
					// This is messy. Two siblings might be side by side for a number of reasons:
					// - TD in a TR (what we're seeking to detect so we get the overflow from other TDs too)
					// - Divs side by side in a grid (we'd also like to capture overflow here but reflow might be
					//   complicated ala the next case.
					// - Footnotes or other content with a fixed height parent making overflow push out to the side
					//   (best to treat all overflow as one).
					let siblingBounds = getBoundingClientRect(check.nextElementSibling);
					let parentHeight = check.parentElement.style.height;
					let cStyle = check.currentStyle || getComputedStyle(check, "");
					if (!parentHeight && siblingBounds.top == checkBounds.top && siblingBounds.left != checkBounds.left && cStyle.display !== "inline") {
						siblingRangeStart = prev;
						siblingRangeEnd = check.lastChild;
						container = check;

						// Get the columns widths and make them attributes so removal of
						// overflow doesn't do strange things.
						check.parentElement.childNodes.forEach((childNode) => {
							if (!isText(childNode)) {
								childNode.width = getComputedStyle(childNode).width;
							}
						});

						// Might be removing all the content?
						checkIsFirstChild = (check.parentElement.firstChild === check);
					}
				}
				if (Array.from(check.classList).filter(value => ['region-content', 'pagedjs_page_content'].includes(value)).length) {
					break;
				}
			}
			lastcheck = check;
			check = check.parentElement;
		} while (check && check !== rendered);

		let offset;

		if (siblingRangeEnd) {
			let ranges = [], origSiblingRangeEnd = siblingRangeEnd;

			// Reset to take next row / equivalent as overflow too.
			startRemainder = origSiblingRangeEnd.parentElement.parentElement.nextElementSibling;

			// Get the overflow for all siblings at once.
			do {
				offset = 0;
				if (isText(siblingRangeStart) && siblingRangeStart.textContent.trim().length) {
					offset = this.textBreak(siblingRangeStart, start, end, vStart, vEnd);
				}

				// Is a whole row being removed?
				// Ignore newlines when deciding this.
				if (checkIsFirstChild && !siblingRangeStart.textContent.substring(0, offset).trim().length && rowCandidate !== undefined) {
					startRemainder = container = rowCandidate;
					siblingRangeStart = undefined;
				}
				else {
					// Set the start of the range and record on node or the previous element
					// that overflow was moved.
					range = document.createRange();
					if (offset) {
						range.setStart(siblingRangeStart, offset);
					} else {
						range.selectNode(siblingRangeStart);
					}

					// Additional nodes may have been added that will overflow further beyond
					// node. Include them in the range.
					range.setEndAfter(siblingRangeEnd || siblingRangeStart);
					ranges.push(range);

					do {
						container = container.nextElementSibling;
						if (container) {
							[siblingRangeStart] = this.startOfOverflow(container, bounds);
							siblingRangeEnd = container.lastChild;
						}
					} while (container && !siblingRangeStart);
				}

			} while (container && siblingRangeStart);

			if (startRemainder) {
				// Everything including and after node is overflow.
				range = document.createRange();
				range.selectNode(startRemainder);
				range.setEndAfter(rendered.childNodes[rendered.childNodes.length - 1]);

				ranges.push(range);
			}
			return ranges;
		}

		node = check = prev;

		do {
			if (isElement(check)) {
				let checkBounds = getBoundingClientRect(check);
				if (checkBounds.bottom > bounds.bottom) {
					mustSplit = true;
				}

				// @todo
				// If this element is the header or the first non-header row in a
				// table, treat the table as having an implicit break-inside: avoid
				// tag so avoid leaving the header all by itself.
				let styles = window.getComputedStyle(check);
				if (this.avoidBreakInside(check, rendered) && !mustSplit) {
					node = check;
				} else if (check.nextElementSibling) {
					let checkBounds = getBoundingClientRect(check);
					let siblingBounds = getBoundingClientRect(check.nextElementSibling);
					let parentHeight = check.parentElement.style.height;
					let cStyle = check.currentStyle || getComputedStyle(check, "");
					// Possibilities here:
					// - Two table TD elements: We want the content in the table data
					//   including and after the selected node.
					// - Two divs side by side (flex / grid ): We want the content
					//   including and after the selected node.
					// - Two or more elements (eg spans) with text that overflows.
					//   This time we want all subsequent children of the parent (the
					//   portion of the node and its siblings).
					// We are assuming here that sibling content is level.
					if (!parentHeight && siblingBounds.top == checkBounds.top && siblingBounds.left != checkBounds.left && cStyle.display !== "inline") {

						// I didn't want to use the node name to distinguish the above
						// cases but haven't found a better way.
						if (["TD", "TH", "DIV"].indexOf(check.nodeName) == -1) {
							node = check.parentElement;
						} else {
							node = lastcheck;
						}
					}
				}
				let classes = check.getAttribute("class");
				if (classes && classes.includes("region-content")) {
					break;
				}
			}
			lastcheck = check;
			check = check.parentElement;
		} while (check && check !== rendered);

		// Set the start of the range. This will either be node itself or some
		// text within it if node is a text node and some of its content doesn't
		// overflow.

		if (isText(node) && node.textContent.trim().length) {
			offset = this.textBreak(node, start, end, vStart, vEnd);
		}

		/**
		 * To get the content restored in the right order, we need to add overflow
		 *  to the array in the correct order. If there was overflow removed from
		 *  after this element, it needs to be added back before that previously
		 *  removed overflow.
		 */
		let rangeEndElement = rangeEndNode.previousElementSibling || rangeEndNode.parentElement;
		rangeEndElement.dataset.overflow_after = true;

		// Set the start of the range and record on node or the previous element
		// that overflow was moved.
		range = document.createRange();
		if (offset) {
			range.setStart(node, offset);
		} else {
			range.selectNode(node);
		}

		// Additional nodes may have been added that will overflow further beyond
		// node. Include them in the range.
		range.setEndAfter(rendered.lastChild);
		return [range];
	}

	findEndToken(rendered, source) {
		if (rendered.childNodes.length === 0) {
			return;
		}

		let lastChild = rendered.lastChild;

		let lastNodeIndex;
		while (lastChild && lastChild.lastChild) {
			if (!validNode(lastChild)) {
				// Only get elements with refs
				lastChild = lastChild.previousSibling;
			} else if (!validNode(lastChild.lastChild)) {
				// Deal with invalid dom items
				lastChild = prevValidNode(lastChild.lastChild);
				break;
			} else {
				lastChild = lastChild.lastChild;
			}
		}

		if (isText(lastChild)) {

			if (lastChild.parentNode.dataset.ref) {
				lastNodeIndex = indexOf(lastChild);
				lastChild = lastChild.parentNode;
			} else {
				lastChild = lastChild.previousSibling;
			}
		}

		let original = findElement(lastChild, source);

		if (lastNodeIndex) {
			original = original.childNodes[lastNodeIndex];
		}

		let after = nodeAfter(original);

		return this.breakAt(after);
	}

	textBreak(node, start, end, vStart, vEnd) {
		let wordwalker = words(node);
		let left = 0;
		let right = 0;
		let top = 0;
		let bottom = 0;
		let word, next, done, pos;
		let offset;
		let marginBottom = 0;

		// Margin bottom is needed when the node is in a block level element
		// such as a table, grid or flex, where margins don't collapse.
		// Temporarily add data-split-to as this may change margins too
		// (It always does in current code but let's not assume that).
		let parentElement;
		let immediateParent = parentElement = node.parentElement;
		immediateParent.setAttribute('data-split-to', 'foo');
		let parentStyle = window.getComputedStyle(parentElement);
		while (parentElement &&
			!parentElement.classList.contains('pagedjs_page_content') &&
			!parentElement.classList.contains('pagedjs_footnote_area')) {
			let style = window.getComputedStyle(parentElement);
			if (style['display'] !== 'block') {
				marginBottom = parseInt(parentStyle['margin-bottom']);
				break;
			}

			parentElement = parentElement.parentElement;
		}

		while (!done) {
			next = wordwalker.next();
			word = next.value;
			done = next.done;

			if (!word) {
				break;
			}

			pos = getBoundingClientRect(word);

			left = Math.floor(pos.left);
			right = Math.floor(pos.right);
			top = pos.top;
			bottom = pos.bottom;

			if (left >= end || top >= (vEnd - marginBottom)) {
				offset = word.startOffset;
				break;
			}

			// The bounds won't be exceeded so we need >= rather than >.
			// Also below for the letters.
			if (right >= end || bottom >= (vEnd - marginBottom)) {
				let letterwalker = letters(word);
				let letter, nextLetter, doneLetter;

				while (!doneLetter) {
					// Note that the letter walker continues to walk beyond the end of the word, until the end of the
					// text node.
					nextLetter = letterwalker.next();
					letter = nextLetter.value;
					doneLetter = nextLetter.done;

					if (!letter) {
						break;
					}

					pos = getBoundingClientRect(letter);
					right = pos.right;
					bottom = pos.bottom;

					if (right >= end || bottom >= (vEnd - marginBottom)) {
						offset = letter.startOffset;
						done = true;

						break;
					}
				}
			}
		}

		// Don't remove the data-split-to so that subsequent checks for overflow don't see overflow
		// where it has already been dealt with.
		// immediateParent.removeAttribute('data-split-to');

		// Don't get tricked into doing a split by whitespace at the start of a string.
		if (node.textContent.substring(0, offset).trim() == '') {
			return 0;
		}

		return offset;
	}

	removeOverflow(overflow, breakLetter) {
		let { startContainer } = overflow;
		let extracted = overflow.extractContents();

		this.hyphenateAtBreak(startContainer, breakLetter);

		return extracted;
	}

	hyphenateAtBreak(startContainer, breakLetter) {
		if (isText(startContainer)) {
			let startText = startContainer.textContent;
			let prevLetter = startText[startText.length - 1];

			// Add a hyphen if previous character is a letter or soft hyphen
			if (
				(breakLetter && /^\w|\u00AD$/.test(prevLetter) && /^\w|\u00AD$/.test(breakLetter)) ||
				(!breakLetter && /^\w|\u00AD$/.test(prevLetter))
			) {
				startContainer.parentNode.classList.add("pagedjs_hyphen");
				startContainer.textContent += this.settings.hyphenGlyph || "\u2011";
			}
		}
	}

	equalTokens(a, b) {
		if (!a || !b) {
			return false;
		}
		if (a["node"] && b["node"] && a["node"] !== b["node"]) {
			return false;
		}
		if (a["offset"] && b["offset"] && a["offset"] !== b["offset"]) {
			return false;
		}
		return true;
	}
}

EventEmitter(Layout.prototype);

export default Layout;

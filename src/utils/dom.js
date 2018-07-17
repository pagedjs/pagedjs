import { UUID } from "../utils/utils";

export function *walk(start, limiter) {
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

export function nodeAfter(node, limiter) {
	let after = node;

	if (after.nextSibling) {
		if (limiter && node === limiter) {
			return;
		}
		after = after.nextSibling;
	} else {
		while (after) {
			after = after.parentNode;
			if (limiter && after === limiter) {
				after = undefined;
				break;
			}
			if (after && after.nextSibling) {
				after = after.nextSibling;
				break;
			}
		}
	}

	return after;
}

export function nodeBefore(node, limiter) {
	let before = node;

	if (after.prevSibling) {
		if (limiter && node === limiter) {
			return;
		}
		before = after.prevSibling;
	} else {
		while (before) {
			before = before.parentNode;
			if (limiter && before === limiter) {
				before = undefined;
				break;
			}
			if (before && before.prevSibling) {
				before = prev.nextSibling;
				break;
			}
		}
	}

	return before;
}

export function elementAfter(node, limiter) {
	let after = nodeAfter(node);

	while (after && after.nodeType !== 1) {
		after = nodeAfter(after);
	}

	return after;
}

export function elementBefore(node, limiter) {
	let before = nodeAfter(node);

	while (before && before.nodeType !== 1) {
		before = nodeAfter(before);
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

export function rebuildAncestors(node) {
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
		// ancestor.setAttribute("data-split-to", parent.getAttribute("data-ref"));

		if (parent.hasAttribute("id")) {
			let dataID = parent.getAttribute("id");
			parent.setAttribute("data-id", dataID);
			parent.removeAttribute("id");
		}

		// This is handled by css :not, but also tidied up here
		if (parent.hasAttribute("data-break-before")) {
			parent.removeAttribute("data-break-before");
		}

		// if (ancestor.hasAttribute("data-break-after")) {
		// 	ancestor.removeAttribute("data-break-after");
		// }

		if (added.length) {
			let container = added[added.length-1];
			container.appendChild(parent);
		} else {
			fragment.appendChild(parent);
		}
		added.push(parent);
	}

	added = undefined;
	return fragment;
}

export function split(bound, cutElement, breakAfter) {
		let needsRemoval = [];
		let index = Array.prototype.indexOf.call(cutElement.parentNode.children, cutElement);

		if (!breakAfter && index === 0) {
			return;
		}

		if (breakAfter && index === (cutElement.parentNode.children.length - 1)) {
			return;
		}

		// Create a fragment with rebuilt ancestors
		let fragment = rebuildAncestors(cutElement);

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

export function needsBreakBefore(node) {
	if( typeof node !== "undefined" &&
			typeof node.dataset !== "undefined" &&
			typeof node.dataset.breakBefore !== "undefined" &&
			(node.dataset.breakBefore === "always" ||
			 node.dataset.breakBefore === "left" ||
			 node.dataset.breakBefore === "right")) {
		return true;
	}

	return false;
}

export function needsBreakAfter(node) {
	if( typeof node !== "undefined" &&
			typeof node.dataset !== "undefined" &&
			typeof node.dataset.breakAfter !== "undefined" &&
			(node.dataset.breakAfter === "always" ||
			 node.dataset.breakAfter === "left" ||
			 node.dataset.breakAfter === "right")) {
		return true;
	}

	return false;
}

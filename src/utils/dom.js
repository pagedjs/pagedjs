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

export function after(node, limiter) {
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

export function stackChildren(currentNode, stacked) {
	let stack = stacked || [];

	stack.unshift(currentNode);

	let children = currentNode.children;
	for (var i = 0, length = children.length; i < length; i++) {
		stackChildren(children[i], stack);
	}

	return stack;
}

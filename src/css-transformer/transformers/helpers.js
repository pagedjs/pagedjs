import * as csstree from "css-tree";

/**
 * Snapshot a `List`'s items so a caller can splice while iterating.
 *
 * @param {import("css-tree").List | undefined} list
 * @returns {Array<Object>}
 */
export function itemsOf(list) {
	const items = [];
	list?.forEach((data, item) => items.push(item));
	return items;
}

/**
 * Replace `item` with `nodes`, inserting *before* it. The walker's cursor
 * already sits past `item`, so the replacement is not revisited — which is
 * what a rule that produced final output wants, and what keeps a rewrite
 * that re-emits the same node type from looping.
 */
export function replaceItem(list, item, nodes) {
	for (const node of nodes) {
		list.insert(list.createItem(node), item);
	}
	list.remove(item);
}

/**
 * Hoist an at-rule's block into its parent list and drop the at-rule.
 *
 * Children go in *after* `item`, the opposite of `replaceItem`: the cursor
 * sits past `item` and only what lands there is visited, so a nested
 * at-rule gets flattened or dropped in its turn.
 */
export function unwrapAtrule(node, item, list) {
	let after = item;
	for (const child of itemsOf(node.block?.children)) {
		node.block.children.remove(child);
		list.insert(child, after.next);
		after = child;
	}
	list.remove(item);
}

/** Parse a selector fragment into the parts of a compound selector. */
export function parseSelectorParts(text) {
	return csstree.parse(text, { context: "selector" }).children.toArray();
}

/** Parse a declaration value into its component nodes. */
export function parseValueParts(text) {
	return csstree.parse(text, { context: "value" }).children.toArray();
}

export function buildDeclaration({ property, value, important = false }) {
	return {
		type: "Declaration",
		important,
		property,
		value:
			typeof value === "string"
				? csstree.parse(value, { context: "value" })
				: value,
	};
}

/**
 * Serialize a function's or pseudo's arguments, split on top-level commas.
 * Each group is generated as a whole so the spacing between its tokens
 * survives — `element(page title)` is one argument, not two.
 */
export function splitArguments(node) {
	const args = [];
	let group = [];
	const flush = () => args.push(generateGroup(group));

	node.children?.forEach((child) => {
		if (child.type === "Operator" && child.value === ",") {
			flush();
			group = [];
			return;
		}
		group.push(child);
	});
	if (group.length || args.length) flush();

	return args;
}

function generateGroup(nodes) {
	if (!nodes.length) return "";
	return csstree
		.generate({ type: "Value", children: new csstree.List().fromArray(nodes) })
		.trim();
}

/** Drop every declaration in `block` whose property is in `properties`. */
export function removeDeclarations(block, properties) {
	if (!block?.children) return;
	const names = properties instanceof Set ? properties : new Set(properties);
	for (const item of itemsOf(block.children)) {
		const child = item.data;
		if (child.type === "Declaration" && names.has(child.property)) {
			block.children.remove(item);
		}
	}
}

/** Insert declarations at the head of `block`, in the order given. */
export function prependDeclarations(block, declarations) {
	if (!block?.children) return;
	for (const decl of [...declarations].reverse()) {
		block.children.prepend(block.children.createItem(buildDeclaration(decl)));
	}
}

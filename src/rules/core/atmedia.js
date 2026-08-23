import { getSimpleMediaQuery } from "../../css-transformer/utils/mediaQueries.js";

export const atMediaRules = [
	{
		type: "at-rule",
		match: (node) =>
			node.type === "Atrule" &&
			node.name === "media" &&
			getSimpleMediaQuery(node) === "print",
		transform: (node, item, list) => {
			if (!list || !item) return;
			// Move the block's children in *after* `item`. The walker's cursor
			// already sits past `item`, so anything inserted before it is never
			// visited — and a nested @media has to be flattened or dropped too.
			let after = item;
			for (const child of childItems(node.block)) {
				node.block.children.remove(child);
				list.insert(child, after.next);
				after = child;
			}
			list.remove(item);
		},
	},
	{
		type: "at-rule",
		match: (node) =>
			node.type === "Atrule" &&
			node.name === "media" &&
			getSimpleMediaQuery(node) === "screen",
		transform: (_node, item, list) => {
			if (!list || !item) return;
			list.remove(item);
		},
	},
];

function childItems(block) {
	const items = [];
	block?.children?.forEach((data, item) => items.push(item));
	return items;
}

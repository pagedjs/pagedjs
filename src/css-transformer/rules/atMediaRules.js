import { getSimpleMediaQuery } from "../utils/mediaQueries.js";

export default [
	{
		match: (node) =>
			node.type === "Atrule" &&
			node.name === "media" &&
			getSimpleMediaQuery(node) === "print",
		transform: (node, item, list) => {
			if (!list || !item) return;
			if (node.block && node.block.children) {
				const children = [];
				node.block.children.forEach((c) => children.push(c));
				for (const child of children) {
					list.insert(list.createItem(child), item);
				}
			}
			list.remove(item);
		},
	},
	{
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

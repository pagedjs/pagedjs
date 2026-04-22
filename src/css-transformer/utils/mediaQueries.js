import * as csstree from "css-tree";

/**
 * If `atruleNode` is an `@media` rule whose prelude is exactly `print` or
 * `screen`, return that keyword. Otherwise null.
 * @param {import("css-tree").Atrule} atruleNode
 * @returns {"print" | "screen" | null}
 */
export function getSimpleMediaQuery(atruleNode) {
	if (!atruleNode || !atruleNode.prelude) return null;
	const text = csstree.generate(atruleNode.prelude).trim();
	return text === "print" || text === "screen" ? text : null;
}

import * as csstree from "css-tree";

/**
 * Unified transformer for all at-rules, including `@page`.
 *
 * Each rule is:
 * {
 *   match: (node, item, list) => boolean,
 *   transform: (node, item, list) => void | { selector }
 * }
 *
 * Returning `{ selector }` converts the at-rule into a style rule with
 * that selector list, keeping the node identity and its block. Rules that
 * splice the list or edit the block do so in place and return nothing.
 */
export function transformAtRules(ast, rules = []) {
	csstree.walk(ast, {
		visit: "Atrule",
		enter(node, item, list) {
			for (const rule of rules) {
				if (!rule.match(node, item, list)) continue;

				const result = rule.transform(node, item, list);
				if (result?.selector) {
					convertToRule(node, result.selector);
					return;
				}
			}
		},
	});

	return ast;
}

function convertToRule(node, selector) {
	node.type = "Rule";
	node.prelude = csstree.parse(selector, { context: "selectorList" });
	node.name = undefined;
}

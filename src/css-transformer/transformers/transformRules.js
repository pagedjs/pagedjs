import * as csstree from "css-tree";

/**
 * Unified transformer for plain `Rule` nodes (selector + block).
 *
 * Each rule is:
 * {
 *   match: (node) => boolean,
 *   transform: (node) => void
 * }
 *
 * Rules receive the whole Rule node so they have access to both the prelude
 * (selector list) and the block (declarations) without needing a separate walk.
 */
export function transformRules(ast, rules = []) {
	csstree.walk(ast, {
		visit: "Rule",
		enter(node, item, list) {
			for (const rule of rules) {
				if (rule.match(node, item, list)) {
					rule.transform(node, item, list);
				}
			}
		},
	});

	return ast;
}

import * as csstree from "css-tree";
import {
	itemsOf,
	prependDeclarations,
	removeDeclarations,
	replaceItem,
	unwrapAtrule,
} from "./helpers.js";

/**
 * The at-rule pass: `at-rule` rules, then `media-query` rules over the
 * prelude of whatever at-rules survive.
 *
 * Both share one `Atrule` traversal. The fast traversal stops at the
 * at-rule and never descends into its prelude, so the inner walk is over
 * one query list.
 *
 * at-rule — ctx `{ name, prelude, block, node, item, list }`
 * - `{ selector }` converts the at-rule into a style rule with that
 *   selector list, keeping node identity and block, and stops.
 *   `removeDeclarations` (property names) and `prependDeclarations`
 *   (`{ property, value }`) may accompany it, applied to the block first.
 * - `{ unwrap: true }` hoists the block into the parent list and stops.
 * - `{ remove: true }` drops the at-rule and stops.
 * - Returning nothing leaves the node for later rules; edit it in place.
 *
 * media-query — ctx `{ name, modifier, mediaType, condition, query, node, item, list, atrule }`
 * - `{ unwrap: true }` — this query always matches, so the at-rule's
 *   wrapper is redundant: hoist the block.
 * - `{ remove: true }` — this query never matches; drop it from the list.
 *   The at-rule goes away once its last query does.
 * - `{ query }` replaces this query and stops.
 */
export function transformAtRules(ast, rules = {}) {
	const atRuleRules = rules["at-rule"] ?? [];
	const mediaQueryRules = rules["media-query"] ?? [];
	if (!atRuleRules.length && !mediaQueryRules.length) return ast;

	csstree.walk(ast, {
		visit: "Atrule",
		enter(node, item, list) {
			if (applyAtRuleRules(node, item, list, atRuleRules)) return;
			// A converted at-rule is a Rule now and has no prelude to resolve.
			if (node.type !== "Atrule") return;
			applyMediaQueryRules(node, item, list, mediaQueryRules);
		},
	});

	return ast;
}

function applyAtRuleRules(node, item, list, rules) {
	if (!rules.length) return false;

	const ctx = {
		name: node.name,
		prelude: node.prelude,
		block: node.block,
		node,
		item,
		list,
	};

	for (const rule of rules) {
		if (!rule.match(ctx)) continue;

		const result = rule.transform(ctx);
		if (!result) continue;

		if (result.selector) {
			if (result.removeDeclarations) {
				removeDeclarations(node.block, result.removeDeclarations);
			}
			if (result.prependDeclarations) {
				prependDeclarations(node.block, result.prependDeclarations);
			}
			convertToRule(node, result.selector);
			return true;
		}
		if (!item || !list) continue;
		if (result.unwrap) {
			unwrapAtrule(node, item, list);
			return true;
		}
		if (result.remove) {
			list.remove(item);
			return true;
		}
	}

	return false;
}

function applyMediaQueryRules(atrule, item, list, rules) {
	if (!rules.length || !item || !list) return;

	const queries = findMediaQueryList(atrule.prelude);
	if (!queries) return;

	for (const queryItem of itemsOf(queries.children)) {
		const node = queryItem.data;
		const ctx = {
			name: atrule.name,
			modifier: node.modifier,
			mediaType: node.mediaType,
			condition: node.condition ? csstree.generate(node.condition) : null,
			query: csstree.generate(node),
			node,
			item: queryItem,
			list: queries.children,
			atrule,
		};

		for (const rule of rules) {
			if (!rule.match(ctx)) continue;

			const result = rule.transform(ctx);
			if (!result) continue;

			if (result.unwrap) {
				unwrapAtrule(atrule, item, list);
				return;
			}
			if (result.remove) {
				queries.children.remove(queryItem);
				break;
			}
			if (result.query != null) {
				const parsed = csstree.parse(result.query, {
					context: "mediaQueryList",
				});
				replaceItem(queries.children, queryItem, parsed.children.toArray());
				break;
			}
		}
	}

	if (queries.children.isEmpty) list.remove(item);
}

function findMediaQueryList(prelude) {
	let found = null;
	prelude?.children?.forEach((child) => {
		if (!found && child.type === "MediaQueryList") found = child;
	});
	return found;
}

function convertToRule(node, selector) {
	node.type = "Rule";
	node.prelude = csstree.parse(selector, { context: "selectorList" });
	node.name = undefined;
}

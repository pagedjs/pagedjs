import * as csstree from "css-tree";
import {
	itemsOf,
	parseSelectorParts,
	replaceItem,
	splitArguments,
} from "./helpers.js";

const PSEUDO_KINDS = {
	PseudoElementSelector: "element",
	PseudoClassSelector: "class",
};

/**
 * The style-rule pass: `rule` rules, then `selector` rules over each
 * selector in the prelude, then `pseudo` rules over the parts within it.
 *
 * All three share one `Rule` traversal. The fast traversal never descends
 * into preludes, so walking selectors here replaces what used to be a
 * whole-sheet `Selector` walk. Selectors nested in `:is()` / `:not()` are
 * reached too, each in its own turn.
 *
 * rule — ctx `{ selector, block, node, item, list }`
 * - `{ selector }` reparses the prelude in place; later rules see it.
 * - `{ remove: true }` drops the rule and stops.
 *
 * selector — ctx `{ selector, node, item, list, rule }` for one `Selector`
 * - `{ selector }` reparses that selector in place; later rules see it.
 * - `{ remove: true }` drops it from the selector list and stops. A rule
 *   whose last selector goes is dropped with it.
 *
 * pseudo — ctx `{ name, kind, args, selector, node, item, list, rule }`
 * for one `::element` or `:class` part, `kind` being `"element"` or
 * `"class"`, with `item`/`list` positioned in the containing compound.
 * - `{ selector }` splices that selector fragment in place of the part and stops.
 * - `{ remove: true }` drops the part and stops.
 */
export function transformRules(ast, rules = {}) {
	const ruleRules = rules.rule ?? [];
	const selectorRules = rules.selector ?? [];
	const pseudoRules = rules.pseudo ?? [];
	if (!ruleRules.length && !selectorRules.length && !pseudoRules.length) {
		return ast;
	}

	csstree.walk(ast, {
		visit: "Rule",
		enter(node, item, list) {
			if (applyRuleRules(node, item, list, ruleRules)) return;

			if (!selectorRules.length && !pseudoRules.length) return;
			if (node.prelude?.type !== "SelectorList") return;

			csstree.walk(node.prelude, {
				visit: "Selector",
				enter(selector, selectorItem, selectorList) {
					const dropped = applySelectorRules(
						selector,
						selectorItem,
						selectorList,
						selectorRules,
						node,
					);
					if (!dropped) applyPseudoRules(selector, pseudoRules, node);
				},
			});

			if (node.prelude.children.isEmpty && item && list) list.remove(item);
		},
	});

	return ast;
}

function applyRuleRules(node, item, list, rules) {
	if (!rules.length) return false;

	const ctx = {
		selector: node.prelude ? csstree.generate(node.prelude) : "",
		block: node.block,
		node,
		item,
		list,
	};

	for (const rule of rules) {
		if (!rule.match(ctx)) continue;

		const result = rule.transform(ctx);
		if (!result) continue;

		if (result.remove) {
			if (!item || !list) continue;
			list.remove(item);
			return true;
		}
		if (result.selector != null && result.selector !== ctx.selector) {
			node.prelude = csstree.parse(result.selector, {
				context: "selectorList",
			});
			ctx.selector = csstree.generate(node.prelude);
		}
	}

	return false;
}

function applySelectorRules(selector, item, list, rules, rule) {
	if (!rules.length) return false;

	const ctx = {
		selector: csstree.generate(selector),
		node: selector,
		item,
		list,
		rule,
	};

	for (const selectorRule of rules) {
		if (!selectorRule.match(ctx)) continue;

		const result = selectorRule.transform(ctx);
		if (!result) continue;

		if (result.remove) {
			if (!item || !list) continue;
			list.remove(item);
			return true;
		}
		if (result.selector != null && result.selector !== ctx.selector) {
			selector.children = csstree.parse(result.selector, {
				context: "selector",
			}).children;
			ctx.selector = csstree.generate(selector);
		}
	}

	return false;
}

function applyPseudoRules(selector, rules, rule) {
	if (!rules.length) return;

	for (const item of itemsOf(selector.children)) {
		const node = item.data;
		const kind = PSEUDO_KINDS[node.type];
		if (!kind) continue;

		const ctx = {
			name: node.name,
			kind,
			args: node.children ? splitArguments(node) : null,
			selector: csstree.generate(selector),
			node,
			item,
			list: selector.children,
			rule,
		};

		for (const pseudoRule of rules) {
			if (!pseudoRule.match(ctx)) continue;

			const result = pseudoRule.transform(ctx);
			if (!result) continue;

			if (result.remove) {
				selector.children.remove(item);
				break;
			}
			if (result.selector != null) {
				replaceItem(
					selector.children,
					item,
					parseSelectorParts(result.selector),
				);
				break;
			}
		}
	}
}

import * as csstree from "css-tree";
import {
	buildDeclaration,
	parseValueParts,
	replaceItem,
	splitArguments,
} from "./helpers.js";

/**
 * The value pass: `declaration` rules, then `function` rules over the value
 * each declaration ends up with.
 *
 * Both share one `Declaration` traversal. css-tree fast-traverses to
 * declarations through containers only, so the inner walk covers a single
 * value rather than the sheet — adding `function` costs no extra pass.
 *
 * declaration — ctx `{ property, value, valueAST, node, item, list }`
 * - `{ property?, value? }` rewrites in place; later rules see the result.
 * - `{ declarations: [{ property, value, important? }] }` replaces it and stops.
 * - `{ remove: true }` drops the declaration and stops.
 *
 * function — ctx `{ name, value, args, node, item, list, declaration }`
 * - `{ value }` replaces the function with that value fragment and stops.
 * - `{ remove: true }` drops the function and stops.
 */
export function transformValues(ast, rules = {}) {
	const declarationRules = rules.declaration ?? [];
	const functionRules = rules.function ?? [];
	if (!declarationRules.length && !functionRules.length) return ast;

	csstree.walk(ast, {
		visit: "Declaration",
		enter(node, item, list) {
			if (applyDeclarationRules(node, item, list, declarationRules)) return;
			applyFunctionRules(node, functionRules);
		},
	});

	return ast;
}

function applyDeclarationRules(node, item, list, rules) {
	const ctx = {
		property: node.property,
		value: csstree.generate(node.value),
		valueAST: node.value,
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

		if (Array.isArray(result.declarations)) {
			if (!item || !list) continue;
			replaceItem(list, item, result.declarations.map(buildDeclaration));
			return true;
		}

		if (result.property) node.property = result.property;
		if (result.value) {
			node.value = csstree.parse(result.value, { context: "value" });
		}

		ctx.property = node.property;
		ctx.valueAST = node.value;
		ctx.value = csstree.generate(node.value);
	}

	return false;
}

function applyFunctionRules(declaration, rules) {
	if (!rules.length || !declaration.value) return;

	csstree.walk(declaration.value, {
		visit: "Function",
		enter(node, item, list) {
			if (!item || !list) return;

			const ctx = {
				name: node.name,
				value: csstree.generate(node),
				args: splitArguments(node),
				node,
				item,
				list,
				declaration,
			};

			for (const rule of rules) {
				if (!rule.match(ctx)) continue;

				const result = rule.transform(ctx);
				if (!result) continue;

				if (result.remove) {
					list.remove(item);
					return;
				}
				if (result.value != null) {
					replaceItem(list, item, parseValueParts(result.value));
					return;
				}
			}
		},
	});
}

import * as csstree from "css-tree";
import { transformValues } from "./transformers/transformValues.js";
import { transformAtRules } from "./transformers/transformAtRules.js";
import { transformRules } from "./transformers/transformRules.js";
import { transformUrls } from "./transformers/transformUrls.js";
import { inlineImports } from "./utils/inlineImports.js";

/**
 * The passes `apply()` runs, in order, and the rule types each one serves.
 *
 * Rule types are grouped rather than given a walk apiece: every pass roots
 * on a node type css-tree fast-traverses to (`Declaration`, `Atrule`,
 * `Rule`), and reaches the finer types by walking the subtree it already
 * has — a value, a prelude. Adding `function`, `media-query` or `pseudo`
 * therefore costs no extra traversal of the sheet.
 *
 * `url` is in neither: URLs are rewritten in `prepare()`, per source sheet,
 * because resolution needs that sheet's base URL.
 */
const PASSES = [
	{ types: ["declaration", "function"], apply: transformValues },
	{ types: ["at-rule", "media-query"], apply: transformAtRules },
	{ types: ["rule", "selector", "pseudo"], apply: transformRules },
];

/**
 * Rewrites a `css-tree` AST with a fixed set of rules.
 *
 * A rule is `{ type, match, transform }`. `type` selects the walker;
 * anything with an unknown type is carried but never run.
 *
 * `match(ctx)` and `transform(ctx)` both take the same single context
 * object, so a rule destructures only what it needs and a walker can add
 * a field without changing any signature. Every ctx carries `node` (the
 * AST node matched) plus `item` and `list` (its position in the enclosing
 * `List`, when it has one); the rest is per type. Serialized conveniences
 * are named after the thing — `value`, `selector`, `query`, `url`.
 *
 * | type          | matches                          | ctx adds                                          | `transform` may return                                                                |
 * | ------------- | -------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------- |
 * | `declaration` | every `Declaration`              | `property`, `value`, `valueAST`                    | `{ property?, value? }`, `{ declarations: [{ property, value, important? }] }`, `{ remove }` |
 * | `function`    | every `Function` in a value      | `name`, `value`, `args`, `declaration`             | `{ value }`, `{ remove }`                                                               |
 * | `at-rule`     | every `Atrule`                   | `name`, `prelude`, `block`                         | `{ selector, removeDeclarations?, prependDeclarations? }`, `{ unwrap }`, `{ remove }`   |
 * | `media-query` | every `MediaQuery` in a prelude  | `name`, `modifier`, `mediaType`, `condition`, `query`, `atrule` | `{ query }`, `{ unwrap }`, `{ remove }`                                    |
 * | `rule`        | every `Rule`                     | `selector`, `block`                                | `{ selector }`, `{ remove }`                                                            |
 * | `selector`    | every `Selector`, nested too     | `selector`, `rule`                                 | `{ selector }`, `{ remove }`                                                            |
 * | `pseudo`      | every `::element` / `:class` part | `name`, `kind`, `args`, `selector`, `rule`        | `{ selector }`, `{ remove }`                                                            |
 * | `url`         | every `Url`, already rebased     | `url`, `baseURL`                                   | `{ url }`                                                                               |
 *
 * A result that edits the node in place — `{ property }`, `{ value }` on a
 * declaration, `{ selector }` on a rule or selector, `{ url }` — refreshes
 * ctx, and later rules of that type see the new state. Anything that
 * replaces, removes or reparents the node stops the chain for that node.
 */
export class CssTransformer {
	#rulesByType = new Map();

	/**
	 * @param {Object} [options]
	 * @param {Array<{ type: string, match: Function, transform: Function }>} [options.rules]
	 */
	constructor({ rules = [] } = {}) {
		for (const rule of rules) {
			if (!rule?.type) continue;
			const forType = this.#rulesByType.get(rule.type);
			if (forType) {
				forType.push(rule);
			} else {
				this.#rulesByType.set(rule.type, [rule]);
			}
		}
	}

	/**
	 * @param {string | Array<{ css: string, cssBaseURL?: string }>} input
	 *   Either text, or an array of stylesheet sources to concatenate.
	 * @returns {Promise<import("css-tree").CssNode>} Combined AST ready for `apply()`.
	 */
	async prepare(input) {
		const entries = typeof input === "string" ? [{ css: input }] : input;
		const urlRules = this.#rulesByType.get("url") ?? [];
		const combined = csstree.parse("");
		for (const { css = "", cssBaseURL = "" } of entries) {
			const ast = csstree.parse(css);
			await inlineImports(ast, cssBaseURL);
			transformUrls(ast, urlRules, { baseURL: cssBaseURL });
			ast.children.forEach((c) => {
				combined.children.append(combined.children.createItem(c));
			});
		}
		return combined;
	}

	apply(ast) {
		for (const pass of PASSES) {
			const rules = {};
			let active = false;
			for (const type of pass.types) {
				const forType = this.#rulesByType.get(type);
				if (forType) {
					rules[type] = forType;
					active = true;
				}
			}
			if (active) pass.apply(ast, rules);
		}
		return ast;
	}
}

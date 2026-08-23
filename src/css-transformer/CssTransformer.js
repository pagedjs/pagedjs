import * as csstree from "css-tree";
import { transformDeclarations } from "./transformers/transformDeclarations.js";
import { transformAtRules } from "./transformers/transformAtRules.js";
import { transformRules } from "./transformers/transformRules.js";
import { transformPseudos } from "./transformers/transformPseudos.js";
import { transformUrls } from "./transformers/transformUrls.js";
import { inlineImports } from "./utils/inlineImports.js";

/**
 * Walkers keyed by rule type, in the order `apply()` runs them.
 * `url` is absent: URLs are rewritten in `prepare()`, per source sheet,
 * because resolution needs that sheet's base URL.
 */
const WALKERS = {
	"declaration": transformDeclarations,
	"at-rule": transformAtRules,
	"rule": transformRules,
	"pseudo": transformPseudos,
};

/**
 * Rewrites a `css-tree` AST with a fixed set of rules.
 *
 * A rule is `{ type, match, transform }`. `type` selects the walker;
 * anything with an unknown type is carried but never run.
 *
 * | type          | match / transform arguments                              | transform result                                                     |
 * | ------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
 * | `declaration` | `{ property, valueString, valueAST, node, item, list }`    | `{ property?, value? }` rewrites in place and later rules see it; `{ declarations: [{ property, value, important? }] }` replaces the declaration and stops |
 * | `at-rule`     | `(node, item, list)`                                       | `{ selector }` turns the at-rule into a style rule with that selector list and stops; otherwise mutate `node` / `list` in place |
 * | `rule`        | `(node, item, list)` — the whole `Rule`, prelude and block | none; mutate in place                                                  |
 * | `pseudo`      | `(selectorString, node)` for every `Selector`              | the replacement selector string, or a falsy value to leave it alone    |
 * | `url`         | `(url, { baseURL })` for every `Url`, already rebased      | the replacement URL string                                             |
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
		for (const [type, walk] of Object.entries(WALKERS)) {
			const rules = this.#rulesByType.get(type);
			if (rules) {
				walk(ast, rules);
			}
		}
		return ast;
	}
}

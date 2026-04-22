import * as csstree from "css-tree";
import { transformDeclarations } from "./transformers/transformDeclarations.js";
import { transformAtRules } from "./transformers/transformAtRules.js";
import { transformPseudos } from "./transformers/transformPseudos.js";
import { transformUrls } from "./transformers/transformUrls.js";
import { inlineImports } from "./utils/inlineImports.js";

export const declarationRules = [];
export const atRuleRules = [];
export const pseudoRules = [];
export const urlRules = [];

export class CssTransformer {
	static addDeclarationRule(match, transform) {
		declarationRules.push({ match, transform });
	}

	static addAtRuleRule(match, transform) {
		atRuleRules.push({ match, transform });
	}

	static addPseudoRule(match, transform) {
		pseudoRules.push({ match, transform });
	}

	static addUrlRule(match, transform) {
		urlRules.push({ match, transform });
	}

	/**
	 * @param {string | Array<{ css: string, cssBaseURL?: string }>} input
	 *   Either text, or an array of stylesheet sources to concatenate.
	 * @returns {Promise<import("css-tree").CssNode>} Combined AST ready for `apply()`.
	 */
	async prepare(input) {
		const entries = typeof input === "string" ? [{ css: input }] : input;
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
		transformDeclarations(ast, declarationRules);
		transformAtRules(ast, atRuleRules);
		transformPseudos(ast, pseudoRules);
		return ast;
	}
}

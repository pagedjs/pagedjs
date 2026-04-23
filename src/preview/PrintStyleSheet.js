import * as csstree from "css-tree";
import { CssTransformer } from "../css-transformer/CssTransformer.js";
import { collectAllPageData } from "../css-transformer/utils/extractPageData.js";
import { buildAtPageRules } from "./utils/buildAtPageRules.js";
import { buildPagedVariableRules } from "./utils/buildPagedVariableRules.js";
import { loadStylesheets } from "./utils/loadStylesheets.js";
import "../css-transformer/rules/index.js";

const PRINT_BODY_RESET =
	"@media print { body { margin: 0 !important; padding: 0 !important; } }";

export class PrintStyleSheet extends CSSStyleSheet {
	#pageData = [];

	static async fromText(cssText, baseURL) {
		const base = baseURL ?? document.baseURI;
		return PrintStyleSheet.fromEntries([{ css: cssText, cssBaseURL: base }]);
	}

	static async fromDocument(options = {}) {
		const entries = await loadStylesheets(options);
		return PrintStyleSheet.fromEntries(entries);
	}

	static async fromEntries(entries) {
		const ps = new PrintStyleSheet();
		await ps.#buildFromEntries(entries);
		return ps;
	}

	toJSON() {
		return this.#pageData;
	}

	async #buildFromEntries(entries) {
		const transformer = new CssTransformer();
		const combined = await transformer.prepare(entries);

		this.#pageData = collectAllPageData(combined);

		transformer.apply(combined);

		await this.replace(csstree.generate(combined));

		for (const rule of buildPagedVariableRules(this.#pageData)) {
			this.insertRule(rule, this.cssRules.length);
		}

		for (const rule of buildAtPageRules(this.#pageData)) {
			this.insertRule(rule, this.cssRules.length);
		}

		this.insertRule(PRINT_BODY_RESET, this.cssRules.length);
	}
}

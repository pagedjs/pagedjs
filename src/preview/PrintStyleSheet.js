import * as csstree from "css-tree";
import { Fragmenter } from "fragmentainers";
import { CssTransformer } from "../css-transformer/CssTransformer.js";
import { collectAllPageData } from "../css-transformer/utils/extractPageData.js";
import { buildPagedVariableRules } from "./utils/buildPagedVariableRules.js";
import { collectRules } from "./utils/collectRules.js";
import { loadStylesheets } from "./utils/loadStylesheets.js";

const PRINT_BODY_RESET =
	"@media print { body { margin: 0 !important; padding: 0 !important; } }";

export class PrintStyleSheet extends CSSStyleSheet {
	#pageData = [];

	/**
	 * @param {string} cssText
	 * @param {string} [baseURL]
	 * @param {Object} [options]
	 * @param {Array<Object>} [options.rules] - Extra transformer rules,
	 *   appended after the ones the handler catalog contributes.
	 */
	static async fromText(cssText, baseURL, { rules = [] } = {}) {
		const base = baseURL ?? document.baseURI;
		return PrintStyleSheet.fromEntries([{ css: cssText, cssBaseURL: base }], {
			rules,
		});
	}

	static async fromDocument(options = {}) {
		const { rules = [], ...loadOptions } = options;
		const entries = await loadStylesheets(loadOptions);
		return PrintStyleSheet.fromEntries(entries, { rules });
	}

	static async fromEntries(entries, { rules = [] } = {}) {
		const ps = new PrintStyleSheet();
		await ps.#buildFromEntries(entries, rules);
		return ps;
	}

	toJSON() {
		return this.#pageData;
	}

	async #buildFromEntries(entries, extraRules) {
		const transformer = new CssTransformer({
			rules: [...collectRules(Fragmenter.handlers), ...extraRules],
		});
		const combined = await transformer.prepare(entries);

		this.#pageData = collectAllPageData(combined);

		transformer.apply(combined);

		await this.replace(csstree.generate(combined));

		for (const rule of buildPagedVariableRules(this.#pageData)) {
			this.insertRule(rule, this.cssRules.length);
		}

		this.insertRule(PRINT_BODY_RESET, this.cssRules.length);
	}
}

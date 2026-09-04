import { Fragmenter } from "fragmentainers";
import { CssTransformer } from "../css-transformer/CssTransformer.js";
import { collectAllPageData } from "./utils/pageData.js";
import { buildPagedVariableRules } from "./utils/buildPagedVariableRules.js";
import { collectRules } from "./utils/collectRules.js";
import { fetchStylesheet, loadStylesheets } from "./utils/loadStylesheets.js";

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

	/**
	 * @param {Array<string|{ css?: string, href?: string, cssBaseURL?: string }>} entries
	 *   Each entry is either an href to fetch — a bare string, or an object
	 *   with `href` — or CSS text as `{ css, cssBaseURL }`. `cssBaseURL` is
	 *   what relative `url()` and `@import` resolve against, defaulting to
	 *   the document's base URI; a fetched href brings its own.
	 *   Entries that fail to fetch are warned about and skipped.
	 * @param {Object} [options]
	 * @param {Array<Object>} [options.rules] - Extra transformer rules,
	 *   appended after the ones the handler catalog contributes.
	 * @returns {Promise<PrintStyleSheet>}
	 */
	static async fromEntries(entries, { rules = [] } = {}) {
		const sheet = new PrintStyleSheet();
		await sheet.#buildFromEntries(await resolveEntries(entries), rules);
		return sheet;
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

		await this.replace(transformer.generate(combined));

		for (const rule of buildPagedVariableRules(this.#pageData)) {
			this.insertRule(rule, this.cssRules.length);
		}

		this.insertRule(PRINT_BODY_RESET, this.cssRules.length);
	}
}

/**
 * Fetch the entries given as hrefs, so a caller can hand `fromEntries` the
 * same mix of links and inline styles a document holds.
 *
 * @param {Array<string|Object>} entries
 * @returns {Promise<Array<{ css: string, cssBaseURL: string }>>}
 */
async function resolveEntries(entries = []) {
	const resolved = await Promise.all(entries.map(resolveEntry));
	return resolved.filter(Boolean);
}

/**
 * @param {string|{ css?: string, href?: string, cssBaseURL?: string }} entry
 * @returns {Promise<{ css: string, cssBaseURL: string }|null>|{ css: string, cssBaseURL: string }|null}
 */
function resolveEntry(entry) {
	if (!entry) return null;
	if (typeof entry === "string") return fetchStylesheet(entry);
	if (typeof entry.css === "string") {
		return { css: entry.css, cssBaseURL: entry.cssBaseURL ?? document.baseURI };
	}
	return entry.href ? fetchStylesheet(entry.href) : null;
}

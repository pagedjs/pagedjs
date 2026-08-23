import { Fragmenter, PageResolver } from "fragmentainers";
import { PrintStyleSheet } from "./PrintStyleSheet.js";
import { buildAtPageRules } from "./utils/buildAtPageRules.js";
import Hook from "../utils/hook.js";
// Register the custom paged elements.
import "../components/index.js";

/**
 * The main class responsible for preparing, fragmenting, styling, and rendering content into paginated previews.
 *
 * Emits events:
 * - `page`: when a page is rendered
 * - `rendering`: when rendering starts
 * - `rendered`: when rendering finishes
 * - `size`: when page size is set
 * - `atpages`: when @page rules are processed
 */
export class PagedPreview extends HTMLElement {
	#document;
	#content;
	#options;
	#flowOptions;
	#flowing = null;
	#currentFlow = null;
	#adoptedSheet = null;
	#pageStyle = null;

	/**
	 * @param {Object} [options]
	 * @param {boolean} [options.removeStyles=true] - Remove the document's
	 *   stylesheets once collected.
	 * @param {Object} [options.flow] - Options forwarded verbatim to every
	 *   `Fragmenter` this previewer creates (`devicePixelRatio`,
	 *   `emulatePrintPixelRatio`, `styleSheet`, ...). `styles` and `resolver`
	 *   are computed per render and cannot be overridden here.
	 * @param {boolean} [options.emulatePrintPixelRatio] - Alias for
	 *   `options.flow.emulatePrintPixelRatio`; the flow bag wins.
	 * @param {Array<Object>} [options.rules] - Extra `CssTransformer` rules
	 *   applied to every stylesheet this previewer builds, after the ones
	 *   the handler catalog contributes.
	 */
	constructor(options = {}) {
		super();
		this.#options = {
			removeStyles: options.removeStyles ?? true,
			rules: options.rules ?? [],
		};
		this.#flowOptions = { ...(options.flow ?? {}) };
		if (
			options.emulatePrintPixelRatio !== undefined &&
			this.#flowOptions.emulatePrintPixelRatio === undefined
		) {
			this.#flowOptions.emulatePrintPixelRatio = options.emulatePrintPixelRatio;
		}

		this.hooks = {
			beforePreview: new Hook(this),
			// Runs with the normalized DocumentFragment after content is set
			// and before stylesheets are collected or anything is laid out.
			// Mutate the fragment in place (e.g. set fragmentainers markers);
			// return values are ignored.
			beforeFlow: new Hook(this),
			afterPreview: new Hook(this),
		};

		this.#document = document.createElement("paged-document");
	}

	connectedCallback() {
		if (this.#document.parentElement !== this) {
			this.appendChild(this.#document);
		}
	}

	get document() {
		return this.#document;
	}

	get generatedPages() {
		return Array.from(
			this.#document.querySelectorAll(":scope > paged-page[data-generated]"),
		);
	}

	get pages() {
		return this.#document?.pages || [];
	}

	set content(input) {
		if (input instanceof DocumentFragment) {
			this.#content = input;
		} else if (input instanceof Node) {
			const fragment = document.createDocumentFragment();
			fragment.appendChild(input);
			this.#content = fragment;
		} else if (typeof input === "string") {
			const parse = document.createElement("template");
			parse.innerHTML = input;
			this.#content = parse.content;
		}
	}

	/**
	 * Main method for rendering content into paged preview.
	 * Triggers hooks and events, applies stylesheets, fragments the content, and returns the flow result.
	 *
	 * @param {HTMLElement|DocumentFragment|string} [content] - The content to render.
	 * @param {Array<string|Object>} [stylesheets] - List of stylesheet hrefs or inline styles to apply.
	 * @param {HTMLElement|string} [renderTo] - Element or selector where rendered content will be inserted.
	 * @returns {Promise<Object>} - Resolves to the rendered flow object with performance and size metadata.
	 */
	async preview(content, stylesheets, renderTo) {
		await this.hooks.beforePreview.trigger(content, renderTo);

		this.content = content;

		if (renderTo) {
			renderTo.appendChild(this);
		}

		const flow = await this.flow(this.#content, stylesheets);

		await this.hooks.afterPreview.trigger(flow);

		return flow;
	}

	/**
	 * Fragment the content and flow into `<paged-page>` elements.
	 *
	 * @param {HTMLElement|DocumentFragment|string} [content] - The content to
	 *   render. When omitted, the previously set content is reused.
	 * @param {Array<string|Object>} [stylesheets] - List of stylesheet hrefs or inline styles to apply.
	 * @returns {Promise<Fragmenter>}
	 */
	async flow(content, stylesheets) {
		if (this.#flowing) {
			return this.#flowing;
		}
		if (content !== undefined && content !== null) {
			this.content = content;
		}
		if (this.pages.length) {
			this.#clear();
		}

		this.#flowing = this.#flow(stylesheets).finally(() => {
			this.#flowing = null;
		});

		return this.#flowing;
	}

	/**
	 * The `Fragmenter` of the most recent render, until the next render
	 * replaces it or `destroy()` runs.
	 */
	get currentFlow() {
		return this.#currentFlow;
	}

	async #flow(stylesheets) {
		const startTime = performance.now();
		this.#dispatch("rendering", { preview: this });

		this.#destroyFlow();
		await this.hooks.beforeFlow.trigger(this.#content);

		const styles = stylesheets
			? await PrintStyleSheet.fromEntries(stylesheets, {
				rules: this.#options.rules,
			})
			: await PrintStyleSheet.fromDocument({
				remove: this.#options.removeStyles,
				rules: this.#options.rules,
			});
		this.#adoptSheet(styles);

		const pageData = styles.toJSON();
		this.#injectPageStyle(pageData);
		this.#dispatch("atpages", { pages: pageData });

		const resolver = new PageResolver(pageData);
		this.#dispatch("size", { size: resolver });

		const flow = new Fragmenter(this.#content, {
			...this.#flowOptions,
			styles,
			resolver,
		});
		this.#currentFlow = flow;
		await flow.preload();

		for (const fragment of flow) {
			const constraints = fragment.constraints ?? {};
			const page = this.#document.addPage(fragment, {
				name: fragment.namedPage,
				blank: constraints.isBlank,
				verso: constraints.isVerso,
				recto: constraints.isRecto,
				first: constraints.isFirst,
			});

			this.#dispatch("page", { page });
		}

		flow.performance = performance.now() - startTime;
		flow.size = this.resolver;

		this.#dispatch("rendered", {
			flow,
		});
		return flow;
	}

	#dispatch(name, detail) {
		this.dispatchEvent(new CustomEvent(name, { detail }));
	}

	#adoptSheet(sheet) {
		if (this.#adoptedSheet === sheet) return;
		const filtered = document.adoptedStyleSheets.filter(
			(s) => s !== this.#adoptedSheet,
		);
		document.adoptedStyleSheets = [...filtered, sheet];
		this.#adoptedSheet = sheet;
	}

	#injectPageStyle(pageData) {
		const cssText = buildAtPageRules(pageData).join("\n");
		if (!this.#pageStyle) {
			this.#pageStyle = document.createElement("style");
			this.#pageStyle.dataset.pagedjsIgnore = "";
			document.head.appendChild(this.#pageStyle);
		}
		this.#pageStyle.textContent = cssText;
	}

	#clear() {
		for (const page of this.pages) {
			page.remove();
		}
	}

	#destroyFlow() {
		if (this.#currentFlow) {
			this.#currentFlow.destroy();
			this.#currentFlow = null;
		}
	}

	destroy() {
		this.#destroyFlow();
		if (this.#adoptedSheet) {
			document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
				(s) => s !== this.#adoptedSheet,
			);
			this.#adoptedSheet = null;
		}
		if (this.#pageStyle) {
			this.#pageStyle.remove();
			this.#pageStyle = null;
		}
		this.remove();
	}
}

if (!customElements.get("page-preview")) {
	customElements.define("page-preview", PagedPreview);
}

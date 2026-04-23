import { FragmentedFlow, PageResolver } from "fragmentainers";
import { PrintStyleSheet } from "./PrintStyleSheet.js";
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
	#flowing = null;
	#adoptedSheet = null;

	constructor(options = {}) {
		super();
		this.#options = {
			emulatePrintPixelRatio: options.emulatePrintPixelRatio,
			removeStyles: options.removeStyles ?? true,
		};

		this.hooks = {
			beforePreview: new Hook(this),
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
	 * @param {HTMLElement|DocumentFragment|string} content - The content to render.
	 * @param {Array<string|Object>} [stylesheets] - List of stylesheet hrefs or inline styles to apply.
	 * @returns {Promise<HTMLElement[]>}
	 */
	async flow(content, stylesheets) {
		if (this.#flowing) {
			return this.#flowing;
		}
		if (this.pages.length) {
			this.#clear();
		}

		this.#flowing = this.#flow(content, stylesheets).finally(() => {
			this.#flowing = null;
		});

		return this.#flowing;
	}

	async #flow(content, stylesheets) {
		const startTime = performance.now();
		this.#dispatch("rendering", { preview: this });

		const styles = stylesheets
			? await PrintStyleSheet.fromEntries(stylesheets)
			: await PrintStyleSheet.fromDocument({
					remove: this.#options.removeStyles,
				});
		this.#adoptSheet(styles);

		const pageData = styles.toJSON();
		this.#dispatch("atpages", { pages: pageData });

		const resolver = new PageResolver(pageData);
		this.#dispatch("size", { size: resolver });

		const { emulatePrintPixelRatio } = this.#options;
		const flow = new FragmentedFlow(this.#content, {
			styles,
			resolver,
			emulatePrintPixelRatio,
		});
		await flow.preload();

		for (const fragment of flow) {
			const page = this.#document.addPage(fragment, {
				name: fragment.namedPage,
				blank: fragment.isBlank,
				verso: fragment.isVerso,
				recto: fragment.isRecto,
				first: fragment.isFirst,
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

	/**
	 * Initializes handler modules (like footnotes, counters, etc.) and sets up relevant events.
	 * @returns {*} - The handler system that manages internal processing hooks.
	 */
	initializeHandlers() {
		let handlers = initializeHandlers(this);
		return handlers;
	}

	/**
	 * Registers handlers with custom logic or extensions.
	 * @returns {*} - The result of the registerHandlers function.
	 */
	registerHandlers() {
		return registerHandlers.apply(registerHandlers, arguments);
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

	#clear() {
		for (const page of this.pages) {
			page.remove();
		}
	}

	destroy() {
		if (this.#adoptedSheet) {
			document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
				(s) => s !== this.#adoptedSheet,
			);
			this.#adoptedSheet = null;
		}
		this.remove();
	}
}

if (!customElements.get("page-preview")) {
	customElements.define("page-preview", PagedPreview);
}

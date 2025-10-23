import EventEmitter from "event-emitter";

import Hook from "../utils/hook.js";
import Chunker from "../chunker/chunker.js";
import Polisher from "../polisher/polisher.js";

import { initializeHandlers, registerHandlers } from "../utils/handlers.js";

/**
 * Previewer - Main orchestrator for the paged.js rendering pipeline
 *
 * The Previewer class coordinates the entire pagination process, managing the
 * interaction between the Polisher (CSS processing) and Chunker (content layout).
 * It provides a high-level API for converting HTML content into paginated output
 * suitable for print or PDF generation.
 *
 * @class Previewer
 * @extends EventEmitter
 *
 * @example
 * // Basic usage
 * const previewer = new Previewer();
 * await previewer.preview(content, stylesheets, renderTo);
 *
 * @example
 * // With custom settings
 * const previewer = new Previewer({
 *   maxPages: 100,
 *   handlers: { footnotes: false }
 * });
 *
 * @example
 * // With event listeners
 * previewer.on('page', (page) => {
 *   console.log(`Page ${page.number} created`);
 * });
 * previewer.on('rendered', (flow) => {
 *   console.log(`Rendered ${flow.pages.length} pages in ${flow.performance}ms`);
 * });
 *
 * @fires Previewer#page - Emitted when a new page is created during rendering
 * @fires Previewer#rendering - Emitted when the rendering process starts
 * @fires Previewer#rendered - Emitted when all pages have been rendered
 * @fires Previewer#size - Emitted when page size is determined from @page rules
 * @fires Previewer#atpages - Emitted when @page rules are processed
 */
class Previewer {
	/**
	 * Create a new Previewer instance
	 *
	 * @constructor
	 * @param {Object} [options] - Configuration options for the previewer
	 * @param {number} [options.maxPages] - Maximum number of pages to render (useful for testing)
	 * @param {Object} [options.handlers] - Enable/disable specific handlers
	 * @param {boolean} [options.handlers.footnotes=true] - Enable footnote handler
	 * @param {boolean} [options.handlers.runningHeaders=true] - Enable running headers handler
	 *
	 * @property {Polisher} polisher - CSS processor that handles @page rules and transformations
	 * @property {Chunker} chunker - Content layout engine that creates pages
	 * @property {Object} hooks - Lifecycle hooks for extending functionality
	 * @property {Hook} hooks.beforePreview - Called before preview starts, useful for setup
	 * @property {Hook} hooks.afterPreview - Called after preview completes, useful for cleanup
	 * @property {Object} size - Current page size from @page rules
	 * @property {Object} size.width - Page width
	 * @property {number} size.width.value - Numeric width value
	 * @property {string} size.width.unit - Width unit (in, mm, pt, etc.)
	 * @property {Object} size.height - Page height
	 * @property {number} size.height.value - Numeric height value
	 * @property {string} size.height.unit - Height unit (in, mm, pt, etc.)
	 * @property {string} [size.format] - Standard page format (A4, Letter, etc.)
	 * @property {string} [size.orientation] - Page orientation (portrait, landscape)
	 * @property {Object} atpages - Processed @page rules
	 * @property {Object} settings - User-provided settings
	 * @property {Object} handlers - Initialized handler instances
	 */
	constructor(options) {
		// this.preview = this.getParams("preview") !== "false";

		this.settings = options || {};

		// Process styles
		this.polisher = new Polisher(false);

		// Chunk contents
		this.chunker = new Chunker(undefined, undefined, this.settings);

		// Hooks
		this.hooks = {};
		this.hooks.beforePreview = new Hook(this);
		this.hooks.afterPreview = new Hook(this);

		// default size
		this.size = {
			width: {
				value: 8.5,
				unit: "in"
			},
			height: {
				value: 11,
				unit: "in"
			},
			format: undefined,
			orientation: undefined
		};

		this.chunker.on("page", (page) => {
			this.emit("page", page);
		});

		this.chunker.on("rendering", () => {
			this.emit("rendering", this.chunker);
		});
	}

	/**
	 * Initialize all registered handlers
	 *
	 * This method instantiates all handler modules (paged-media, generated-content, filters)
	 * and connects them to the chunker and polisher lifecycle hooks. Handlers extend
	 * paged.js functionality by implementing hooks like beforePageLayout, onPageLayout, etc.
	 *
	 * @private
	 * @returns {Object} The initialized handlers instance
	 *
	 * @emits Previewer#size - When page size is determined from @page rules
	 * @emits Previewer#atpages - When @page rule processing is complete
	 */
	initializeHandlers() {
		let handlers = initializeHandlers(this.chunker, this.polisher, this);

		handlers.on("size", (size) => {
			this.size = size;
			this.emit("size", size);
		});

		handlers.on("atpages", (pages) => {
			this.atpages = pages;
			this.emit("atpages", pages);
		});

		return handlers;
	}

	/**
	 * Register custom handler classes
	 *
	 * Allows extending paged.js functionality by registering custom handler classes.
	 * Handlers can implement any of the chunker or polisher lifecycle hooks.
	 *
	 * @static
	 * @param {...Function} handlers - One or more handler classes to register
	 * @returns {void}
	 *
	 * @example
	 * class CustomHandler extends Handler {
	 *   afterPageLayout(page) {
	 *     // Custom page processing
	 *   }
	 * }
	 * Previewer.registerHandlers(CustomHandler);
	 */
	registerHandlers() {
		return registerHandlers.apply(registerHandlers, arguments);
	}

	/**
	 * Get URL query parameter value
	 *
	 * @private
	 * @param {string} name - Parameter name to retrieve
	 * @returns {string|undefined} Parameter value or undefined if not found
	 */
	getParams(name) {
		let param;
		let url = new URL(window.location);
		let params = new URLSearchParams(url.search);
		for(var pair of params.entries()) {
			if(pair[0] === name) {
				param = pair[1];
			}
		}

		return param;
	}

	/**
	 * Wrap document body content in a template element
	 *
	 * This is used in polyfill mode to extract the original document content
	 * before it's processed and paginated. The content is stored in a template
	 * element to preserve it while the body is cleared for rendering pages.
	 *
	 * @private
	 * @returns {DocumentFragment} The wrapped content as a document fragment
	 */
	wrapContent() {
		// Wrap body in template tag
		let body = document.querySelector("body");

		// Check if a template exists
		let template;
		template = body.querySelector(":scope > template[data-ref='pagedjs-content']");

		if (!template) {
			// Otherwise create one
			template = document.createElement("template");
			template.dataset.ref = "pagedjs-content";
			template.innerHTML = body.innerHTML;
			body.innerHTML = "";
			body.appendChild(template);
		}

		return template.content;
	}

	/**
	 * Extract and remove stylesheets from the document
	 *
	 * This method finds all <link> and <style> elements in the document (excluding
	 * screen-only and ignored styles), removes them from the DOM, and returns their
	 * content/URLs for processing by the polisher. The order of stylesheets is preserved.
	 *
	 * @private
	 * @param {Document} [doc=document] - Document to extract styles from
	 * @returns {Array<string|Object>} Array of stylesheet URLs or style content objects
	 *
	 * @description
	 * Ignores:
	 * - Stylesheets with media="screen"
	 * - Elements with data-pagedjs-ignore attribute
	 * - Previously inserted styles (data-pagedjs-inserted-styles)
	 */
	removeStyles(doc=document) {
		// Get all stylesheets
		const stylesheets = Array.from(doc.querySelectorAll("link[rel='stylesheet']:not([data-pagedjs-ignore], [media~='screen'])"));
		// Get inline styles
		const inlineStyles = Array.from(doc.querySelectorAll("style:not([data-pagedjs-inserted-styles], [data-pagedjs-ignore], [media~='screen'])"));
		const elements = [...stylesheets, ...inlineStyles];
		return elements
			// preserve order
			.sort(function (element1, element2) {
				const position = element1.compareDocumentPosition(element2);
				if (position === Node.DOCUMENT_POSITION_PRECEDING) {
					return 1;
				} else if (position === Node.DOCUMENT_POSITION_FOLLOWING) {
					return -1;
				}
				return 0;
			})
			// extract the href
			.map((element) => {
				if (element.nodeName === "STYLE") {
					const obj = {};
					obj[window.location.href] = element.textContent;
					element.remove();
					return obj;
				}
				if (element.nodeName === "LINK") {
					element.remove();
					return element.href;
				}
				// ignore
				console.warn(`Unable to process: ${element}, ignoring.`);
			});
	}

	/**
	 * Preview content - main rendering pipeline
	 *
	 * This is the primary method for paginating HTML content. It orchestrates the
	 * complete rendering process:
	 * 1. Triggers beforePreview hooks
	 * 2. Extracts content and stylesheets if not provided
	 * 3. Sets up the polisher and processes CSS
	 * 4. Initializes handlers
	 * 5. Flows content through the chunker to create pages
	 * 6. Triggers afterPreview hooks
	 *
	 * @async
	 * @param {string|Element|DocumentFragment} [content] - Content to paginate. If not provided, uses document body
	 * @param {Array<string|CSSStyleSheet>} [stylesheets] - Stylesheets to apply. If not provided, extracts from document
	 * @param {HTMLElement} [renderTo] - Container element to render pages into. If not provided, uses document body
	 * @returns {Promise<Object>} Flow object containing rendering results
	 * @returns {Array<Object>} return.pages - Array of page objects
	 * @returns {number} return.performance - Rendering time in milliseconds
	 * @returns {Object} return.size - Page size information
	 *
	 * @fires Previewer#page - For each page created
	 * @fires Previewer#rendering - When rendering starts
	 * @fires Previewer#rendered - When all pages are rendered
	 *
	 * @example
	 * // Preview entire document with automatic extraction
	 * const flow = await previewer.preview();
	 * console.log(`Created ${flow.pages.length} pages in ${flow.performance}ms`);
	 *
	 * @example
	 * // Preview specific content with custom styles
	 * const content = document.getElementById('my-content');
	 * const styles = ['styles/print.css', 'styles/layout.css'];
	 * const container = document.getElementById('render-container');
	 * const flow = await previewer.preview(content, styles, container);
	 *
	 * @example
	 * // Using hooks
	 * previewer.hooks.beforePreview.register(async (content, renderTo) => {
	 *   console.log('Starting preview...');
	 *   // Load fonts, prepare content, etc.
	 * });
	 * previewer.hooks.afterPreview.register(async (pages) => {
	 *   console.log(`Finished rendering ${pages.length} pages`);
	 * });
	 * await previewer.preview();
	 */
	async preview(content, stylesheets, renderTo) {

		await this.hooks.beforePreview.trigger(content, renderTo);

		if (!content) {
			content = this.wrapContent();
		}

		if (!stylesheets) {
			stylesheets = this.removeStyles();
		}

		this.polisher.setup();

		this.handlers = this.initializeHandlers();

		await this.polisher.add(...stylesheets);

		let startTime = performance.now();

		// Render flow
		let flow = await this.chunker.flow(content, renderTo);

		let endTime = performance.now();

		flow.performance = (endTime - startTime);
		flow.size = this.size;

		this.emit("rendered", flow);

		await this.hooks.afterPreview.trigger(flow.pages);

		return flow;
	}
}

EventEmitter(Previewer.prototype);

export default Previewer;

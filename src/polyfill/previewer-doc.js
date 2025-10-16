import EventEmitter from "event-emitter";

import Hook from "../utils/hook.js";
import Chunker from "../chunker/chunker.js";
import Polisher from "../polisher/polisher.js";

import { initializeHandlers, registerHandlers } from "../utils/handlers.js";

/**
 * The main class responsible for preparing, chunking, styling, and rendering content into paginated previews.
 *
 * Emits events:
 * - `page`: when a page is rendered
 * - `rendering`: when rendering starts
 * - `rendered`: when rendering finishes
 * - `size`: when page size is set
 * - `atpages`: when @page rules are processed
 */
class Previewer {
	/**
	 * Create a new Previewer instance.
	 * @param {Object} [options] - Optional configuration settings for rendering.
	 */
	constructor(options) {
		/** @type {Object} */
		this.settings = options || {};

		/** @type {Polisher} */
		this.polisher = new Polisher(false);

		/** @type {Chunker} */
		this.chunker = new Chunker(undefined, undefined, this.settings);

		/** @type {Object<string, Hook>} */
		this.hooks = {
			beforePreview: new Hook(this),
			afterPreview: new Hook(this),
		};

		/** @type {{width: {value: number, unit: string}, height: {value: number, unit: string}, format?: string, orientation?: string}} */
		this.size = {
			width: {
				value: 8.5,
				unit: "in",
			},
			height: {
				value: 11,
				unit: "in",
			},
			format: undefined,
			orientation: undefined,
		};

		this.chunker.on("page", (page) => {
			this.emit("page", page);
		});

		this.chunker.on("rendering", () => {
			this.emit("rendering", this.chunker);
		});
	}

	/**
	 * Initializes handler modules (like footnotes, counters, etc.) and sets up relevant events.
	 * @returns {EventEmitter} - The handler system that manages internal processing hooks.
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
	 * Registers handlers with custom logic or extensions.
	 * @returns {*} - The result of the registerHandlers function.
	 */
	registerHandlers() {
		return registerHandlers.apply(registerHandlers, arguments);
	}

	/**
	 * Retrieve a query parameter from the current URL.
	 * @param {string} name - Name of the parameter.
	 * @returns {string|undefined} - Value of the parameter if found.
	 */
	getParams(name) {
		let param;
		let url = new URL(window.location);
		let params = new URLSearchParams(url.search);
		for (var pair of params.entries()) {
			if (pair[0] === name) {
				param = pair[1];
			}
		}
		return param;
	}

	/**
	 * Wraps the contents of the `<body>` in a `<template>` element if not already present.
	 * This is used to preserve the original content for chunking and layout.
	 *
	 * @returns {DocumentFragment} - The wrapped content.
	 */
	wrapContent() {
		let body = document.querySelector("body");
		let template = body.querySelector(
			":scope > template[data-ref='pagedjs-content']",
		);

		if (!template) {
			template = document.createElement("template");
			template.dataset.ref = "pagedjs-content";
			template.innerHTML = body.innerHTML;
			body.innerHTML = "";
			body.appendChild(template);
		}

		return template.content;
	}

	/**
	 * Removes stylesheets and inline `<style>` elements that should not be processed.
	 * Also returns the list of removed styles for reprocessing later.
	 *
	 * @param {Document} [doc=document] - The document to process styles from.
	 * @returns {(string|Object)[]} - Array of stylesheet hrefs or inline style objects.
	 */
	removeStyles(doc = document) {
		const stylesheets = Array.from(
			doc.querySelectorAll(
				"link[rel='stylesheet']:not([data-pagedjs-ignore], [media~='screen'])",
			),
		);
		const inlineStyles = Array.from(
			doc.querySelectorAll(
				"style:not([data-pagedjs-inserted-styles], [data-pagedjs-ignore], [media~='screen'])",
			),
		);
		const elements = [...stylesheets, ...inlineStyles];

		return elements
			.sort((a, b) => {
				const position = a.compareDocumentPosition(b);
				if (position === Node.DOCUMENT_POSITION_PRECEDING) return 1;
				if (position === Node.DOCUMENT_POSITION_FOLLOWING) return -1;
				return 0;
			})
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
				console.warn(`Unable to process: ${element}, ignoring.`);
			});
	}

	/**
	 * Main method for rendering content into paged preview.
	 * Triggers hooks and events, applies stylesheets, chunks the content, and returns the flow result.
	 *
	 * @param {HTMLElement|DocumentFragment|string} [content] - The content to render.
	 * @param {Array<string|Object>} [stylesheets] - List of stylesheet hrefs or inline styles to apply.
	 * @param {HTMLElement|string} [renderTo] - Element or selector where rendered content will be inserted.
	 * @returns {Promise<Object>} - Resolves to the rendered flow object with performance and size metadata.
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

		let flow = await this.chunker.flow(content, renderTo);

		let endTime = performance.now();

		flow.performance = endTime - startTime;
		flow.size = this.size;

		this.emit("rendered", flow);

		await this.hooks.afterPreview.trigger(flow.pages);

		return flow;
	}
}

// Add event emitter behavior to the Previewer prototype
EventEmitter(Previewer.prototype);

export default Previewer;

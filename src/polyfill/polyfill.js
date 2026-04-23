import { PagedPreview } from "../preview/PagedPreview.js";
import * as Paged from "../index.js";

/**
 * Expose the Paged API to the global window object.
 * Useful for debugging or for external scripts that want to access the API.
 * @global
 */
window.Paged = Paged;

/**
 * A promise that resolves when the DOM is ready (interactive or complete).
 * Used to defer preview rendering until the page is ready.
 *
 * @type {Promise<"interactive"|"complete">}
 */
let ready = new Promise(function (resolve, reject) {
	if (
		document.readyState === "interactive" ||
		document.readyState === "complete"
	) {
		resolve(document.readyState);
		return;
	}

	document.onreadystatechange = function () {
		if (document.readyState === "interactive") {
			resolve(document.readyState);
		}
	};
});

/**
 * Configuration object for controlling the preview behavior.
 * Can be set via the global `window.PagedConfig` or defaults are used.
 *
 * @typedef {Object} PagedConfig
 * @property {boolean} [auto=true] - Whether to automatically render on load.
 * @property {function} [before] - Function to run before rendering.
 * @property {function} [after] - Function to run after rendering, receives result.
 * @property {string|HTMLElement} [content] - Selector or element to render.
 * @property {string[]} [stylesheets] - Array of stylesheet URLs or paths.
 * @property {HTMLElement|string} [renderTo] - Where to render the output.
 * @property {Object} [settings] - Additional settings passed to the Previewer.
 */

/** @type {PagedConfig} */
const config = window.PagedConfig || {};

/**
 * Initialize the previewer with optional settings from config.
 *
 * @type {PagedPreview}
 */
const previewer = new PagedPreview(config.settings);

/**
 * Main logic that runs once the DOM is ready.
 * - Executes `before` hook if defined
 * - Triggers `previewer.preview()` if `auto` is not explicitly disabled
 * - Executes `after` hook with result if defined
 */
ready.then(async () => {
	// Call optional hook before preview
	if (config.before) {
		await config.before();
	}

	if (config.auto === false) {
		return;
	}

	let content = config.content;
	if (!content) {
		content = document.createDocumentFragment();
		while (document.body.firstChild) {
			content.appendChild(document.body.firstChild);
		}
	}

	let renderTo = config.renderTo ?? document.body;
	if (typeof renderTo === "string") {
		renderTo = document.querySelector(renderTo);
	}

	const flow = await previewer.preview(content, config.stylesheets, renderTo);

	// Call optional hook after preview
	if (config.after) {
		await config.after(flow);
	}
});

/**
 * Export the previewer instance as default export.
 * Useful for manual control or advanced usage.
 */
export default previewer;
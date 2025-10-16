import Previewer from "./previewer.js";
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
let config = window.PagedConfig || {
	auto: true,
	before: undefined,
	after: undefined,
	content: undefined,
	stylesheets: undefined,
	renderTo: undefined,
	settings: undefined,
};

/**
 * Initialize the previewer with optional settings from config.
 *
 * @type {Previewer}
 */
let previewer = new Previewer(config.settings);

/**
 * Main logic that runs once the DOM is ready.
 * - Executes `before` hook if defined
 * - Triggers `previewer.preview()` if `auto` is not explicitly disabled
 * - Executes `after` hook with result if defined
 */
ready.then(async function () {
	let done;

	// Call optional hook before preview
	if (config.before) {
		await config.before();
	}

	// Automatically render content if not disabled
	if (config.auto !== false) {
		done = await previewer.preview(
			config.content,
			config.stylesheets,
			config.renderTo,
		);
	}

	// Call optional hook after preview
	if (config.after) {
		await config.after(done);
	}
});

/**
 * Export the previewer instance as default export.
 * Useful for manual control or advanced usage.
 */
export default previewer;

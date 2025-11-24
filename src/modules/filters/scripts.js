import Handler from "../handler.js";

/**
 * Handler that removes all <script> elements from the content.
 *
 * @class
 * @extends Handler
 */
class ScriptsFilter extends Handler {
	/**
	 * Create a ScriptsFilter instance.
	 *
	 * @param {Object} chunker - Responsible for managing document chunks during rendering.
	 * @param {Object} polisher - Handles post-processing and styling of content.
	 * @param {Object} caller - The entity invoking this handler (e.g., layout controller).
	 */
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);
	}

	/**
	 * Removes all <script> elements from the given DOM content.
	 *
	 * @param {DocumentFragment | HTMLElement} content - The DOM content to sanitize.
	 */
	filter(content) {
		content.querySelectorAll("script").forEach((script) => {
			script.remove();
		});
	}
}

export default ScriptsFilter;

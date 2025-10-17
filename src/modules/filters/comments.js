import Handler from "../handler.js";
import { filterTree } from "../../utils/dom.js";

/**
 * Handler that filters out HTML comment nodes from the content.
 *
 * @class
 * @extends Handler
 */
class CommentsFilter extends Handler {
	/**
	 * Create a CommentsFilter instance.
	 *
	 * @param {Object} chunker - The chunker responsible for managing document chunks.
	 * @param {Object} polisher - The polisher responsible for post-processing or styling.
	 * @param {Object} caller - The main object calling the handler (likely the flow controller).
	 */
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);
	}

	/**
	 * Removes comment nodes from the provided content.
	 *
	 * @param {DocumentFragment | HTMLElement} content - The DOM content to be filtered.
	 */
	filter(content) {
		filterTree(content, null, NodeFilter.SHOW_COMMENT);
	}
}

export default CommentsFilter;

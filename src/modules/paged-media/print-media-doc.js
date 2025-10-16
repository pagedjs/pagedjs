import Handler from "../handler.js";
import csstree from "css-tree";

/**
 * Handles `@media print` rules during the stylesheet parsing phase.
 *
 * - Extracts CSS rules inside `@media print` and appends them to the main stylesheet.
 * - Removes `@media` blocks that are neither `print`, `all`, nor explicitly ignored.
 */
class PrintMedia extends Handler {
	/**
	 * Creates an instance of PrintMedia handler.
	 *
	 * @param {Object} chunker - The chunker instance used for pagination.
	 * @param {Object} polisher - The polisher instance that processes stylesheets.
	 * @param {Object} caller - The object that coordinates multiple handlers.
	 */
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);
	}

	/**
	 * Called when a `@media` at-rule is encountered in the stylesheet.
	 *
	 * - If the media type includes `print`, the rules inside are extracted and appended
	 *   to the main rule list (i.e. made global).
	 * - If the media type is unsupported or not needed, the block is removed entirely.
	 *
	 * @param {Object} node - The AST node for the `@media` at-rule.
	 * @param {Object} item - The item in the list representing this rule.
	 * @param {Object} list - The list of all CSS rules being parsed.
	 */
	onAtMedia(node, item, list) {
		let media = this.getMediaName(node);
		let rules;

		if (media.includes("print")) {
			rules = node.block.children;

			// TODO: The below section was intended to scope the rules to .pagedjs_page
			// but is commented out due to issues with modifying the prelude properly.
			/*
			rules.forEach((selectList) => {
				if (selectList.prelude) {
					selectList.prelude.children.forEach((rule) => {
						rule.children.prependData({
							type: "Combinator",
							name: " "
						});

						rule.children.prependData({
							type: "ClassSelector",
							name: "pagedjs_page"
						});
					});
				}
			});

			list.insertList(rules, item);
			*/

			// Move print rules to the main stylesheet
			list.appendList(rules);

			// Remove the @media print block itself
			list.remove(item);
		} else if (!media.includes("all") && !media.includes("pagedjs-ignore")) {
			// Remove non-print media rules that are not marked to be ignored
			list.remove(item);
		}
	}

	/**
	 * Extracts all media type names from a `@media` at-rule node.
	 *
	 * @param {Object} node - The AST node representing a `@media` at-rule.
	 * @returns {string[]} An array of media query identifiers (e.g. `["print"]`, `["screen"]`).
	 */
	getMediaName(node) {
		let media = [];

		if (
			typeof node.prelude === "undefined" ||
			node.prelude.type !== "AtrulePrelude"
		) {
			return media;
		}

		csstree.walk(node.prelude, {
			visit: "Identifier",
			enter: (identNode) => {
				media.push(identNode.name);
			},
		});

		return media;
	}
}

export default PrintMedia;

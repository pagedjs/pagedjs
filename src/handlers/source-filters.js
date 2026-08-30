import { LayoutHandler } from "fragmentainers/handlers";

/**
 * Removes `<script>` elements and comment nodes from the source content.
 *
 * Neither lays out — `script` is in the engine's skip-tag set and a comment
 * classifies as "skip". A box with laid-out children drops both when its
 * children are rebuilt, but a box with none composes as a leaf, through
 * `cloneNode(true)`, which carries its skipped descendants onto every
 * fragmentainer it reaches, duplicating any id they carry once per page.
 *
 * A script also runs, exactly once: measurement moves the source nodes into a
 * connected `<content-measure>`, which prepares any script still holding an
 * unset "already started" flag. The page copies are inert, because cloning
 * propagates the flag that run has just set (HTML §4.12.1). Only a script
 * built node by node arrives unset — the fragment parsing algorithm marks one
 * parsed from a string or assigned through `innerHTML` already-started.
 */
export class SourceFilters extends LayoutHandler {
	/**
	 * A rebuild pass re-enters this hook on the same nodes with a fresh handler
	 * instance, so removal carries no bookkeeping: the second pass finds
	 * nothing left to remove.
	 *
	 * @param {DocumentFragment|Element} content - The full source content root.
	 */
	prepareContent(content) {
		for (const script of content.querySelectorAll("script")) {
			script.remove();
		}

		// Detaching the node a TreeWalker is parked on strands it: currentNode
		// stays on the removed node, which has no siblings left to advance to,
		// so the rest of the walk is silently skipped.
		const walker = document.createTreeWalker(content, NodeFilter.SHOW_COMMENT);
		const comments = [];
		for (let node = walker.nextNode(); node; node = walker.nextNode()) {
			comments.push(node);
		}
		for (const comment of comments) {
			comment.remove();
		}
	}
}

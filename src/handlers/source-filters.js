import { LayoutHandler } from "fragmentainers/handlers.js";
import { locate } from "fragmentainers/fragmentation.js";

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
	#cloneMap;
	#flow;
	#undisplayed = [];
	#seenUndisplayed = new WeakSet();

	/**
	 * Retains the per-flow services needed to restore undisplayed source nodes
	 * after the fragmentainer has composed its laid-out boxes.
	 *
	 * @param {Object} _options - Fragmenter options.
	 * @param {import("fragmentainers/fragmentation.js").FlowContext} context - Owning flow context.
	 */
	init(_options, context) {
		this.#cloneMap = context.cloneMap;
		this.#flow = context.flow;
	}

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

	/**
	 * Records outermost `display:none` elements while computed styles are
	 * available. They generate no layout nodes, but remain source content.
	 *
	 * @param {Element} contentRoot - Connected measurement content root.
	 */
	afterMeasurementSetup(contentRoot) {
		for (const element of contentRoot.querySelectorAll("*")) {
			if (
				this.#seenUndisplayed.has(element) ||
				getComputedStyle(element).display !== "none" ||
				this.#undisplayed.some(({ element: hidden }) => hidden.contains(element))
			) {
				continue;
			}

			this.#seenUndisplayed.add(element);
			this.#undisplayed.push({
				element,
				parent: element.parentElement,
				previous: this.#displayedSibling(element, "previousElementSibling"),
				next: this.#displayedSibling(element, "nextElementSibling"),
				appended: false,
			});
		}
	}

	/**
	 * Restores undisplayed elements beside their nearest composed sibling.
	 *
	 * @param {Element} wrapper - Composed fragmentainer wrapper.
	 * @param {import("fragmentainers/fragmentation.js").Fragment} fragment - Composed fragment.
	 */
	afterCompose(wrapper, fragment) {
		const fragments = this.#flow.fragments;
		const fragmentIndex = fragments.indexOf(fragment);
		const clones = new Map();
		const afterAnchors = new Map();
		for (const clone of wrapper.querySelectorAll("*")) {
			const source = this.#cloneMap.get(clone);
			if (!source) continue;
			const matches = clones.get(source) ?? [];
			matches.push(clone);
			clones.set(source, matches);
		}

		for (const record of this.#undisplayed) {
			if (record.appended || this.#targetIndex(record, fragments) !== fragmentIndex) {
				continue;
			}

			const previous =
				afterAnchors.get(record.previous) ?? clones.get(record.previous)?.at(-1);
			const next = clones.get(record.next)?.[0];
			const parent = clones.get(record.parent)?.[0];
			const clone = record.element.cloneNode(true);
			if (previous) {
				previous.after(clone);
				afterAnchors.set(record.previous, clone);
			} else if (next) {
				next.before(clone);
			} else if (parent) {
				parent.append(clone);
			} else if (record.parent?.tagName === "SLOT") {
				wrapper.append(clone);
			} else {
				continue;
			}

			this.#cloneMap.trackDeep(clone, record.element);
			record.appended = true;
		}
	}

	#displayedSibling(element, property) {
		let sibling = element[property];
		while (sibling && getComputedStyle(sibling).display === "none") {
			sibling = sibling[property];
		}
		return sibling;
	}

	#targetIndex(record, fragments) {
		if (record.previous) {
			const previous = locate(fragments, record.previous);
			if (previous.length > 0) return previous.at(-1).index;
		}
		if (record.next) {
			const next = locate(fragments, record.next);
			if (next.length > 0) return next[0].index;
		}
		if (!record.previous && !record.next && record.parent) {
			const parent = locate(fragments, record.parent);
			if (parent.length > 0) return parent[0].index;
		}
		return -1;
	}
}

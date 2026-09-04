import { FixedPosition } from "fragmentainers/handlers.js";
import { FRAGMENTATION_PAGE } from "fragmentainers/fragmentation.js";

const ANCHOR_BLOCK_END = "block-end";
const ANCHOR_BLOCK_START = "block-start";
const FIXED_SOURCE_ATTR = "data-pagedjs-fixed-source";

/**
 * Classifies the one anchor that needs different composition from the core
 * handler's block-start default.
 *
 * @param {Element} element - Fixed source element.
 * @returns {"block-start"|"block-end"} Normalized composition edge.
 */
function classifyAnchorEdge(element) {
	const specified = element.style;
	const hasTop = specified.top !== "" && specified.top !== "auto";
	const hasBottom = specified.bottom !== "" && specified.bottom !== "auto";

	if (hasBottom && !hasTop) return ANCHOR_BLOCK_END;
	return ANCHOR_BLOCK_START;
}

/**
 * Restores one authored inline declaration after the core handler's placement
 * overrides have been applied to a clone.
 *
 * @param {HTMLElement} clone - Rendered fixed-position clone.
 * @param {HTMLElement} source - Original fixed-position source element.
 * @param {string} property - CSS property to restore.
 * @returns {void}
 */
function restoreInlineProperty(clone, source, property) {
	const value = source.style.getPropertyValue(property);
	if (value) {
		clone.style.setProperty(
			property,
			value,
			source.style.getPropertyPriority(property),
		);
	} else {
		clone.style.removeProperty(property);
	}
}

/**
 * Extends the fragmentainers fixed-position handler to preserve fixed boxes
 * nested below a top-level flow child.
 *
 * @extends FixedPosition
 */
export class NestedFixedPosition extends FixedPosition {
	#fixedSelectors = [];
	#nestedFixed = [];
	#nextSourceID = 0;

	resetRules() {
		super.resetRules();
		this.#clearMarkers();
		this.#fixedSelectors = [];
		this.#nextSourceID = 0;
	}

	/**
	 * Records selectors whose boxes must be extracted before measurement splits
	 * the source into disconnected segments.
	 *
	 * @param {CSSStyleRule} rule - A leaf style rule from the transformed sheet.
	 * @returns {void}
	 */
	matchRule(rule) {
		super.matchRule(rule);
		if (rule.style.getPropertyValue("position").trim() === "fixed") {
			this.#fixedSelectors.push(rule.selectorText);
		}
	}

	/**
	 * Catalogues nested fixed boxes before measurement can detach their owning
	 * top-level segments.
	 *
	 * @param {DocumentFragment|Element} content - The full source content root.
	 * @returns {void}
	 */
	prepareContent(content) {
		super.prepareContent(content);

		const topLevel = new Set(content.children);
		const matchesFixedRule = (element) => {
			if (element.style.position === "fixed") return true;
			for (const selector of this.#fixedSelectors) {
				try {
					if (element.matches(selector)) return true;
				} catch {
					continue;
				}
			}
			return false;
		};
		const fixed = [...content.querySelectorAll("*")].filter(
			(element) => !topLevel.has(element) && matchesFixedRule(element),
		);

		for (const element of fixed) {
			// Fixed ancestor: its deep clone already carries the complete subtree.
			if (this.#nestedFixed.some(({ source }) => source.contains(element))) continue;
			const id = String(this.#nextSourceID++);
			element.setAttribute(FIXED_SOURCE_ATTR, id);
			this.#nestedFixed.push({
				id,
				source: element,
				anchorEdge: classifyAnchorEdge(element),
			});
		}
	}

	/**
	 * Adds extracted nested fixed subtrees after the core handler composes its
	 * top-level fixed boxes.
	 *
	 * @param {import("fragmentainers/layout.js").LayoutNode} rootNode - Layout root.
	 * @param {import("fragmentainers").ConstraintSpace} constraintSpace - Page constraints.
	 * @param {import("fragmentainers/fragmentation.js").BreakToken|null} breakToken - Resume token.
	 * @param {Function} layoutChild - Child layout callback used by the core handler.
	 * @returns {{ reservedBlockStart: number, reservedBlockEnd: number, afterRender: Function|null }}
	 */
	layout(rootNode, constraintSpace, breakToken, layoutChild) {
		const result = super.layout(rootNode, constraintSpace, breakToken, layoutChild);
		if (
			constraintSpace.fragmentationType !== FRAGMENTATION_PAGE ||
			this.#nestedFixed.length === 0
		) {
			return result;
		}

		return {
			...result,
			afterRender: (wrapper) => {
				result.afterRender?.(wrapper);
				wrapper.style.setProperty("position", "relative");
				const rendered = new Map(
					[...wrapper.querySelectorAll(`[${FIXED_SOURCE_ATTR}]`)].map((element) => [
						element.getAttribute(FIXED_SOURCE_ATTR),
						element,
					]),
				);
				for (const fixed of this.#nestedFixed) {
					const existing = rendered.get(fixed.id);
					if (existing) {
						existing.removeAttribute(FIXED_SOURCE_ATTR);
						restoreInlineProperty(existing, fixed.source, "left");
						restoreInlineProperty(existing, fixed.source, "right");
						continue;
					}
					const clone = fixed.source.cloneNode(true);
					clone.removeAttribute(FIXED_SOURCE_ATTR);
					clone.style.setProperty("position", "absolute");
					if (fixed.anchorEdge === ANCHOR_BLOCK_END) {
						clone.style.setProperty("top", "auto");
						clone.style.setProperty("bottom", "0");
					} else {
						clone.style.setProperty("top", "0");
						clone.style.setProperty("bottom", "auto");
					}
					wrapper.appendChild(clone);
				}
			},
		};
	}

	/**
	 * Removes private source markers when the flow releases its content.
	 *
	 * @returns {void}
	 */
	destroy() {
		this.#clearMarkers();
		this.#fixedSelectors = [];
		super.destroy();
	}

	#clearMarkers() {
		for (const { source } of this.#nestedFixed) {
			source.removeAttribute(FIXED_SOURCE_ATTR);
		}
		this.#nestedFixed = [];
	}
}

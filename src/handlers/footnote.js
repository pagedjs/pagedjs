import { LayoutHandler, markNativePseudo } from "fragmentainers";
import { FragmentFlow } from "fragmentainers/fragmentation";
import { DOMLayoutNode } from "fragmentainers/layout";
import { parseNumeric, toPx } from "fragmentainers/styles";

// The vocabulary the CSS rewrite and the runtime have to agree on.
const FLOAT = "--float";
const POLICY = "--footnote-policy";
const CALL = "data-footnote-call";
const MARKER = "data-footnote-marker";
const AREA = "data-footnote-area";

const FOOTNOTE_STYLES = `
[${CALL}] {
  counter-increment: footnote;
}
[${CALL}]::after {
  content: counter(footnote);
  vertical-align: super;
  font-size: 65%;
}
[${MARKER}] {
  display: list-item;
  list-style-position: inside;
}
[${MARKER}]::marker {
  content: counter(footnote) ". ";
}
[data-footnote-continuation]::marker {
  content: "";
}
`;

/**
 * `float: footnote` hides the body in the main flow, so without this
 * handler to move it into the footnote area the content would be lost.
 * The rewrite therefore travels with the class instead of living in a
 * list of its own.
 */
const footnoteRules = [
	{
		type: "declaration",
		match: ({ property, value }) =>
			property === "float" && value.trim().toLowerCase() === "footnote",
		transform: () => ({
			declarations: [
				{ property: FLOAT, value: "footnote" },
				{ property: "display", value: "none" },
			],
		}),
	},
	{
		type: "declaration",
		match: ({ property }) => property === "footnote-policy",
		transform: () => ({ property: POLICY }),
	},
	{
		// css-gcpm-3 names the at-rule `@footnote`; `@footnotes` is a
		// widespread spelling in sheets written against other engines.
		type: "at-rule",
		match: ({ name }) => name === "footnote" || name === "footnotes",
		transform: () => ({ selector: `& [${AREA}]` }),
	},
	{
		type: "pseudo",
		match: ({ kind, name }) => kind === "element" && name === "footnote-call",
		transform: () => ({ selector: `[${CALL}]::after` }),
	},
	{
		type: "pseudo",
		match: ({ kind, name }) => kind === "element" && name === "footnote-marker",
		transform: () => ({ selector: `[${MARKER}]::marker` }),
	},
];

function getBreakBoundaryElement(breakToken) {
	if (!breakToken) return null;
	let token = breakToken;
	while (token.childBreakTokens?.length > 0) {
		token = token.childBreakTokens[0];
	}
	return token.node?.element ?? null;
}

function readFootnotePolicy(bodyElement) {
	const raw = getComputedStyle(bodyElement).getPropertyValue(POLICY).trim();
	if (raw === "line" || raw === "block") return raw;
	return "auto";
}

/**
 * Layout handler for CSS footnotes (css-gcpm-3 §2).
 *
 * Preprocessing: elements matching `--float: footnote` are removed from
 * the main flow and replaced with inline `<a data-footnote-call>` markers;
 * bodies are stashed in a hidden `<content-measure>`.
 *
 * Layout: delegated to a `FragmentFlow` driven by Fragmenter's parallel
 * flow coordinator. The coordinator calls `extractFlowChildren` per page to
 * enqueue bodies whose calls landed on the page, runs the flow into the
 * footnote area cap, and invokes `composeFlowFragment` to place the result
 * at the bottom of the page wrapper.
 *
 * `--footnote-policy` (per body):
 * - `auto` (default): body may split across pages via the flow's break
 *   token carryover.
 * - `line` / `block`: body is marked `break-inside: avoid`; if it doesn't
 *   fit, the flow rejects it and the coordinator pushes the call's
 *   containing block to the next page.
 */
class Footnote extends LayoutHandler {
	static rules = footnoteRules;

	#footnoteMap = new Map();
	#measurer = null;
	#flow = new FragmentFlow();
	#pushedCalls = new WeakSet();
	#defaultSheet = null;
	#footnoteSelectors = [];
	#footnoteMaxHeight = null;
	#footnoteMaxHeightPercent = null;
	#context = null;
	styles = null;

	init(options, context) {
		this.#context = context;
		this.#flow.context = context;
	}

	resetRules() {
		this.#footnoteSelectors = [];
		this.#footnoteMaxHeight = null;
		this.#footnoteMaxHeightPercent = null;
	}

	matchRule(rule) {
		if (rule.style.getPropertyValue(FLOAT).trim() === "footnote") {
			this.#footnoteSelectors.push(rule.selectorText);
		}
		// Custom properties are stripped from @page (CSS Paged Media §3.2), so
		// --footnote-max-height is declared on :root / html and read once here.
		const sel = rule.selectorText;
		if (sel === ":root" || sel === "html") {
			const raw = rule.style.getPropertyValue("--footnote-max-height").trim();
			if (raw) {
				const parsed = parseNumeric(raw);
				if (parsed?.unit === "percent") {
					this.#footnoteMaxHeightPercent = parsed.value / 100;
				} else {
					const val = toPx(raw);
					if (val != null) this.#footnoteMaxHeight = val;
				}
			}
		}
	}

	appendRules(rules) {
		if (this.#footnoteSelectors.length === 0) return;
		if (!this.#defaultSheet) {
			this.#defaultSheet = new CSSStyleSheet();
			this.#defaultSheet.replaceSync(FOOTNOTE_STYLES);
		}
		for (const rule of this.#defaultSheet.cssRules) {
			rules.push(rule.cssText);
		}
	}

	prepareContent(content) {
		this.#footnoteMap.clear();
		this.#flow.destroy();
		if (this.#measurer) {
			this.#measurer.remove();
			this.#measurer = null;
		}

		if (this.#footnoteSelectors.length === 0) return;

		let counter = 0;
		for (const selector of this.#footnoteSelectors) {
			let elements;
			try {
				elements = content.querySelectorAll(selector);
			} catch {
				continue;
			}
			for (const el of elements) {
				if (el.hasAttribute("data-footnote-body")) continue;
				if (!el.parentNode) continue;

				const id = `fn-${counter++}`;
				const call = document.createElement("a");
				call.setAttribute(CALL, id);
				markNativePseudo(call, "after");
				el.parentNode.insertBefore(call, el);

				el.setAttribute("data-footnote-body", id);
				el.remove();

				this.#footnoteMap.set(id, {
					callElement: call,
					bodyElement: el,
					bodyNode: null,
					policy: "auto",
				});
			}
		}
	}

	getFlow() {
		if (this.#footnoteMap.size === 0) return null;
		return this.#flow;
	}

	getFlowCap(constraintSpace) {
		if (this.#footnoteMaxHeightPercent != null) {
			const base = constraintSpace?.availableBlockSize;
			if (Number.isFinite(base) && base > 0) {
				return base * this.#footnoteMaxHeightPercent;
			}
		}
		return this.#footnoteMaxHeight ?? Infinity;
	}

	extractFlowChildren(mainFragment, inputBreakToken, cap) {
		if (this.#footnoteMap.size === 0) return { children: [], pushForward: [] };
		this.#ensureBodiesAttached(mainFragment);

		const startBoundary = getBreakBoundaryElement(inputBreakToken);
		const endBoundary = getBreakBoundaryElement(mainFragment.breakToken ?? null);

		const children = [];
		const pushForward = [];
		for (const [, entry] of this.#footnoteMap) {
			if (!isWithinBoundaries(entry.callElement, startBoundary, endBoundary)) continue;
			// `line` / `block` policy: push the call's containing block to the
			// next page when the body exceeds the cap — but only once per call.
			// After a push the body renders via auto-style splitting on the
			// next page; otherwise a body larger than the fragmentainer would
			// push its call forward on every page and never render.
			const needsPush =
				entry.policy !== "auto" &&
				entry.bodyElement.offsetHeight > cap &&
				!this.#pushedCalls.has(entry.callElement);
			if (needsPush) {
				pushForward.push(entry.callElement);
				this.#pushedCalls.add(entry.callElement);
				continue;
			}
			children.push(entry.bodyNode);
		}
		return { children, pushForward };
	}

	composeFlowFragment(wrapper, flowFragment, flowInputBreakToken) {
		if (!flowFragment || flowFragment.blockSize === 0) return;

		const area = document.createElement("div");
		area.classList.add("footnote-area");
		area.setAttribute(AREA, "");
		area.style.setProperty("position", "absolute");
		area.style.setProperty("bottom", "0");
		area.style.setProperty("left", "0");
		area.style.setProperty("right", "0");
		area.style.setProperty("height", `${flowFragment.blockSize}px`);
		area.style.setProperty("overflow", "hidden");

		const docFragment = flowFragment.build(flowInputBreakToken);
		decorateForFootnoteArea(docFragment);
		area.appendChild(docFragment);

		wrapper.style.setProperty("position", "relative");
		wrapper.appendChild(area);
	}

	destroy() {
		if (this.#measurer) {
			this.#measurer.remove();
			this.#measurer = null;
		}
		this.#footnoteMap.clear();
		this.#flow.destroy();
	}

	#ensureBodiesAttached(mainFragment) {
		if (this.#measurer) return;
		const inlineSize = mainFragment.inlineSize || 0;
		const measurer = document.createElement("content-measure");
		measurer.classList.add("footnotes");
		measurer.setupEmpty(this.styles);
		measurer.style.width = `${inlineSize}px`;

		for (const [, entry] of this.#footnoteMap) {
			entry.bodyElement.style.setProperty("display", "block");
			measurer.contentRoot.appendChild(entry.bodyElement);
		}
		document.body.appendChild(measurer);
		void measurer.offsetHeight;

		for (const [, entry] of this.#footnoteMap) {
			entry.policy = readFootnotePolicy(entry.bodyElement);
			entry.bodyNode = new DOMLayoutNode(entry.bodyElement);
			entry.bodyNode.context = this.#context;
			if (entry.policy === "line" || entry.policy === "block") {
				entry.bodyNode.breakInside = "avoid";
			}
		}
		this.#measurer = measurer;
	}
}

function isWithinBoundaries(callElement, start, end) {
	if (start) {
		const pos = start.compareDocumentPosition(callElement);
		if (pos !== 0 && !(pos & Node.DOCUMENT_POSITION_FOLLOWING)) return false;
	}
	if (end) {
		const pos = callElement.compareDocumentPosition(end);
		if (pos !== 0 && !(pos & Node.DOCUMENT_POSITION_FOLLOWING)) return false;
	}
	return true;
}

/**
 * Tag bodies inside the composed fragment with `data-footnote-marker`
 * on first slices and `data-footnote-continuation` on tails. The builder
 * sets `data-split-from` on continuation elements of a sliced fragment.
 */
function decorateForFootnoteArea(root) {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
	let node = walker.nextNode();
	while (node) {
		if (node.hasAttribute("data-footnote-body")) {
			const isContinuation = node.hasAttribute("data-split-from");
			node.removeAttribute("data-footnote-body");
			node.setAttribute(
				isContinuation ? "data-footnote-continuation" : MARKER,
				"",
			);
			node.style.setProperty("display", "block");
		}
		node = walker.nextNode();
	}
}

export { Footnote };

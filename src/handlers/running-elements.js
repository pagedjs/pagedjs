import { LayoutHandler } from "fragmentainers/handlers";
import { MODES, exitValue, opensFragment, selectPerMode } from "./occurrences.js";

// The vocabulary the CSS rewrite and the runtime have to agree on.
const POSITION = "--page-position";
const REQUEST = "--paged-running-element";
const MARK = "data-paged-running";

const IDENTIFIER = /^-?[_a-zA-Z][-\w]*$/;

// A box of no size, so the element's place in the flow survives its removal.
const PLACEHOLDER_STYLE = "display:block;height:0;margin:0;padding:0;border:0";

const runningElementRules = [
	{
		type: "declaration",
		match: ({ property, value }) =>
			property === "position" && /^\s*running\(/i.test(value),
		// The element is taken out of the flow by `prepareContent`, not by
		// `display: none`: a hidden box is never laid out, and the projected
		// clone would inherit the rule that hid it.
		transform: () => ({ property: POSITION }),
	},
	{
		type: "function",
		match: ({ name, declaration }) =>
			declaration.property === "content" && name.toLowerCase() === "element",
		transform: ({ args }) => {
			const name = args[0]?.trim();
			if (!name || !IDENTIFIER.test(name)) return null;
			const requested = args[1]?.trim();
			const mode = MODES.includes(requested) ? requested : "first";
			// The request rides on the margin box itself while `content` is
			// split onto its `::before`, so the box's computed style is where
			// `<paged-page>` reads which element the cascade chose.
			return {
				value: "\"\"",
				declarations: [{ property: REQUEST, value: `${name} ${mode}` }],
			};
		},
	},
];

/**
 * Running elements (css-gcpm-3 §3): `position: running(name)` takes an
 * element out of the flow, and `content: element(name, mode)` projects it
 * into a page-margin box.
 *
 * The element leaves the flow but its position in it still decides which
 * page each margin box gets, so `prepareContent` swaps in a placeholder of
 * no size and keeps the element aside. The placeholder is what the composed
 * fragmentainer carries; the element itself is cloned into the box.
 *
 * Selection is published as `runningElements[name][mode]` on the composed
 * fragmentainer, which `<paged-page>` reads when it slots its margin boxes.
 */
export class RunningElements extends LayoutHandler {
	static rules = runningElementRules;

	#selectors = [];
	#sources = new Map();
	#names = new Set();
	#entries = [];
	#counter = 0;

	resetRules() {
		this.#selectors = [];
	}

	matchRule(rule) {
		const declared = rule.style.getPropertyValue(POSITION).trim();
		const call = /^running\(\s*(.*?)\s*\)$/i.exec(declared);
		const name = call?.[1];
		if (!name || !IDENTIFIER.test(name)) return;
		this.#selectors.push({ name, selector: rule.selectorText });
	}

	prepareContent(content) {
		for (const { name, selector } of this.#selectors) {
			let elements;
			try {
				elements = content.querySelectorAll(selector);
			} catch {
				continue;
			}
			for (const element of elements) {
				if (!element.parentNode) continue;
				const id = String(this.#counter++);

				const placeholder = element.ownerDocument.createElement("span");
				placeholder.setAttribute(MARK, id);
				placeholder.style.cssText = PLACEHOLDER_STYLE;
				element.parentNode.insertBefore(placeholder, element);
				element.remove();

				this.#sources.set(id, { name, element });
				this.#names.add(name);
			}
		}
	}

	afterCompose(element) {
		if (!element) return;

		const index = element.fragmentIndex ?? 0;
		const entry = this.#entries[index] ?? new Map();
		const exit = new Map(entry);
		const found = this.#collect(element);
		const running = {};

		for (const name of this.#names) {
			const { values = [], opens = false } = found.get(name) ?? {};
			const carried = entry.get(name) ?? null;
			running[name] = selectPerMode(values, carried, opens, null);
			exit.set(name, exitValue(values, carried));
		}

		element.runningElements = running;
		this.#entries[index + 1] = exit;
	}

	/**
	 * The running elements this fragmentainer holds, per name, in document
	 * order.
	 *
	 * @param {Element} container - the composed `<fragment-container>`
	 * @returns {Map<string, { values: Element[], opens: boolean }>}
	 */
	#collect(container) {
		const found = new Map();

		for (const placeholder of container.querySelectorAll(`[${MARK}]`)) {
			const record = this.#sources.get(placeholder.getAttribute(MARK));
			if (!record) continue;

			let entry = found.get(record.name);
			if (!entry) {
				entry = { values: [], opens: opensFragment(container, placeholder) };
				found.set(record.name, entry);
			}
			entry.values.push(record.element);
		}

		return found;
	}
}


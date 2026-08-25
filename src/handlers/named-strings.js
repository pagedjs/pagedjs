import { LayoutHandler } from "fragmentainers/handlers";
import { cssString, splitTopLevel, unquote } from "../utils/css.js";
import { MODES, exitValue, opensFragment, selectPerMode } from "./occurrences.js";

// The vocabulary the CSS rewrite and the runtime have to agree on.
const STRING_SET = "--string-set";
const MARK = "data-paged-string-set";

const IDENTIFIER = /^-?[_a-zA-Z][-\w]*$/;

/**
 * `content(before)`, `content(after)`, and `content(first-letter)` read
 * generated content, which the measurer collects for target text; until
 * that lands they resolve empty rather than silently reading element text.
 */
const SUPPORTED_CONTENT = new Set(["", "text"]);

const namedStringRules = [
	{
		type: "declaration",
		match: ({ property }) => property === "string-set",
		transform: () => ({ property: STRING_SET }),
	},
	{
		type: "function",
		match: ({ name, declaration }) =>
			declaration.property === "content" && name.toLowerCase() === "string",
		transform: ({ args }) => {
			const name = args[0]?.trim();
			if (!name || !IDENTIFIER.test(name)) return null;
			const requested = args[1]?.trim();
			const mode = MODES.includes(requested) ? requested : "first";
			// An empty fallback keeps a reference to a name no rule ever sets
			// from invalidating the whole `content` declaration.
			return { value: `var(--paged-string-${mode}-${name}, "")` };
		},
	},
];

/**
 * Named strings (css-gcpm-3 §2): `string-set` copies text off an element,
 * and `string(name, mode)` reproduces it in a page-margin box.
 *
 * The value is captured from the source element, not from the composed
 * clone, because an element that splits across fragmentainers leaves only
 * part of its text on each one. What the clone contributes is the page it
 * occurs on: `prepareContent` marks each source element, and the mark
 * travels into every fragment the element reaches.
 *
 * Values are published as `--paged-string-<mode>-<name>` on the composed
 * fragmentainer, which `<paged-page>` mirrors onto its host so the cascade
 * carries them into the margin boxes.
 */
export class NamedStrings extends LayoutHandler {
	static rules = namedStringRules;

	#selectors = [];
	#occurrences = new Map();
	#names = new Set();
	#entries = [];
	#warned = new Set();
	#counter = 0;

	resetRules() {
		this.#selectors = [];
	}

	matchRule(rule) {
		if (!rule.style.getPropertyValue(STRING_SET).trim()) return;
		this.#selectors.push(rule.selectorText);
	}

	prepareContent(content) {
		for (const selector of this.#selectors) {
			let elements;
			try {
				elements = content.querySelectorAll(selector);
			} catch {
				continue;
			}
			for (const element of elements) {
				if (element.hasAttribute(MARK)) continue;
				const id = String(this.#counter++);
				element.setAttribute(MARK, id);
				this.#occurrences.set(id, { element, values: null });
			}
		}
	}

	/**
	 * Read each marked element's effective `string-set`. Only the cascade
	 * knows which of several declarations won, so the value is taken from
	 * computed style rather than from the rule that matched.
	 */
	afterMeasurementSetup(contentRoot) {
		for (const element of contentRoot.querySelectorAll(`[${MARK}]`)) {
			const record = this.#occurrences.get(element.getAttribute(MARK));
			if (!record) continue;
			const declared = getComputedStyle(element)
				.getPropertyValue(STRING_SET)
				.trim();
			record.values = this.#evaluate(declared, element);
			for (const name of record.values.keys()) this.#names.add(name);
		}
	}

	afterCompose(element) {
		if (!element?.style) return;

		const index = element.fragmentIndex ?? 0;
		const entry = this.#entries[index] ?? new Map();
		const exit = new Map(entry);
		const found = this.#collect(element);

		for (const name of this.#names) {
			const { values = [], opens = false } = found.get(name) ?? {};
			const carried = entry.get(name) ?? "";
			const selected = selectPerMode(values, carried, opens, "");
			for (const mode of MODES) {
				element.style.setProperty(
					`--paged-string-${mode}-${name}`,
					cssString(selected[mode]),
				);
			}
			exit.set(name, exitValue(values, carried));
		}

		this.#entries[index + 1] = exit;
	}

	/**
	 * The assignments this fragmentainer makes, per name, in document order.
	 *
	 * @param {Element} container - the composed `<fragment-container>`
	 * @returns {Map<string, { values: string[], opens: boolean }>}
	 */
	#collect(container) {
		const found = new Map();

		for (const clone of container.querySelectorAll(`[${MARK}]`)) {
			// A continuation carries the mark too, but the assignment happens
			// where the element starts.
			if (clone.hasAttribute("data-split-from")) continue;
			const record = this.#occurrences.get(clone.getAttribute(MARK));
			if (!record?.values) continue;

			for (const [name, value] of record.values) {
				let entry = found.get(name);
				if (!entry) {
					entry = { values: [], opens: opensFragment(container, clone) };
					found.set(name, entry);
				}
				entry.values.push(value);
			}
		}

		return found;
	}

	/**
	 * Evaluate a `string-set` value against the element that declared it.
	 *
	 * @param {string} declared
	 * @param {Element} element
	 * @returns {Map<string, string>} value per named string
	 */
	#evaluate(declared, element) {
		const values = new Map();

		for (const assignment of splitTopLevel(declared, /,/)) {
			const [name, ...content] = splitTopLevel(assignment, /\s/);
			if (!name || !IDENTIFIER.test(name)) continue;
			values.set(
				name,
				content.map((token) => this.#evaluateToken(token, element)).join(""),
			);
		}

		return values;
	}

	#evaluateToken(token, element) {
		if (token[0] === "\"" || token[0] === "'") return unquote(token);

		const call = /^([-\w]+)\((.*)\)$/s.exec(token);
		if (!call) return "";
		const name = call[1].toLowerCase();
		const argument = call[2].trim();

		if (name === "content") {
			if (SUPPORTED_CONTENT.has(argument)) return element.textContent ?? "";
			this.#warn(`string-set: content(${argument}) is not supported yet`);
			return "";
		}
		if (name === "attr") return element.getAttribute(unquote(argument)) ?? "";

		this.#warn(`string-set: ${name}() is not a recognized value`);
		return "";
	}

	#warn(message) {
		if (this.#warned.has(message)) return;
		this.#warned.add(message);
		console.warn(message);
	}
}

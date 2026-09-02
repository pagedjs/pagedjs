import { LayoutHandler, isPseudoElement } from "fragmentainers/handlers";
import { CounterState, parseCounterDirective } from "fragmentainers/fragmentation";
import { cssString, splitTopLevel, unquote } from "../utils/css.js";
import {
	collectReferences,
	createWarner,
	elementSelector,
	sourceDeclarations,
	stamp,
} from "./targets.js";

// The vocabulary the CSS rewrite and the runtime have to agree on. The id is
// namespaced per feature so two generated-content handlers never allocate the
// same custom property in one stylesheet: `tc` is the singular form, `tcs` the
// plural one.
const SOURCE = /^--paged-generated-(tcs?-\d+)-source$/;

const PAGE = "page";

/**
 * The layout-pass budget these occurrences ask the flow for: one pass to
 * discover values, one to stamp them and re-flow, one for the re-flow to
 * settle. The flow keeps the largest budget any handler requests and stops
 * early once a pass reports nothing to invalidate.
 */
const PASSES = 3;

/**
 * The prefix of the counters this handler stamps. A re-flow re-reads computed
 * style from source elements still carrying an earlier stamp, so the author's
 * own `counter-reset` has to be recovered out of the merged value.
 */
const GENERATED = "--paged-";

const FORMS = new Set(["target-counter", "target-counters"]);

const INTEGER = /^[+-]?\d+$/;

const feature = (plural) => (plural ? "target-counters" : "target-counter");

const targetCounterRules = (allocate) => [
	{
		type: "function",
		match: ({ name, declaration }) =>
			declaration.property === "content" && FORMS.has(name.toLowerCase()),
		transform: ({ name, value }) => {
			const plural = name.toLowerCase() === "target-counters";
			const id = allocate(plural ? "tcs" : "tc");
			// The original tokens travel with the sheet, so the handler
			// rediscovers its own occurrences without sharing state with the
			// stylesheet build that rewrote them. A CSS string keeps browsers
			// from rejecting a typed attr() inside the unsupported outer function.
			const declarations = [
				{ property: `--paged-generated-${id}-source`, value: cssString(value) },
			];

			// The singular form leaves formatting to the browser, which only
			// needs `--paged-<id>` reset to the target's value. A joined stack
			// cannot be expressed as one reset, so JavaScript formats it.
			if (plural) return { value: `var(--paged-generated-${id}, "")`, declarations };

			const style = parseTargetCounter(value)?.style;
			return {
				value: style ? `counter(--paged-${id}, ${style})` : `counter(--paged-${id})`,
				declarations,
			};
		},
	},
];

/**
 * Target counters (css-content-3 §5.3): `target-counter()` reproduces one
 * counter value from the element a link points at, `target-counters()` the
 * whole nested stack joined by a separator.
 *
 * A counter's value does not depend on where its element paginates, so the
 * non-page names are read from a document-order walk of the source tree. Only
 * `page` needs the fragment a target landed on, which is why every occurrence
 * resolves in the pass loop rather than before the first layout.
 */
export class TargetCounters extends LayoutHandler {
	/**
	 * A fresh allocator per access, so occurrence ids restart at zero for each
	 * stylesheet build and two builds cannot interleave.
	 */
	static get rules() {
		const next = { tc: 0, tcs: 0 };
		return targetCounterRules((prefix) => `${prefix}-${next[prefix]++}`);
	}

	#context = null;
	#occurrences = [];
	#tree = [];
	#walks = false;
	#directives = new Map();
	#pending = new Set();
	#settled = false;
	#discovered = false;
	#warn = createWarner();

	init(options, context) {
		this.#context = context;
	}

	resetRules() {
		this.#occurrences = [];
	}

	get #idle() {
		return this.#occurrences.length === 0;
	}

	matchRule(rule) {
		for (const { id, declared } of sourceDeclarations(rule, SOURCE)) {
			const plural = id.startsWith("tcs-");
			const parsed = plural
				? parseTargetCounters(declared)
				: parseTargetCounter(declared);
			if (!parsed) {
				this.#warn(`${feature(plural)}: cannot read ${declared}`);
				continue;
			}

			this.#occurrences.push({
				id,
				plural,
				selector: elementSelector(rule.selectorText),
				references: [],
				...parsed,
			});

			// The flow keeps the largest budget a handler asks for, so asking
			// once per occurrence is asking once.
			this.#context?.flow?.registerLayoutPass(PASSES);
		}
	}

	/**
	 * Resolve every reference against the complete source tree and record where
	 * the walk starts. The measurer moves these elements, so what is kept is the
	 * element and its target, never the root they came from.
	 */
	prepareContent(content) {
		this.#tree = [];
		this.#walks = false;
		this.#directives = new Map();
		this.#pending = new Set();
		this.#discovered = false;
		this.#settled = this.#idle;
		if (this.#idle) return;

		for (const occurrence of this.#occurrences) {
			occurrence.references = collectReferences(
				content,
				occurrence,
				this.#warn,
				feature(occurrence.plural),
			);
		}

		// `page` is the one name layout supplies rather than the source tree, so
		// a build that only cross-references page numbers needs no walk at all —
		// only the referencing elements' own `counter-reset`, which the stamped
		// one must not clobber.
		this.#walks = this.#occurrences.some(
			(occurrence) => occurrence.name !== PAGE
				&& occurrence.references.some((reference) => reference.target),
		);

		if (this.#walks) {
			// Only the top level is snapshotted: the measurer re-arranges the root
			// per segment, but a subtree stays intact even while detached. Its
			// children are read at walk time so that the <frag-pseudo> elements
			// materialized during measurement carry their directives into it.
			this.#tree = [...content.children];
			return;
		}

		for (const occurrence of this.#occurrences) {
			if (occurrence.plural) continue;
			for (const { element } of occurrence.references) this.#pending.add(element);
		}
	}

	/**
	 * Counter directives resolve through the cascade, so they are read from
	 * computed style rather than from the rules that declared them. A segment
	 * only exposes the elements it made live, so each is recorded once, as it
	 * activates, and never re-read after a pass has stamped onto it.
	 */
	afterMeasurementSetup(contentRoot) {
		if (this.#settled) return;

		// A page-only build tracks few elements, so testing each for liveness
		// is cheaper than enumerating the segment.
		if (!this.#walks) {
			for (const element of this.#pending) {
				if (!contentRoot.contains(element)) continue;
				this.#record(element);
				this.#pending.delete(element);
			}
			this.#settled = this.#pending.size === 0;
			return;
		}

		for (const element of contentRoot.querySelectorAll("*")) {
			if (this.#directives.has(element)) continue;
			this.#record(element);
			this.#discovered = true;
		}
	}

	#record(element) {
		const style = getComputedStyle(element);
		this.#directives.set(element, {
			reset: style.counterReset,
			set: style.counterSet,
			increment: style.counterIncrement,
			// An element with no box generates no counters (CSS 2.1 §12.4).
			hidden: style.display === "none",
		});
	}

	afterLayoutPass(context) {
		if (this.#idle) return null;

		const stacks = this.#collectStacks();
		const invalidate = new Set();
		const resets = new Map();

		for (const occurrence of this.#occurrences) {
			for (const reference of occurrence.references) {
				const stack = this.#stackFor(occurrence, reference, context, stacks);

				if (occurrence.plural) {
					const text = stack
						.map((value) => formatCounter(value, occurrence.style))
						.join(occurrence.separator);
					const property = `--paged-generated-${occurrence.id}`;
					if (stamp(reference.element, property, cssString(text))) {
						invalidate.add(reference.element);
					}
					continue;
				}

				// An unreset counter renders as 0, which is also what a target
				// that resolved to nothing should read as.
				const value = stack.length > 0 ? stack[stack.length - 1] : 0;
				const list = resets.get(reference.element) ?? [];
				list.push(`--paged-${occurrence.id} ${value}`);
				resets.set(reference.element, list);
			}
		}

		for (const [element, list] of resets) {
			// The element may reset counters of its own, and an inline
			// declaration would otherwise win over the author's.
			const own = authorReset(this.#directives.get(element)?.reset);
			const next = [own, ...list].filter(Boolean).join(" ");
			if (element.style.getPropertyValue("counter-reset") === next) continue;
			element.style.setProperty("counter-reset", next);
			invalidate.add(element);
		}

		// Pseudo elements materialize during measurement, so the set of elements
		// carrying directives is only known once a whole pass has arranged
		// without turning up a new one.
		if (this.#walks) {
			this.#settled = !this.#discovered;
			this.#discovered = false;
		}

		return invalidate.size > 0 ? { invalidate: [...invalidate] } : null;
	}

	/** Counter stacks for every target a non-page occurrence refers to. */
	#collectStacks() {
		const wanted = new Map();
		for (const occurrence of this.#occurrences) {
			if (occurrence.name === PAGE) continue;
			for (const { target } of occurrence.references) {
				if (!target) continue;
				const names = wanted.get(target) ?? new Set();
				names.add(occurrence.name);
				wanted.set(target, names);
			}
		}

		const stacks = new Map();
		if (wanted.size === 0) return stacks;

		walk(this.#tree, new CounterState(), null, this.#directives, (element, state) => {
			const names = wanted.get(element);
			if (!names) return;
			const own = new Map();
			for (const name of names) own.set(name, [...state.values(name)]);
			stacks.set(element, own);
		});
		return stacks;
	}

	#stackFor(occurrence, reference, context, stacks) {
		if (!reference.target) return [];
		if (occurrence.name !== PAGE) {
			return stacks.get(reference.target)?.get(occurrence.name) ?? [];
		}

		// A target can span fragmentainers; the page it starts on is the one a
		// cross-reference means.
		const locations = context?.locate?.(reference.target) ?? [];
		const page = locations[0]?.fragment?.page;
		return Number.isFinite(page) ? [page] : [];
	}
}

/**
 * Walk the source tree in document order, applying counter directives the way
 * the engine applies them to a fragment tree: operations belong to the parent's
 * scope, children open one of their own, and leaving an element closes it.
 */
function walk(elements, state, parent, directives, visit) {
	for (const element of elements) {
		const recorded = directives.get(element);
		if (recorded?.hidden) continue;

		state.prepareForElement(element);
		const scope = parent ?? undefined;

		if (recorded) {
			const resets = parseCounterDirective(recorded.reset);
			if (resets.length > 0) state.applyReset(resets, scope);
			const sets = parseCounterDirective(recorded.set);
			if (sets.length > 0) apply(state, "applySet", sets, scope);
			const increments = parseCounterDirective(recorded.increment, 1);
			if (increments.length > 0) apply(state, "applyIncrement", increments, scope);
		}

		const children = [...element.children];

		// A `::before` renders ahead of the element's own content, so the number
		// it displays is the element's own and a cross-reference reads the same.
		if (leadingPseudo(element)) walk(children.splice(0, 1), state, element, directives, visit);

		// A counter() on an element reflects that element's own directives
		// (CSS 2.1 §12.4), so the target is visited after they apply.
		visit(element, state);

		walk(children, state, element, directives, visit);
		state.closeScope(element);
	}
}

/**
 * Increment or set, creating the counter first when nothing reset it.
 *
 * `CounterState` creates an absent counter in the operation's own scope, which
 * closes with the element that opened it — a `::before` incrementing an unreset
 * counter would restart at every sibling. CSS 2.1 §12.4.3 puts the implied
 * reset on the root element instead, which is what the browser renders.
 */
function apply(state, method, entries, scope) {
	for (const { name } of entries) {
		if (state.values(name).length === 0) state.applyReset([{ name, value: 0 }]);
	}
	state[method](entries, scope);
}

/** An element's materialized `::before`, which the engine puts first. */
function leadingPseudo(element) {
	const first = element.firstElementChild;
	return first && isPseudoElement(first) && first.dataset.pseudo === "before" ? first : null;
}

/** An element's own `counter-reset`, without anything this handler stamped. */
function authorReset(declared) {
	if (!declared || declared === "none") return "";
	const tokens = declared.trim().split(/\s+/);
	const kept = [];
	for (let index = 0; index < tokens.length; index += 1) {
		const name = tokens[index];
		// The integer is optional, so a name only pairs with a token that is
		// one — `reversed(a) b` is two counters, not one with a value.
		const paired = INTEGER.test(tokens[index + 1] ?? "");
		if (paired) index += 1;
		if (name.startsWith(GENERATED)) continue;
		kept.push(paired ? `${name} ${tokens[index]}` : name);
	}
	return kept.join(" ");
}

function parseTargetCounter(declared) {
	const call = /^target-counter\((.*)\)$/is.exec(unquote(declared).trim());
	if (!call) return null;

	const args = splitTopLevel(call[1], /,/).map((arg) => arg.trim());
	if (args.length < 2 || args.length > 3) return null;
	if (!args[0] || !args[1]) return null;

	return { target: args[0], name: args[1], style: args[2] || "" };
}

function parseTargetCounters(declared) {
	const call = /^target-counters\((.*)\)$/is.exec(unquote(declared).trim());
	if (!call) return null;

	const args = splitTopLevel(call[1], /,/).map((arg) => arg.trim());
	if (args.length < 3 || args.length > 4) return null;
	if (!args[0] || !args[1]) return null;

	return {
		target: args[0],
		name: args[1],
		separator: unquote(args[2]),
		style: args[3] || "decimal",
	};
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const ROMAN = [
	[1000, "m"], [900, "cm"], [500, "d"], [400, "cd"],
	[100, "c"], [90, "xc"], [50, "l"], [40, "xl"],
	[10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"],
];

/**
 * Format one counter value for `target-counters()`. The singular form never
 * reaches here — the browser formats that one from a real counter, so only the
 * predefined styles a joined stack can use are implemented (css-counter-styles-3
 * §6). An unknown style falls back to decimal, as a counter style that fails to
 * represent a value does.
 */
function formatCounter(value, style) {
	switch (style) {
		case "decimal-leading-zero":
			return Math.abs(value) < 10 ? `${value < 0 ? "-" : ""}0${Math.abs(value)}` : String(value);
		case "lower-roman":
			return roman(value);
		case "upper-roman":
			return roman(value).toUpperCase();
		case "lower-alpha":
		case "lower-latin":
			return alpha(value);
		case "upper-alpha":
		case "upper-latin":
			return alpha(value).toUpperCase();
		default:
			return String(value);
	}
}

function roman(value) {
	// Roman numerals have no zero or negative form; decimal is the fallback
	// the spec prescribes when a style cannot represent a value.
	if (!Number.isFinite(value) || value < 1 || value > 3999) return String(value);
	let remaining = Math.trunc(value);
	let out = "";
	for (const [size, numeral] of ROMAN) {
		while (remaining >= size) {
			out += numeral;
			remaining -= size;
		}
	}
	return out;
}

function alpha(value) {
	if (!Number.isFinite(value) || value < 1) return String(value);
	let remaining = Math.trunc(value);
	let out = "";
	while (remaining > 0) {
		remaining -= 1;
		out = ALPHABET[remaining % 26] + out;
		remaining = Math.floor(remaining / 26);
	}
	return out;
}

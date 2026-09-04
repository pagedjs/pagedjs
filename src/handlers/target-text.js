import { LayoutHandler, pseudoFor } from "fragmentainers/handlers.js";
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
// same custom property in one stylesheet.
const SOURCE = /^--paged-generated-(text-\d+)-source$/;

const MODES = new Set(["content", "before", "after", "first-letter"]);

/**
 * Modes that read a pseudo-element, which only the live measurement DOM
 * resolves. Everything else is the target's own text and needs no layout.
 */
const DEFERRED = new Set(["before", "after"]);

/**
 * The layout-pass budget these occurrences ask the flow for: one pass to
 * discover values, one to stamp them and re-flow, one for the re-flow to
 * settle. The flow keeps the largest budget any handler requests and stops
 * early once a pass reports nothing to invalidate.
 */
const PASSES = 3;

const targetTextRules = (allocate) => [
	{
		type: "function",
		match: ({ name, declaration }) =>
			declaration.property === "content" && name.toLowerCase() === "target-text",
		transform: ({ value }) => {
			const id = allocate();
			// The original tokens travel with the sheet, so the handler
			// rediscovers its own occurrences without sharing state with the
			// stylesheet build that rewrote them. A CSS string keeps browsers
			// from rejecting a typed attr() inside the unsupported outer function.
			return {
				value: `var(--paged-generated-${id}, "")`,
				declarations: [
					{ property: `--paged-generated-${id}-source`, value: cssString(value) },
				],
			};
		},
	},
];

/**
 * Target text (css-content-3 §5.3): `target-text(<target>, <mode>)`
 * reproduces the text of the element a link points at.
 *
 * `content` and `first-letter` read the target's own text, which the source
 * tree already holds, so they are stamped before measurement and the first
 * layout sees the real value. `before` and `after` read generated content,
 * which only the live measurer resolves and only while the target's segment
 * is active, so those are collected as segments activate and stamped in the
 * pass loop — the one case that costs a second layout.
 */
export class TargetText extends LayoutHandler {
	/**
	 * A fresh allocator per access, so occurrence ids restart at zero for each
	 * stylesheet build and two builds cannot interleave.
	 */
	static get rules() {
		let next = 0;
		return targetTextRules(() => `text-${next++}`);
	}

	#context = null;
	#occurrences = [];
	#deferred = false;
	#warn = createWarner();

	init(options, context) {
		this.#context = context;
	}

	resetRules() {
		this.#occurrences = [];
		this.#deferred = false;
	}

	matchRule(rule) {
		for (const { id, declared } of sourceDeclarations(rule, SOURCE)) {
			const parsed = parseTargetText(declared);
			if (!parsed) {
				this.#warn(`target-text: cannot read ${declared}`);
				continue;
			}

			this.#occurrences.push({
				id,
				selector: elementSelector(rule.selectorText),
				references: [],
				...parsed,
			});

			if (DEFERRED.has(parsed.mode)) {
				this.#deferred = true;
				this.#context?.flow?.registerLayoutPass(PASSES);
			}
		}
	}

	/**
	 * Resolve every reference against the complete source tree, then stamp the
	 * modes that need nothing else. The measurer moves these elements, so what
	 * is kept is the element and its target, never the root they came from.
	 */
	prepareContent(content) {
		for (const occurrence of this.#occurrences) {
			// A deferred mode has no value until its target's segment is live,
			// which `null` marks until `afterMeasurementSetup` reads one.
			occurrence.references = collectReferences(
				content,
				occurrence,
				this.#warn,
				"target-text",
			).map((reference) => ({ ...reference, value: null }));

			if (DEFERRED.has(occurrence.mode)) continue;
			for (const { element, target } of occurrence.references) {
				write(element, occurrence.id, target ? ownText(target, occurrence.mode) : "");
			}
		}
	}

	/**
	 * Read the pseudo content of every target this segment made live. A target
	 * in a later segment stays unresolved until its own activation.
	 */
	afterMeasurementSetup() {
		// The other modes resolved in `prepareContent` already.
		if (!this.#deferred) return;

		for (const occurrence of this.#occurrences) {
			if (!DEFERRED.has(occurrence.mode)) continue;
			for (const reference of occurrence.references) {
				if (reference.value !== null) continue;
				if (!reference.target?.isConnected) continue;
				reference.value = pseudoText(reference.target, occurrence.mode);
			}
		}
	}

	afterLayoutPass() {
		if (!this.#deferred) return null;

		const invalidate = [];

		for (const occurrence of this.#occurrences) {
			if (!DEFERRED.has(occurrence.mode)) continue;
			for (const { element, value } of occurrence.references) {
				if (write(element, occurrence.id, value ?? "")) invalidate.push(element);
			}
		}

		return invalidate.length > 0 ? { invalidate } : null;
	}
}

/** Stamp one occurrence's text, as the CSS string the `var()` reads. */
function write(element, id, value) {
	return stamp(element, `--paged-generated-${id}`, cssString(value));
}

/** Parse a `--paged-generated-<id>-source` value back into its parts. */
function parseTargetText(declared) {
	const call = /^target-text\((.*)\)$/is.exec(unquote(declared));
	if (!call) return null;

	const args = splitTopLevel(call[1], /,/);
	if (args.length === 0 || args.length > 2) return null;

	const mode = args[1] ? args[1].toLowerCase() : "content";
	if (!MODES.has(mode)) return null;

	return { target: args[0], mode };
}

function ownText(target, mode) {
	const text = target.textContent ?? "";
	if (mode !== "first-letter") return text;
	return [...text.replace(/\s+/g, " ").trim()][0] ?? "";
}

/**
 * The text a target's `::before` or `::after` renders.
 *
 * The engine materializes pseudo elements and owns how their content is
 * stored, so the value comes from the materialized element rather than from
 * the target's own pseudo, which the engine has suppressed by this point.
 */
function pseudoText(target, mode) {
	return pseudoFor(target, mode)?.text ?? "";
}

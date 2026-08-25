import { splitTopLevel, unquote } from "../utils/css.js";

/**
 * Pseudo-elements are always the tail of a compound selector, and the
 * declaration on one belongs to the element that generates it, since a custom
 * property set on an element is what its pseudo inherits.
 */
const TRAILING_PSEUDO =
	/::?(before|after|first-letter|first-line|marker|placeholder|selection|backdrop)\b/gi;

/** The elements a rule's declarations apply to, pseudo-elements aside. */
export function elementSelector(selectorText) {
	return selectorText
		.split(",")
		.map((part) => part.replace(TRAILING_PSEUDO, "").trim())
		.filter(Boolean)
		.join(",");
}

/**
 * The URL a `<target>` argument names, for one referencing element.
 * Accepts `attr(name [type])`, `url()`, and a bare string (css-content-3 §5.3).
 */
export function resolveTarget(spec, element) {
	const attribute = /^attr\((.*)\)$/is.exec(spec);
	if (attribute) {
		// `attr(href url)` names a type after the attribute (css-values-5 §7).
		const [name] = splitTopLevel(attribute[1], /\s/);
		return element.getAttribute(unquote(name ?? ""));
	}

	const url = /^url\((.*)\)$/is.exec(spec);
	return unquote((url ? url[1] : spec).trim());
}

export function findById(root, id) {
	if (typeof root.getElementById === "function") return root.getElementById(id);
	// An attribute selector needs only its own quotes escaped, so a dotted or
	// otherwise CSS-significant id resolves without `CSS.escape`.
	return root.querySelector(`[id="${id.replace(/[\\"]/g, (char) => `\\${char}`)}"]`);
}

/**
 * Resolve a target URL against the source tree. Every failure resolves to
 * null, so a malformed, missing, or external target renders empty rather
 * than aborting the flow.
 *
 * @param {DocumentFragment|Element} root
 * @param {string|null} url
 * @param {(message: string) => void} warn
 * @param {string} feature — prefixes the message, e.g. "target-counter"
 */
export function lookupTarget(root, url, warn, feature) {
	if (typeof url !== "string" || url === "") {
		warn(`${feature}: no target to resolve`);
		return null;
	}
	const hash = url.indexOf("#");
	if (hash > 0) {
		warn(`${feature}: ${url} is outside this document`);
		return null;
	}
	const id = hash === 0 ? url.slice(1) : "";
	if (!id) {
		warn(`${feature}: ${url} names no element`);
		return null;
	}

	// HTML matches a fragment as written before matching its percent-decoded
	// form, which also keeps a fragment that was never valid encoding — `#50%`
	// — from throwing out of the flow.
	const decoded = decodeFragment(id);
	const target = findById(root, id) ?? (decoded === id ? null : findById(root, decoded));
	if (!target) warn(`${feature}: no element with id ${id}`);
	return target;
}

function decodeFragment(text) {
	try {
		return decodeURIComponent(text);
	} catch {
		return text;
	}
}

/**
 * The `--paged-generated-<id>-source` declarations a rule carries, as the id
 * and the tokens the transformer put aside for the handler that allocated it.
 *
 * @param {CSSStyleRule} rule
 * @param {RegExp} pattern — captures the id from the property name
 */
export function* sourceDeclarations(rule, pattern) {
	// Indexed rather than iterated or read through `item()`: array access is
	// the one form every CSSStyleDeclaration implementation supports.
	for (let index = 0; index < rule.style.length; index += 1) {
		const property = rule.style[index];
		const source = pattern.exec(property);
		if (!source) continue;
		yield { id: source[1], declared: rule.style.getPropertyValue(property).trim() };
	}
}

/**
 * The elements one occurrence applies to, each paired with the target it
 * points at. A selector the browser rejects contributes nothing.
 *
 * @param {DocumentFragment|Element} content
 * @param {{ selector: string, target: string }} occurrence
 */
export function collectReferences(content, occurrence, warn, feature) {
	let elements;
	try {
		elements = content.querySelectorAll(occurrence.selector);
	} catch {
		return [];
	}

	return [...elements].map((element) => ({
		element,
		target: lookupTarget(content, resolveTarget(occurrence.target, element), warn, feature),
	}));
}

/**
 * Write a resolved value onto a referencing element.
 *
 * @returns {boolean} true when the value changed, so the element has to be
 *   laid out again.
 */
export function stamp(element, property, value) {
	if (element.style.getPropertyValue(property) === value) return false;
	element.style.setProperty(property, value);
	return true;
}

/** A reporter that prints each distinct message once per flow. */
export function createWarner() {
	const seen = new Set();
	return (message) => {
		if (seen.has(message)) return;
		seen.add(message);
		console.warn(message);
	};
}

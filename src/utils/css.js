/**
 * Cleans pseudo-element content strings by:
 * - Trimming specified characters from the start and end (default: quotes and spaces).
 * - Escaping quotes.
 * - Replacing newlines with CSS-compatible `\00000A` notation.
 *
 * @param {string|null} el - The pseudo-element content string (e.g., from `content` CSS property).
 * @param {string} [trim="\"' "] - Characters to trim from both ends of the string.
 * @returns {string|undefined} The cleaned content string, or `undefined` if input is null or undefined.
 */
export function cleanPseudoContent(el, trim = "\"' ") {
	if (el == null) return;
	return el
		.replace(new RegExp(`^[${trim}]+`), "") // Trim leading characters
		.replace(new RegExp(`[${trim}]+$`), "") // Trim trailing characters
		.replace(/["']/g, (match) => "\\" + match) // Escape quotes
		.replace(/[\n]/g, () => "\\00000A"); // Replace newlines with CSS newline
}

/**
 * Removes specific pseudo-elements from a CSS selector string.
 * Currently strips:
 * - `::footnote-call`
 * - `::footnote-marker`
 *
 * @param {string|null} el - The CSS selector string to clean.
 * @returns {string|undefined} The cleaned selector string, or `undefined` if input is null or undefined.
 */
export function cleanSelector(el) {
	if (el == null) return;
	return el.replace(/::footnote-call/g, "").replace(/::footnote-marker/g, "");
}

/**
 * Split a declaration value on a top-level separator, ignoring separators
 * inside strings and functions.
 *
 * A computed custom property is a raw token stream, so a handler that reads
 * one back — `--string-set`, `--page-position` — has to scan it itself.
 *
 * @param {string} value
 * @param {RegExp} separator - matches one separator character
 * @returns {string[]} non-empty, trimmed parts
 */
export function splitTopLevel(value, separator) {
	const parts = [];
	let current = "";
	let depth = 0;
	let quote = null;

	for (let index = 0; index < value.length; index += 1) {
		const char = value[index];

		if (quote) {
			current += char;
			if (char === "\\") {
				index += 1;
				current += value[index] ?? "";
			} else if (char === quote) {
				quote = null;
			}
			continue;
		}

		if (char === "\"" || char === "'") {
			quote = char;
		} else if (char === "(") {
			depth += 1;
		} else if (char === ")") {
			depth -= 1;
		} else if (depth === 0 && separator.test(char)) {
			parts.push(current);
			current = "";
			continue;
		}

		current += char;
	}

	parts.push(current);
	return parts.map((part) => part.trim()).filter(Boolean);
}

/**
 * Quote a resolved value as a CSS string, for a custom property a `content`
 * declaration reads back through `var()`.
 *
 * Whitespace runs collapse the way they would if the text were rendered, so
 * an indented source element does not carry its indentation into a margin box.
 *
 * @param {string} value
 * @returns {string}
 */
export function cssString(value) {
	const text = String(value ?? "").replace(/\s+/g, " ").trim();
	return `"${text.replace(/[\\"]/g, (char) => `\\${char}`)}"`;
}

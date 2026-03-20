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

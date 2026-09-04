const BARE_NUMBER_RE = /^[+-]?(?:\d+|\d*\.\d+)$/;
const ZERO_RE = /^[+-]?0*(?:\.0*)?$/;

/**
 * Used value of the `bleed` property (CSS Paged Media 3 §11.3.2).
 *
 * `auto` resolves to 6pt when crop marks are asked for and to zero
 * otherwise. A unitless zero is a `<number>` inside `calc()`, where
 * `calc(0 + 216mm)` is a type error that invalidates the declaration and
 * collapses the page to its auto size, so zero is carried as `0px`.
 *
 * @param {string|null} value - `bleed` as written, or null when unset.
 * @param {string|null} marks - `marks` from the same rule, for `auto`.
 * @returns {string|null} A `<length>`, or null when nothing was declared.
 */
export function resolveBleed(value, marks) {
	if (value == null) return null;
	const declared = value.trim();
	if (declared === "") return null;

	const auto = marks && /\bcrop\b/i.test(marks) ? "6pt" : "0px";
	if (declared.toLowerCase() === "auto") return auto;

	const lengths = declared.split(/\s+/);
	if (lengths.some((length) => BARE_NUMBER_RE.test(length) && !ZERO_RE.test(length))) {
		console.warn(`Invalid bleed "${declared}": lengths need a unit.`);
		return auto;
	}
	return lengths.map((length) => (ZERO_RE.test(length) ? "0px" : length)).join(" ");
}

/**
 * Expand Paged.js's legacy one-to-four-value `bleed` extension into sides.
 *
 * CSS Paged Media defines one value, but the legacy engine accepted the CSS
 * box shorthand shape and existing documents use it for asymmetric sheets.
 *
 * @param {string|null} value - Resolved bleed value.
 * @returns {{top: string, right: string, bottom: string, left: string}|null} Per-side bleed values.
 */
export function expandBleed(value) {
	if (value == null) return null;
	const lengths = value.trim().split(/\s+/);
	if (lengths.length === 0 || !lengths[0]) return null;

	const [top, right = top, bottom = top, left = right] = lengths;
	if (lengths.length === 2) {
		return { top, right, bottom: top, left: right };
	}
	return { top, right, bottom, left };
}

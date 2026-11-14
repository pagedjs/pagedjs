/**
 * Resolves omitted bleed values using CSS shorthand order.
 *
 * @param {string|null|undefined} value - Whitespace-separated bleed lengths.
 * @returns {{top: string, right: string, bottom: string, left: string}|null}
 *   The physical sides, or `null` for an empty value.
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

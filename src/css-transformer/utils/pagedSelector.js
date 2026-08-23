/**
 * Build the `<paged-page>` selector an `@page` prelude maps to.
 * Shared by the core at-rule transform and the generated variable rules
 * so both sides address the same element.
 *
 * @param {{ name?: string|null, pseudo?: string[], nth?: { a: number, b: number }|null }} pageData
 * @returns {string}
 */
export function buildPagedSelector({ name, pseudo = [], nth }) {
	let sel = "paged-page";
	if (name) sel += `[name="${name}"]`;
	for (const p of pseudo) sel += `:state(${p})`;
	if (nth) sel += `:nth-of-type(${formatNth(nth)})`;
	return sel;
}

function formatNth({ a, b }) {
	if (a === 0) return String(b);
	let s;
	if (a === 1) s = "n";
	else if (a === -1) s = "-n";
	else s = `${a}n`;
	if (b > 0) s += `+${b}`;
	else if (b < 0) s += String(b);
	return s;
}

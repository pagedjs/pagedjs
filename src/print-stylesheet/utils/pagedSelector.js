/**
 * Build the `<paged-page>` selector an `@page` prelude maps to.
 * Shared by the core at-rule transform and the generated variable rules
 * so both sides address the same element.
 *
 * @param {{ name?: string|null, pseudo?: string[], nth?: { a: number, b: number }|null }} pageData
 * @returns {string}
 */
export function buildPagedSelector({ name, pseudo = [], nth }) {
	let selector = "paged-page";
	if (name) selector += `[name="${name}"]`;
	for (const state of pseudo) selector += `:state(${state})`;
	if (nth) selector += `:nth-of-type(${formatNth(nth)})`;
	return selector;
}

function formatNth({ a, b }) {
	if (a === 0) return String(b);
	let step;
	if (a === 1) step = "n";
	else if (a === -1) step = "-n";
	else step = `${a}n`;
	if (b > 0) step += `+${b}`;
	else if (b < 0) step += String(b);
	return step;
}

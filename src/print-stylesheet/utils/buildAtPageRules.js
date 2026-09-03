import { resolvePageSize } from "./pageSize.js";
import { resolveBleed } from "./pageData.js";

/**
 * Build the physical `@page` rules consumed by browser printing.
 *
 * The leading rule fixes the target sheet to the same Letter fallback used by
 * `PageResolver`; later author rules override it through the normal page
 * cascade.
 *
 * @param {Array<Object>} pageData - Extracted author `@page` rules.
 * @returns {string[]} Browser `@page` rules in cascade order.
 */
export function buildAtPageRules(pageData) {
	const [defaultWidth, defaultHeight] = resolvePageSize();
	const rules = [
		`@page { margin: 0; size: ${defaultWidth} ${defaultHeight}; }`,
	];
	for (const d of pageData) {
		if (d.nth) continue;

		const decls = ["margin: 0"];
		if (d.size) {
			const [w, h] = resolvePageSize(d.size);
			const bleed = d.bleed || resolveBleed("auto", d.marks);
			decls.push(
				`size: calc(${bleed} + ${w} + ${bleed}) calc(${bleed} + ${h} + ${bleed})`,
			);
		}
		const block = `{ ${decls.join("; ")}; }`;

		if (d.pseudo.includes("blank")) {
			const blankName = d.name ? `${d.name}-blank` : "blank";
			rules.push(`@page ${blankName} ${block}`);
			const selector = d.name
				? `paged-page[name="${d.name}"][blank]`
				: "paged-page[blank]";
			rules.push(`${selector} { page: ${blankName}; }`);
		} else {
			const prelude = buildPagePrelude(d.name, d.pseudo);
			const preludePart = prelude ? ` ${prelude}` : "";
			rules.push(`@page${preludePart} ${block}`);
		}
	}
	return rules;
}

function buildPagePrelude(name, pseudo) {
	let s = name || "";
	for (const p of pseudo) {
		if (p === "blank") continue;
		s += `:${p}`;
	}
	return s;
}

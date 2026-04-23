import { resolvePageSize } from "../../css-transformer/utils/pageSize.js";

export function buildAtPageRules(pageData) {
	const rules = [];
	for (const d of pageData) {
		if (d.nth) continue;

		const [w, h] = resolvePageSize(d.size);
		const bleed = d.bleed || "0mm";
		const sizeExpr = `calc(${bleed} + ${w} + ${bleed}) calc(${bleed} + ${h} + ${bleed})`;

		if (d.pseudo.includes("blank")) {
			const blankName = d.name ? `${d.name}-blank` : "blank";
			rules.push(`@page ${blankName} { margin: 0; size: ${sizeExpr}; }`);
			const selector = d.name
				? `paged-page[name="${d.name}"][blank]`
				: `paged-page[blank]`;
			rules.push(`${selector} { page: ${blankName}; }`);
		} else {
			const prelude = buildPagePrelude(d.name, d.pseudo);
			const preludePart = prelude ? ` ${prelude}` : "";
			rules.push(`@page${preludePart} { margin: 0; size: ${sizeExpr}; }`);
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

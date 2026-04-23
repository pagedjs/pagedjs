import { resolvePageSize } from "../../css-transformer/utils/pageSize.js";

export function buildAtPageRules(pageData) {
	const rules = [];
	for (const d of pageData) {
		if (d.nth) continue;

		const decls = ["margin: 0"];
		if (d.size) {
			const [w, h] = resolvePageSize(d.size);
			const bleed = d.bleed || "0px";
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
				: `paged-page[blank]`;
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

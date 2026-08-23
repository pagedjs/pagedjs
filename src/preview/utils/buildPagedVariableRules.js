import { resolvePageSize } from "../../css-transformer/utils/pageSize.js";
import { buildPagedSelector } from "../../css-transformer/utils/pagedSelector.js";

export function buildPagedVariableRules(pageData) {
	const rules = [];
	for (const page of pageData) {
		const decls = buildDeclarations(page);
		if (!decls.length) continue;
		rules.push(`${buildPagedSelector(page)} { ${decls.join(" ")} }`);
	}
	return rules;
}

function buildDeclarations(page) {
	const decls = [];

	if (page.name && page.pseudo.length === 0 && !page.nth) {
		decls.push(`page: ${page.name};`);
	}
	if (page.size) {
		const [w, h] = resolvePageSize(page.size);
		const bleed = page.bleed || "0mm";
		decls.push(`--paged-width: calc(${bleed} + ${w} + ${bleed});`);
		decls.push(`--paged-height: calc(${bleed} + ${h} + ${bleed});`);
	}
	if (page.bleed) decls.push(`--paged-bleed: ${page.bleed};`);
	if (page.margin) {
		if (page.margin.top)
			decls.push(`--paged-margin-top: ${page.margin.top};`);
		if (page.margin.right)
			decls.push(`--paged-margin-right: ${page.margin.right};`);
		if (page.margin.bottom)
			decls.push(`--paged-margin-bottom: ${page.margin.bottom};`);
		if (page.margin.left)
			decls.push(`--paged-margin-left: ${page.margin.left};`);
	}
	if (page.marks) decls.push(`--paged-marks: ${page.marks};`);
	if (page.pageOrientation)
		decls.push(`--paged-page-orientation: ${page.pageOrientation};`);

	return decls;
}

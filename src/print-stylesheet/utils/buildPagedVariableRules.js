import { resolvePageSize } from "./pageSize.js";
import { buildPagedSelector } from "./pagedSelector.js";

/**
 * Project extracted `@page` data onto the `<paged-page>` elements it describes,
 * as the `--paged-*` custom properties the component reads back.
 *
 * The page box itself cannot be styled directly, so everything the component
 * needs to render a sheet — its size, bleed, margins and marks — travels
 * through the cascade instead.
 *
 * @param {Array<Object>} pageData - from `collectAllPageData`
 * @returns {string[]} CSS rule text, one rule per page that declares anything
 */
export function buildPagedVariableRules(pageData) {
	const rules = [];
	for (const page of pageData) {
		const declarations = buildDeclarations(page);
		if (!declarations.length) continue;
		rules.push(`${buildPagedSelector(page)} { ${declarations.join(" ")} }`);
	}
	return rules;
}

function buildDeclarations(page) {
	const declarations = [];

	if (page.name && page.pseudo.length === 0 && !page.nth) {
		declarations.push(`page: ${page.name};`);
	}
	if (page.size) {
		// The sheet carries the bleed on both edges, so the element is wider and
		// taller than the page box the author declared.
		const [width, height] = resolvePageSize(page.size);
		const bleed = page.bleed || "0px";
		declarations.push(`--paged-width: calc(${bleed} + ${width} + ${bleed});`);
		declarations.push(`--paged-height: calc(${bleed} + ${height} + ${bleed});`);
	}
	if (page.bleed) declarations.push(`--paged-bleed: ${page.bleed};`);
	if (page.margin) {
		if (page.margin.top)
			declarations.push(`--paged-margin-top: ${page.margin.top};`);
		if (page.margin.right)
			declarations.push(`--paged-margin-right: ${page.margin.right};`);
		if (page.margin.bottom)
			declarations.push(`--paged-margin-bottom: ${page.margin.bottom};`);
		if (page.margin.left)
			declarations.push(`--paged-margin-left: ${page.margin.left};`);
	}
	if (page.marks) declarations.push(`--paged-marks: ${page.marks};`);
	if (page.pageOrientation)
		declarations.push(`--paged-page-orientation: ${page.pageOrientation};`);

	return declarations;
}

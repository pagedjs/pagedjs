import { resolvePageSize } from "./pageSize.js";
import { buildPagedSelector } from "./pagedSelector.js";
import { expandBleed, resolveBleed } from "./bleed.js";

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
		// Sheet geometry: asymmetric legacy bleed expands the corresponding edge.
		const [width, height] = resolvePageSize(page.size);
		declarations.push(
			`--paged-width: calc(var(--paged-bleed-left) + ${width} + var(--paged-bleed-right));`,
		);
		declarations.push(
			`--paged-height: calc(var(--paged-bleed-top) + ${height} + var(--paged-bleed-bottom));`,
		);
	}
	let bleed = null;
	if (page.bleedAuto) {
		bleed = "var(--paged-auto-bleed)";
	} else if (page.bleed) {
		bleed = page.bleed;
	}
	if (bleed) {
		const sides = expandBleed(bleed);
		declarations.push(`--paged-bleed: ${bleed};`);
		for (const side of ["top", "right", "bottom", "left"]) {
			declarations.push(`--paged-bleed-${side}: ${sides[side]};`);
		}
	}
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
	if (page.padding) {
		for (const side of ["top", "right", "bottom", "left"]) {
			if (page.padding[side]) {
				declarations.push(`--paged-padding-${side}: ${page.padding[side]};`);
			}
		}
	}
	if (page.border) {
		for (const side of ["top", "right", "bottom", "left"]) {
			const edge = page.border[side];
			if (!edge) continue;
			for (const field of ["width", "style", "color"]) {
				if (edge[field]) {
					declarations.push(
						`--paged-border-${side}-${field}: ${edge[field]};`,
					);
				}
			}
		}
	}
	if (page.marks) {
		declarations.push(
			`--paged-auto-bleed: ${resolveBleed("auto", page.marks)};`,
		);
		declarations.push(`--paged-marks: ${page.marks};`);
	}
	if (page.pageOrientation)
		declarations.push(`--paged-page-orientation: ${page.pageOrientation};`);

	return declarations;
}

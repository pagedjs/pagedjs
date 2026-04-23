import { resolvePageSize } from "../../css-transformer/utils/pageSize.js";

export function buildPagedVariableRules(pageData) {
	const rules = [];
	for (const page of pageData) {
		if (page.pseudo.includes("blank")) continue;
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

function buildPagedSelector({ name, pseudo, nth }) {
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

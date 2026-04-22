import * as csstree from "css-tree";
import { extractPagePrelude } from "../utils/extractPageData.js";

const MARGIN_BOX_NAMES = [
	"top-left-corner",
	"top-left",
	"top-center",
	"top-right",
	"top-right-corner",
	"right-top",
	"right-middle",
	"right-bottom",
	"bottom-left-corner",
	"bottom-left",
	"bottom-center",
	"bottom-right",
	"bottom-right-corner",
	"left-top",
	"left-middle",
	"left-bottom",
];

const PAGE_ONLY_DECLARATIONS = new Set([
	"size",
	"bleed",
	"marks",
	"page-orientation",
	"margin",
	"margin-top",
	"margin-right",
	"margin-bottom",
	"margin-left",
]);

export default [
	{
		match: (node) => node.type === "Atrule" && node.name === "page",
		transform: (node) => {
			const data = extractPagePrelude(node.prelude);
			const selector = buildPagedSelector(data);

			node.type = "Rule";
			node.prelude = csstree.parse(selector, { context: "selectorList" });
			node.name = undefined;

			stripPageOnlyDeclarations(node.block);

			if (data.pseudo.includes("blank")) {
				const blankName = data.name ? `${data.name}-blank` : "blank";
				prependDeclaration(node.block, `page: ${blankName};`);
			}
		},
	},
	...MARGIN_BOX_NAMES.map((name) => ({
		match: (node) => node.type === "Atrule" && node.name === name,
		transform: (node) => {
			node.type = "Rule";
			node.prelude = csstree.parse(`&::part(${name})`, {
				context: "selectorList",
			});
			node.name = undefined;
		},
	})),
];

function stripPageOnlyDeclarations(block) {
	if (!block || !block.children) return;
	const toRemove = [];
	block.children.forEach((child, item) => {
		if (
			child.type === "Declaration" &&
			PAGE_ONLY_DECLARATIONS.has(child.property)
		) {
			toRemove.push(item);
		}
	});
	for (const item of toRemove) block.children.remove(item);
}

function prependDeclaration(block, declText) {
	if (!block) return;
	const parsed = csstree.parse(`x { ${declText} }`, { context: "rule" });
	const decl = parsed.block.children.first;
	if (!decl) return;
	block.children.prepend(block.children.createItem(decl));
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

import * as csstree from "css-tree";
import { extractPagePrelude } from "../../css-transformer/utils/extractPageData.js";
import { buildPagedSelector } from "../../css-transformer/utils/pagedSelector.js";

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

// CSS Paged Media §3.2: these describe the sheet, not the page box, and
// are regenerated from the extracted page data instead.
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

export const atPageRules = [
	{
		type: "at-rule",
		match: (node) => node.type === "Atrule" && node.name === "page",
		transform: (node) => {
			const data = extractPagePrelude(node.prelude);

			stripPageOnlyDeclarations(node.block);

			if (data.pseudo.includes("blank")) {
				const blankName = data.name ? `${data.name}-blank` : "blank";
				prependDeclaration(node.block, `page: ${blankName};`);
			}

			return { selector: buildPagedSelector(data) };
		},
	},
	...MARGIN_BOX_NAMES.map((name) => ({
		type: "at-rule",
		match: (node) => node.type === "Atrule" && node.name === name,
		transform: () => ({ selector: `&::part(${name})` }),
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

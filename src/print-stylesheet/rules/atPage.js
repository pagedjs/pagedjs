import { extractPagePrelude } from "../utils/pageData.js";
import { buildPagedSelector } from "../utils/pagedSelector.js";

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

// Page geometry: extracted values drive Fragmentainers and the component's
// internal page box; retaining them here would also decorate the outer host.
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
	"padding",
	"padding-top",
	"padding-right",
	"padding-bottom",
	"padding-left",
	"border",
	"border-width",
	"border-style",
	"border-color",
	"border-top",
	"border-right",
	"border-bottom",
	"border-left",
	"border-top-width",
	"border-right-width",
	"border-bottom-width",
	"border-left-width",
	"border-top-style",
	"border-right-style",
	"border-bottom-style",
	"border-left-style",
	"border-top-color",
	"border-right-color",
	"border-bottom-color",
	"border-left-color",
]);

const MARGIN_VERTICAL_POSITIONS = new Map([
	["top", "0"],
	["middle", "50"],
	["bottom", "100"],
]);

/**
 * Project margin content and supported table-cell vertical alignment keywords
 * onto the component's internal rendering properties.
 *
 * @param {import("css-tree").Block|null} block - Margin at-rule declaration block.
 * @returns {void}
 */
function projectMarginDeclarations(block) {
	block?.children?.forEach((node) => {
		if (node.type !== "Declaration") return;

		if (node.property === "content") {
			node.property = "--paged-margin-content";
			return;
		}

		if (node.property !== "vertical-align") return;

		// CSS Page 3 §6: margin-box vertical alignment is always physical, even
		// when the page or its generated content uses a vertical writing mode.
		const children = node.value.children;
		if (children?.size !== 1 || children.first.type !== "Identifier") return;
		const position = MARGIN_VERTICAL_POSITIONS.get(children.first.name.toLowerCase());
		if (!position) return;

		node.property = "--paged-margin-vertical-position";
		children.head.data = { type: "Percentage", loc: null, value: position };
	});
}

export const atPageRules = [
	{
		type: "at-rule",
		match: ({ name }) => name === "page",
		transform: ({ prelude }) => {
			const data = extractPagePrelude(prelude);
			const result = {
				selector: buildPagedSelector(data),
				removeDeclarations: PAGE_ONLY_DECLARATIONS,
			};

			if (data.pseudo.includes("blank")) {
				const blankName = data.name ? `${data.name}-blank` : "blank";
				result.prependDeclarations = [
					{ property: "page", value: blankName },
				];
			}

			return result;
		},
	},
	...MARGIN_BOX_NAMES.map((box) => ({
		type: "at-rule",
		match: ({ name }) => name === box,
		transform: ({ block }) => {
			projectMarginDeclarations(block);
			return {
				selector: `&::part(${box})`,
			};
		},
	})),
];

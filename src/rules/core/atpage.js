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

const CONTENT_DECLARATIONS = new Set(["content"]);

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
		transform: () => ({
			selector: `&::part(${box})`,
			splitDeclarations: [
				{
					selector: `&::part(${box})::before`,
					properties: CONTENT_DECLARATIONS,
				},
			],
		}),
	})),
];

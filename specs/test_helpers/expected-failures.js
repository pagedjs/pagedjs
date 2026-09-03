const EXPECTED_FAILURES = [
	{
		issue: "SPEC-003",
		file: /breaks\/(?:break-after\/(?:break-after-(?:left|page|recto|right|verso))|break-before\/(?:break-before-(?:left|page|right)))\//,
		test: /^(?:should render \d+ pages|.*Section [23]|.*(?:break after|include|contain) h2)$/,
	},
	{
		issue: "SPEC-003",
		file: /breaks\/(?:break-after\/break-after-(?:left|recto|right|verso)|break-before\/break-before-right)\//,
		test: /^should render page [78] as blank$/,
	},
	{
		issue: "SPEC-003",
		file: /breaks\/break-before\/break-before-left\//,
		test: /^(?:page 1 should be Section|page 2 should be Section 1|page 10 include h2)$/,
	},
	{
		issue: "SPEC-003",
		file: /breaks\/breaks\.spec\.js$/,
		test: /^(?:should render 5 pages|should breaking after #breakAfter)$/,
	},
	{
		issue: "SPEC-003",
		file: /breaks\/child-parent-propagation\/break-before-container-propagation\.spec\.js$/,
		test: /^should page break between containers/,
	},
	{ issue: "TEST-011", file: /counters\/nested\/nested\.spec\.js$/, test: /.*/ },
	{ issue: "SPEC-010", file: /filters\/undisplayed\/undisplayed\.spec\.js$/, test: /.*/ },
	{ issue: "SPEC-003", file: /following-selector\/following-selector\.spec\.js$/, test: /^should render 14 pages$/ },
	{ issue: "SPEC-010", file: /generate-content\/content-none\/content-none\.spec\.js$/, test: /^should render 5 pages$/ },
	{ issue: "SPEC-003", file: /infinite-loop\/infinite-loop\.spec\.js$/, test: /^should render 1 page$/ },
	{
		issue: "SPEC-006",
		file: /issues\/duplicate-headers\/duplicate-headers\.spec\.js$/,
		test: /^(?:should render 6 pages|page [13] header)/,
	},
	{ issue: "SPEC-006", file: /issues\/roman-numerals\/roman-numerals\.spec\.js$/, test: /^(?:Preface should|First Chapter should)/ },
	{ issue: "SPEC-003", file: /issues\/stops-rendering-early\/stops-rendering-early\.spec\.js$/, test: /.*/ },
	{ issue: "SPEC-006", file: /margin-boxes\/vertical-align\/vertical-align\.spec\.js$/, test: /.*/ },
	{ issue: "SPEC-010", file: /math\/math\.spec\.js$/, test: /.*/ },
	{ issue: "SPEC-010", file: /media\/ignore\/ignore\.spec\.js$/, test: /.*/ },
	{ issue: "SPEC-005", file: /named-page\/multiple-named\/multiple-named\.spec\.js$/, test: /with a green background$/ },
	{ issue: "SPEC-005", file: /named-page\/named-page\/named-page\.spec\.js$/, test: /^should render 8 pages$/ },
	{ issue: "SPEC-005", file: /named-page\/nested\/named-page-nested-first-child\.spec\.js$/, test: /^should put preamble/ },
	{ issue: "SPEC-004", file: /notes\/footnote-display\/footnote-display\.spec\.js$/, test: /^should render 6 pages$/ },
	{
		issue: "SPEC-004",
		file: /notes\/footnote-policy\/footnote-policy\.spec\.js$/,
		test: /^(?:should render 6 pages|display auto|display block)/,
	},
	{ issue: "SPEC-004", file: /notes\/footnotes\/footnotes\.spec\.js$/, test: /^(?:should render 14 pages|page 5 split footnote)$/ },
	{ issue: "SPEC-004", file: /notes\/footnotes-counter-reset-page\/footnotes-counter-reset-page\.spec\.js$/, test: /^should render 6 pages$/ },
	{ issue: "SPEC-004", file: /notes\/footnotes-lastpage\/footnotes-lastpage\.spec\.js$/, test: /^(?:not display|should display)/ },
	{ issue: "SPEC-004", file: /notes\/footnotes-padding\/footnotes-padding\.spec\.js$/, test: /^cut the footnote/ },
	{ issue: "SPEC-004", file: /notes\/footnotes-sameline\/footnotes-sameline\.spec\.js$/, test: /^should have/ },
	{ issue: "SPEC-004", file: /notes\/footnotes-styles\/footnotes-styles\.spec\.js$/, test: /^should have three callouts/ },
	{ issue: "SPEC-003", file: /nth-of-type-selector\/nth-of-type-selector\.spec\.js$/, test: /^should render 14 pages$/ },
	{
		issue: "SPEC-005",
		file: /page-selector\/page-group\/first-page-of-page-group\/first-page-of-page-group\.spec\.js$/,
		test: /^(?:should have a named first page class|should have bottom center text)/,
	},
	{ issue: "SPEC-006", file: /page-selector\/page-nth\/page-nth\.spec\.js$/, test: /^should have bottom center text$/ },
	{ issue: "SPEC-006", file: /page-selector\/page-spread\/page-spread\.spec\.js$/, test: /^should have bottom center text/ },
	{ issue: "SPEC-007", file: /position-fixed\/position-fixed\.spec\.js$/, test: /^Page [2-5] should have a fixed sub-element/ },
	{ issue: "TEST-011", file: /splits\/lists\/lists\.spec\.js$/, test: /^should give the first list item on page [12]/ },
	{ issue: "TEST-011", file: /splits\/numbering\/numbering\.spec\.js$/, test: /.*/ },
	{
		issue: "SPEC-003",
		file: /splits\/text-align-last\/text-align-last\.spec\.js$/,
		test: /^should give the first paragraph on page (?:1|3|4)/,
	},
	{ issue: "SPEC-009", file: /tables\/column-overflow\/column-overflow\.spec\.js$/, test: /.*/ },
	{ issue: "SPEC-005", file: /target\/target-counter\/target-counter\.spec\.js$/, test: /.*/ },
	{ issue: "SPEC-005", file: /target\/target-text\/target-text\.spec\.js$/, test: /.*/ },
	{ issue: "SPEC-010", file: /whitespaces\/whitespaces\.spec\.js$/, test: /.*/ },
];

/**
 * Return the issue identifier for a known failing spec assertion.
 *
 * @param {string} file - Absolute or repository-relative spec path.
 * @param {string} title - Leaf Playwright test title.
 * @returns {string|null} Issue identifier, or null for an expected pass.
 */
export function expectedFailureFor(file, title) {
	const normalizedFile = file.replaceAll("\\", "/");
	const match = EXPECTED_FAILURES.find(
		(entry) => entry.file.test(normalizedFile) && entry.test.test(title),
	);
	return match?.issue ?? null;
}

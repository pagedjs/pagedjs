import { test, expect } from "./browser-fixture.js";

test.describe("buildPagedVariableRules", () => {
	test("emits bleed and marks variables for blank pages", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { buildPagedVariableRules } = await import("/src/print-stylesheet/utils/buildPagedVariableRules.js");
			const rules = buildPagedVariableRules([
				{
					name: null,
					pseudo: ["blank"],
					nth: null,
					size: null,
					bleed: "3mm",
					marks: "crop cross",
					margin: null,
					pageOrientation: null,
				},
			]);
			__results.push({ actual: rules, args: [[
				"paged-page:state(blank) { --paged-bleed: 3mm; --paged-bleed-top: 3mm; --paged-bleed-right: 3mm; --paged-bleed-bottom: 3mm; --paged-bleed-left: 3mm; --paged-auto-bleed: 6pt; --paged-marks: crop cross; }",
			]], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toEqual(...results[0].args);
	});

	test("derives auto bleed from cascaded crop marks", async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { buildPagedVariableRules } = await import("/src/print-stylesheet/utils/buildPagedVariableRules.js");
			return buildPagedVariableRules([
				{
					name: null,
					pseudo: [],
					nth: null,
					size: "100px 200px",
					bleed: null,
					bleedAuto: false,
					marks: "crop cross",
					margin: null,
					pageOrientation: null,
				},
				{
					name: null,
					pseudo: ["first"],
					nth: null,
					size: null,
					bleed: "0px",
					bleedAuto: true,
					marks: null,
					margin: null,
					pageOrientation: null,
				},
			]);
		});

		expect(result).toEqual([
			"paged-page { --paged-width: calc(var(--paged-bleed-left) + 100px + var(--paged-bleed-right)); --paged-height: calc(var(--paged-bleed-top) + 200px + var(--paged-bleed-bottom)); --paged-auto-bleed: 6pt; --paged-marks: crop cross; }",
			"paged-page:state(first) { --paged-bleed: var(--paged-auto-bleed); --paged-bleed-top: var(--paged-auto-bleed); --paged-bleed-right: var(--paged-auto-bleed); --paged-bleed-bottom: var(--paged-auto-bleed); --paged-bleed-left: var(--paged-auto-bleed); }",
		]);
	});

	test("expands asymmetric bleed into page-side variables", async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { buildPagedVariableRules } = await import("/src/print-stylesheet/utils/buildPagedVariableRules.js");
			return buildPagedVariableRules([
				{
					name: null,
					pseudo: ["right"],
					nth: null,
					size: "6in 9in",
					bleed: "0.125in 0.125in 0.125in 0in",
					bleedAuto: false,
					marks: null,
					margin: null,
					pageOrientation: null,
				},
			]);
		});

		expect(result).toEqual([
			"paged-page:state(right) { --paged-width: calc(var(--paged-bleed-left) + 6in + var(--paged-bleed-right)); --paged-height: calc(var(--paged-bleed-top) + 9in + var(--paged-bleed-bottom)); --paged-bleed: 0.125in 0.125in 0.125in 0in; --paged-bleed-top: 0.125in; --paged-bleed-right: 0.125in; --paged-bleed-bottom: 0.125in; --paged-bleed-left: 0in; }",
		]);
	});

	test("emits padding and border variables for the matching page selector", async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { buildPagedVariableRules } = await import("/src/print-stylesheet/utils/buildPagedVariableRules.js");
			return buildPagedVariableRules([
				{
					name: "chapter",
					pseudo: ["first"],
					nth: null,
					size: null,
					bleed: null,
					marks: null,
					margin: null,
					padding: { top: "10px", right: "20px", bottom: "10px", left: "20px" },
					border: {
						top: { width: "5px", style: "solid", color: "red" },
					},
					pageOrientation: null,
				},
			]);
		});

		expect(result).toEqual([
			"paged-page[name=\"chapter\"]:state(first) { --paged-padding-top: 10px; --paged-padding-right: 20px; --paged-padding-bottom: 10px; --paged-padding-left: 20px; --paged-border-top-width: 5px; --paged-border-top-style: solid; --paged-border-top-color: red; }",
		]);
	});
});

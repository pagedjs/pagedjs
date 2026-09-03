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
				"paged-page:state(blank) { --paged-bleed: 3mm; --paged-marks: crop cross; }",
			]], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toEqual(...results[0].args);
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

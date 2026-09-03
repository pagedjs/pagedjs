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
});

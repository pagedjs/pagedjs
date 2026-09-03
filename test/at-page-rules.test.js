import { test, expect } from "./browser-fixture.js";

test.describe("buildAtPageRules", () => {
	test("resolves asymmetric pseudo-page bleed against the base size", async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { buildAtPageRules } = await import("/src/print-stylesheet/utils/buildAtPageRules.js");
			return buildAtPageRules([
				{
					name: null,
					pseudo: [],
					nth: null,
					size: "6in 9in",
					bleed: "10mm",
					bleedAuto: false,
					marks: null,
				},
				{
					name: null,
					pseudo: ["left"],
					nth: null,
					size: null,
					bleed: "0.125in 0in 0.125in 0.125in",
					bleedAuto: false,
					marks: null,
				},
				{
					name: null,
					pseudo: ["right"],
					nth: null,
					size: null,
					bleed: "0.125in 0.125in 0.125in 0in",
					bleedAuto: false,
					marks: null,
				},
			]);
		});

		expect(result).toContain(
			"@page :left { margin: 0; size: calc(0.125in + 6in + 0in) calc(0.125in + 9in + 0.125in); }",
		);
		expect(result).toContain(
			"@page :right { margin: 0; size: calc(0in + 6in + 0.125in) calc(0.125in + 9in + 0.125in); }",
		);
	});
});

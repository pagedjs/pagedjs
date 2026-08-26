import { describe, expect, it } from "../browser-suite.js";
import { buildPagedVariableRules } from "/src/print-stylesheet/utils/buildPagedVariableRules.js";

describe("buildPagedVariableRules", () => {
	it("emits bleed and marks variables for blank pages", () => {
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

		expect(rules).toEqual([
			"paged-page:state(blank) { --paged-bleed: 3mm; --paged-marks: crop cross; }",
		]);
	});
});

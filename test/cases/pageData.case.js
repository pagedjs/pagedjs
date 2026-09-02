import { describe, expect, it } from "../browser-suite.js";
import * as csstree from "css-tree";
import {
	extractPageData,
	resolveBleed,
} from "/src/print-stylesheet/utils/pageData.js";

function pageData(css) {
	const ast = csstree.parse(css);
	return extractPageData(ast.children.first);
}

describe("bleed", () => {
	it("carries a unitless zero as a length", () => {
		// calc() reads a unitless zero as <number>, so the raw value would
		// make calc(0 + 216mm + 0) — and the whole page size — invalid.
		expect(pageData("@page { size: 216mm 279mm; bleed: 0; }").bleed).toBe("0px");
	});

	it("keeps a declared length as written", () => {
		expect(pageData("@page { bleed: 3mm; }").bleed).toBe("3mm");
	});

	it("resolves auto against the marks in the same rule", () => {
		expect(pageData("@page { bleed: auto; marks: crop cross; }").bleed).toBe("6pt");
		expect(pageData("@page { bleed: auto; marks: cross; }").bleed).toBe("0px");
		expect(pageData("@page { bleed: auto; }").bleed).toBe("0px");
	});

	it("falls back to the auto value for a length with no unit", () => {
		expect(resolveBleed("5", null)).toBe("0px");
		expect(resolveBleed("5", "crop")).toBe("6pt");
	});

	it("stays null when the page declares no bleed", () => {
		expect(pageData("@page { size: A4; }").bleed).toBe(null);
	});
});

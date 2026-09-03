import { test, expect } from "./browser-fixture.js";

test.describe("@page data extraction", () => {
	test("carries a unitless zero as a length", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { extractPageData } = await import("/src/print-stylesheet/utils/pageData.js");
			function pageData(css) {
				const ast = csstree.parse(css);
				return extractPageData(ast.children.first);
			}
			__results.push({ actual: pageData("@page { size: 216mm 279mm; bleed: 0; }").bleed, args: ["0px"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("keeps a declared length as written", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { extractPageData } = await import("/src/print-stylesheet/utils/pageData.js");
			function pageData(css) {
				const ast = csstree.parse(css);
				return extractPageData(ast.children.first);
			}
			__results.push({ actual: pageData("@page { bleed: 3mm; }").bleed, args: ["3mm"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("resolves auto against the marks in the same rule", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { extractPageData } = await import("/src/print-stylesheet/utils/pageData.js");
			function pageData(css) {
				const ast = csstree.parse(css);
				return extractPageData(ast.children.first);
			}
			__results.push({ actual: pageData("@page { bleed: auto; marks: crop cross; }").bleed, args: ["6pt"], label: undefined });
			__results.push({ actual: pageData("@page { bleed: auto; marks: cross; }").bleed, args: ["0px"], label: undefined });
			__results.push({ actual: pageData("@page { bleed: auto; }").bleed, args: ["0px"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
		expect(results[2].actual, results[2].label).toBe(...results[2].args);
	});

	test("falls back to the auto value for a length with no unit", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("css-tree");
			const { resolveBleed } = await import("/src/print-stylesheet/utils/pageData.js");
			__results.push({ actual: resolveBleed("5", null), args: ["0px"], label: undefined });
			__results.push({ actual: resolveBleed("5", "crop"), args: ["6pt"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("stays null when the page declares no bleed", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { extractPageData } = await import("/src/print-stylesheet/utils/pageData.js");
			function pageData(css) {
				const ast = csstree.parse(css);
				return extractPageData(ast.children.first);
			}
			__results.push({ actual: pageData("@page { size: A4; }").bleed, args: [null], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});
});

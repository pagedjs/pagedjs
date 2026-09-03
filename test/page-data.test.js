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

	test("expands the legacy bleed shorthand into sides", async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { expandBleed } = await import("/src/print-stylesheet/utils/pageData.js");
			return {
				one: expandBleed("1mm"),
				two: expandBleed("1mm 2mm"),
				three: expandBleed("1mm 2mm 3mm"),
				four: expandBleed("1mm 2mm 3mm 4mm"),
			};
		});

		expect(result).toEqual({
			one: { top: "1mm", right: "1mm", bottom: "1mm", left: "1mm" },
			two: { top: "1mm", right: "2mm", bottom: "1mm", left: "2mm" },
			three: { top: "1mm", right: "2mm", bottom: "3mm", left: "2mm" },
			four: { top: "1mm", right: "2mm", bottom: "3mm", left: "4mm" },
		});
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

	test("records explicit auto separately from an omitted bleed", async ({ page }) => {
		const result = await page.evaluate(async () => {
			const csstree = await import("css-tree");
			const { extractPageData } = await import("/src/print-stylesheet/utils/pageData.js");
			const pageData = (css) => extractPageData(csstree.parse(css).children.first);
			return {
				explicit: pageData("@page { bleed: auto; }").bleedAuto,
				omitted: pageData("@page { marks: crop; }").bleedAuto,
			};
		});

		expect(result).toEqual({ explicit: true, omitted: false });
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

	test("normalizes page padding and border declarations", async ({ page }) => {
		const result = await page.evaluate(async () => {
			const csstree = await import("css-tree");
			const { extractPageData } = await import("/src/print-stylesheet/utils/pageData.js");
			const ast = csstree.parse(`
				@page {
					padding: 10px 20px;
					padding-left: 30px;
					border: 2px solid red;
					border-top-width: 7px;
					border-left-color: blue;
				}
			`);
			const data = extractPageData(ast.children.first);
			return { padding: data.padding, border: data.border };
		});

		expect(result.padding).toEqual({
			top: "10px",
			right: "20px",
			bottom: "10px",
			left: "30px",
		});
		expect(result.border.top).toEqual({ width: "7px", style: "solid", color: "red" });
		expect(result.border.right).toEqual({ width: "2px", style: "solid", color: "red" });
		expect(result.border.bottom).toEqual({ width: "2px", style: "solid", color: "red" });
		expect(result.border.left).toEqual({ width: "2px", style: "solid", color: "blue" });
	});

	test("leaves absent padding and borders null", async ({ page }) => {
		const result = await page.evaluate(async () => {
			const csstree = await import("css-tree");
			const { extractPageData } = await import("/src/print-stylesheet/utils/pageData.js");
			const ast = csstree.parse("@page { margin: 10px; }");
			const data = extractPageData(ast.children.first);
			return { padding: data.padding, border: data.border };
		});
		expect(result).toEqual({ padding: null, border: null });
	});
});

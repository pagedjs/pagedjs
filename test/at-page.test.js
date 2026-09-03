import { test, expect } from "./browser-fixture.js";

test.describe("core @page margin-box rules", () => {
	test("puts generated content on the exposed ::before pseudo-element", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			const { coreRules } = await import("/src/print-stylesheet/rules/index.js");
			async function transform(css, rules = []) {
				const transformer = new CssTransformer({ rules: [...coreRules, ...rules] });
				const ast = await transformer.prepare(css);
				return csstree.generate(transformer.apply(ast));
			}
			__results.push({ actual: await transform("@page { @top-center { content: \"Chapter\"; } }"), args: ["paged-page{&::part(top-center)::before{content:\"Chapter\"}}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("keeps box styles separate without losing cascade or importance", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			const { coreRules } = await import("/src/print-stylesheet/rules/index.js");
			async function transform(css, rules = []) {
				const transformer = new CssTransformer({ rules: [...coreRules, ...rules] });
				const ast = await transformer.prepare(css);
				return csstree.generate(transformer.apply(ast));
			}
			__results.push({ actual: await transform(`
							@page {
								@bottom-center {
									color: red;
									content: "fallback";
									font-weight: bold !important;
									content: counter(page) !important;
									color: blue;
								}
							}
						`), args: ["paged-page{&::part(bottom-center){color:red;font-weight:bold!important;color:blue}&::part(bottom-center)::before{content:\"fallback\";content:counter(page)!important}}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("routes generated content and its source metadata to the matching margin parts", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			const { coreRules } = await import("/src/print-stylesheet/rules/index.js");
			async function transform(css, rules = []) {
				const transformer = new CssTransformer({ rules: [...coreRules, ...rules] });
				const ast = await transformer.prepare(css);
				return csstree.generate(transformer.apply(ast));
			}
			const generated = {
				type: "function",
				match: ({ name }) => name === "generated",
				transform: ({ value }) => ({
					value: "var(--paged-generated-0, \"\")",
					declarations: [
						{ property: "--paged-generated-0-source", value },
					],
				}),
			};
			__results.push({ actual: await transform(
				"@page { @top-center { color: red; content: generated(title); } }",
				[generated],
			), args: ["paged-page{&::part(top-center){color:red;--paged-generated-0-source:generated(title)}&::part(top-center)::before{content:var(--paged-generated-0, \"\")}}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});
});

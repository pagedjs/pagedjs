import { test, expect } from "./browser-fixture.js";

test.describe("core @media rules", () => {
	test("unwraps a print block", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { coreRules } = await import("/src/print-stylesheet/rules/index.js");
			async function transform(css) {
				const transformer = new CssTransformer({ rules: coreRules });
				const ast = await transformer.prepare(css);
				return transformer.generate(transformer.apply(ast));
			}
			__results.push({ actual: await transform("@media print { p { color: red } }"), args: ["p{color:red}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("drops a screen block", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { coreRules } = await import("/src/print-stylesheet/rules/index.js");
			async function transform(css) {
				const transformer = new CssTransformer({ rules: coreRules });
				const ast = await transformer.prepare(css);
				return transformer.generate(transformer.apply(ast));
			}
			__results.push({ actual: await transform("@media screen { p { color: red } }"), args: [""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("keeps a media query it does not recognize", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { coreRules } = await import("/src/print-stylesheet/rules/index.js");
			async function transform(css) {
				const transformer = new CssTransformer({ rules: coreRules });
				const ast = await transformer.prepare(css);
				return transformer.generate(transformer.apply(ast));
			}
			__results.push({ actual: await transform("@media (min-width: 30em) { p { color: red } }"), args: ["@media (min-width:30em){p{color:red}}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("keeps unwrapped siblings in source order", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { coreRules } = await import("/src/print-stylesheet/rules/index.js");
			async function transform(css) {
				const transformer = new CssTransformer({ rules: coreRules });
				const ast = await transformer.prepare(css);
				return transformer.generate(transformer.apply(ast));
			}
			__results.push({ actual: await transform("a { color: red } @media print { b { color: green } } i { color: blue }"), args: ["a{color:red}b{color:green}i{color:blue}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("resolves every query in a list", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { coreRules } = await import("/src/print-stylesheet/rules/index.js");
			async function transform(css) {
				const transformer = new CssTransformer({ rules: coreRules });
				const ast = await transformer.prepare(css);
				return transformer.generate(transformer.apply(ast));
			}
			__results.push({ actual: await transform("@media only print { p{color:red} }"), args: ["p{color:red}"], label: undefined });
			__results.push({ actual: await transform("@media print, screen { p{color:red} }"), args: ["p{color:red}"], label: undefined });
			__results.push({ actual: await transform("@media screen, print { p{color:red} }"), args: ["p{color:red}"], label: undefined });
			__results.push({ actual: await transform("@media not screen { p{color:red} }"), args: ["p{color:red}"], label: undefined });
			__results.push({ actual: await transform("@media all { p{color:red} }"), args: ["p{color:red}"], label: undefined });
			__results.push({ actual: await transform("@media not all { p{color:red} }"), args: [""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
		expect(results[2].actual, results[2].label).toBe(...results[2].args);
		expect(results[3].actual, results[3].label).toBe(...results[3].args);
		expect(results[4].actual, results[4].label).toBe(...results[4].args);
		expect(results[5].actual, results[5].label).toBe(...results[5].args);
	});

	test("keeps the feature test and drops the satisfied media type", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { coreRules } = await import("/src/print-stylesheet/rules/index.js");
			async function transform(css) {
				const transformer = new CssTransformer({ rules: coreRules });
				const ast = await transformer.prepare(css);
				return transformer.generate(transformer.apply(ast));
			}
			__results.push({ actual: await transform("@media print and (min-width: 5in) { p{color:red} }"), args: ["@media (min-width:5in){p{color:red}}"], label: undefined });
			__results.push({ actual: await transform(
				"@media screen and (max-width:30em), print and (min-width:5in) { p{color:red} }",
			), args: ["@media (min-width:5in){p{color:red}}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("drops a query that can never match print", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { coreRules } = await import("/src/print-stylesheet/rules/index.js");
			async function transform(css) {
				const transformer = new CssTransformer({ rules: coreRules });
				const ast = await transformer.prepare(css);
				return transformer.generate(transformer.apply(ast));
			}
			__results.push({ actual: await transform("@media screen and (max-width: 30em) { p{color:red} }"), args: [""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("drops a screen block nested inside a print block", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { coreRules } = await import("/src/print-stylesheet/rules/index.js");
			async function transform(css) {
				const transformer = new CssTransformer({ rules: coreRules });
				const ast = await transformer.prepare(css);
				return transformer.generate(transformer.apply(ast));
			}
			__results.push({ actual: await transform("@media print { @media screen { p { color: red } } }"), args: [""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("unwraps a print block nested inside a print block", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { coreRules } = await import("/src/print-stylesheet/rules/index.js");
			async function transform(css) {
				const transformer = new CssTransformer({ rules: coreRules });
				const ast = await transformer.prepare(css);
				return transformer.generate(transformer.apply(ast));
			}
			__results.push({ actual: await transform("@media print { @media print { p { color: red } } }"), args: ["p{color:red}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("flattens a nested block without losing its siblings", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { coreRules } = await import("/src/print-stylesheet/rules/index.js");
			async function transform(css) {
				const transformer = new CssTransformer({ rules: coreRules });
				const ast = await transformer.prepare(css);
				return transformer.generate(transformer.apply(ast));
			}
			__results.push({ actual: await transform(
				"@media print { a { color: red } @media screen { .t { display: block } } i { color: blue } }",
			), args: ["a{color:red}i{color:blue}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("converts an @page nested inside a print block exactly once", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { coreRules } = await import("/src/print-stylesheet/rules/index.js");
			async function transform(css) {
				const transformer = new CssTransformer({ rules: coreRules });
				const ast = await transformer.prepare(css);
				return transformer.generate(transformer.apply(ast));
			}
			__results.push({ actual: await transform(
				"@media print { @page { size: A4; color: red; @top-center { content: \"x\" } } }",
			), args: ["paged-page{color:red;&::part(top-center){--paged-margin-content:\"x\"}}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});
});

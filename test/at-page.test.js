import { test, expect } from "./browser-fixture.js";

test.describe("core @page margin-box rules", () => {
	test("routes generated content to the margin-box component", async ({ page }) => {
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
			__results.push({ actual: await transform("@page { @top-center { content: \"Chapter\"; } }"), args: ["paged-page{&::part(top-center){--paged-margin-content:\"Chapter\"}}"], label: undefined });
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
						`), args: ["paged-page{&::part(bottom-center){color:red;--paged-margin-content:\"fallback\";font-weight:bold!important;--paged-margin-content:counter(page)!important;color:blue}}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("projects supported margin-box vertical alignment onto the physical axis", async ({ page }) => {
		const actual = await page.evaluate(async () => {
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			const { coreRules } = await import("/src/print-stylesheet/rules/index.js");
			const transformer = new CssTransformer({ rules: coreRules });
			const ast = await transformer.prepare(`
				@page {
					@top-left { vertical-align: TOP !important; }
					@top-center { vertical-align: middle; }
					@right-middle { vertical-align: center; }
					@bottom-right { color: red; vertical-align: bottom; }
				}
				p { vertical-align: top; }
			`);
			return csstree.generate(transformer.apply(ast));
		});

		expect(actual).toBe(
			"paged-page{&::part(top-left){--paged-margin-vertical-position:0%!important}" +
			"&::part(top-center){--paged-margin-vertical-position:50%}" +
			"&::part(right-middle){vertical-align:center}" +
			"&::part(bottom-right){color:red;--paged-margin-vertical-position:100%}}" +
			"p{vertical-align:top}",
		);
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
			), args: ["paged-page{&::part(top-center){color:red;--paged-margin-content:var(--paged-generated-0, \"\");--paged-generated-0-source:generated(title)}}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("removes page padding and borders from the host-facing rule", async ({ page }) => {
		const actual = await page.evaluate(async () => {
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			const { coreRules } = await import("/src/print-stylesheet/rules/index.js");
			const transformer = new CssTransformer({ rules: coreRules });
			const ast = await transformer.prepare(`
				@page {
					padding: 10px;
					border: 5px solid red;
					background: yellow;
				}
			`);
			return csstree.generate(transformer.apply(ast));
		});

		expect(actual).toBe("paged-page{background:yellow}");
	});
});

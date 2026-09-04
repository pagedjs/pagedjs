import { test, expect } from "./browser-fixture.js";

test("reads original page data from the same AST before destructive transforms", async ({ page }) => {
	const result = await page.evaluate(async () => {
		const { CssTransformer } = await import("@pagedjs/css-transformer");
		const { coreRules } = await import("/src/print-stylesheet/rules/index.js");
		const { collectAllPageData } = await import("/src/print-stylesheet/utils/pageData.js");
		const transformer = new CssTransformer({ rules: coreRules });
		const ast = await transformer.prepare("@page chapter:left:nth(2n + 1){size:A4;margin:10mm;@top-center{vertical-align:middle;content:\"Title\"}}");
		const original = transformer.generate(ast);
		const first = ast.children.first;
		const data = collectAllPageData(ast, (node) => transformer.generate(node));
		const unchanged = original === transformer.generate(ast) && first === ast.children.first;
		const sameAST = transformer.apply(ast) === ast;
		return { data, unchanged, sameAST, css: transformer.generate(ast) };
	});
	expect(result.unchanged).toBe(true);
	expect(result.sameAST).toBe(true);
	expect(result.data[0]).toMatchObject({
		name: "chapter", pseudo: ["left"], nth: { a: 2, b: 1 }, size: "A4",
		marginBoxes: { "top-center": { "vertical-align": "middle", content: "\"Title\"" } },
	});
	expect(result.css).not.toContain("size:");
	expect(result.css).toContain("--paged-margin-vertical-position:50%");
});

for (const [argument, expected] of [["odd", { a: 2, b: 1 }], ["even", { a: 2, b: 0 }], ["-n + 3", { a: -1, b: 3 }], ["4", { a: 0, b: 4 }]]) {
	test(`reads :nth(${argument}) directly from the prelude`, async ({ page }) => {
		const result = await page.evaluate(async (argument) => {
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { extractPagePrelude } = await import("/src/print-stylesheet/utils/pageData.js");
			const ast = await new CssTransformer().prepare(`@page cover:blank:nth(${argument}){}`);
			return extractPagePrelude(ast.children.first.prelude);
		}, argument);
		expect(result).toEqual({ name: "cover", pseudo: ["blank"], nth: expected });
	});
}

test("prunes excluded media before reading declarations and preserves conditional source order", async ({ page }) => {
	const result = await page.evaluate(async () => {
		const { CssTransformer } = await import("@pagedjs/css-transformer");
		const { collectAllPageData } = await import("/src/print-stylesheet/utils/pageData.js");
		const transformer = new CssTransformer();
		const ast = await transformer.prepare(`
			@page{size:A4}
			@media screen{@page{size:A5}@media print{@page hidden{size:A5}}}
			@media screen, not all{@page excluded{size:A5}}
			@media screen, print{@page comma{size:letter}}
			@media print{@media screen{@page nested{size:A5}}@page print{size:A4}}
			@media (min-width:1px){@page feature{size:A4}}
			@supports (display:grid){@page supported{size:A4}}
			@layer book{@page layered{size:A4}}
		`);
		const serialized = [];
		const data = collectAllPageData(ast, (node) => {
			const text = transformer.generate(node);
			serialized.push(text);
			return text;
		});
		return { names: data.map((rule) => rule.name), serialized };
	});
	expect(result.names).toEqual([null, "comma", "print", "feature", "supported", "layered"]);
	expect(result.serialized).not.toContain("A5");
});

for (const [query, included] of [
	["@MEDIA screen", false],
	["@media SCREEN", false],
	["@MeDiA sCrEeN", false],
	["@media NOT PRINT", false],
	["@media ONLY SCREEN", false],
	["@MEDIA SCREEN, ONLY PRINT", true],
	["@media NOT SCREEN", true],
]) {
	test(`uses case-insensitive print filtering for ${query}`, async ({ page }) => {
		const result = await page.evaluate(async (query) => {
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { coreRules } = await import("/src/print-stylesheet/rules/index.js");
			const { collectAllPageData } = await import("/src/print-stylesheet/utils/pageData.js");
			const transformer = new CssTransformer({ rules: coreRules });
			const ast = await transformer.prepare(`${query}{@page{size:A5;color:red}}`);
			const sizes = collectAllPageData(ast, (node) => transformer.generate(node)).map((rule) => rule.size);
			return { sizes, css: transformer.generate(transformer.apply(ast)) };
		}, query);
		expect(result.sizes).toEqual(included ? ["A5"] : []);
		expect(result.css).toBe(included ? "paged-page{color:red}" : "");
	});
}

test("imports page-data and bleed helpers without loading a parser", async ({ page }) => {
	const requests = [];
	page.on("request", (request) => requests.push(request.url()));
	await page.evaluate(async () => {
		await import("/src/print-stylesheet/utils/pageData.js");
		await import("/src/print-stylesheet/utils/bleed.js");
	});
	expect(requests.filter((url) => /css-tree|css-transformer/.test(url))).toEqual([]);
});

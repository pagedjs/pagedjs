import { describe, it, expect } from "vitest";
import * as csstree from "css-tree";
import { CssTransformer } from "../../css-transformer/CssTransformer.js";
import { coreRules } from "./index.js";

async function transform(css) {
	const transformer = new CssTransformer({ rules: coreRules });
	const ast = await transformer.prepare(css);
	return csstree.generate(transformer.apply(ast));
}

describe("@media core rules", () => {
	it("unwraps a print block", async () => {
		expect(await transform("@media print { p { color: red } }")).toBe("p{color:red}");
	});

	it("drops a screen block", async () => {
		expect(await transform("@media screen { p { color: red } }")).toBe("");
	});

	it("keeps a media query it does not recognize", async () => {
		expect(await transform("@media (min-width: 30em) { p { color: red } }")).toBe(
			"@media (min-width:30em){p{color:red}}",
		);
	});

	it("keeps unwrapped siblings in source order", async () => {
		expect(
			await transform("a { color: red } @media print { b { color: green } } i { color: blue }"),
		).toBe("a{color:red}b{color:green}i{color:blue}");
	});

	it("resolves every query in a list", async () => {
		expect(await transform("@media only print { p{color:red} }")).toBe("p{color:red}");
		expect(await transform("@media print, screen { p{color:red} }")).toBe("p{color:red}");
		expect(await transform("@media screen, print { p{color:red} }")).toBe("p{color:red}");
		expect(await transform("@media not screen { p{color:red} }")).toBe("p{color:red}");
		expect(await transform("@media all { p{color:red} }")).toBe("p{color:red}");
		expect(await transform("@media not all { p{color:red} }")).toBe("");
	});

	it("keeps the feature test and drops the satisfied media type", async () => {
		expect(await transform("@media print and (min-width: 5in) { p{color:red} }")).toBe(
			"@media (min-width:5in){p{color:red}}",
		);
		expect(
			await transform(
				"@media screen and (max-width:30em), print and (min-width:5in) { p{color:red} }",
			),
		).toBe("@media (min-width:5in){p{color:red}}");
	});

	it("drops a query that can never match print", async () => {
		expect(await transform("@media screen and (max-width: 30em) { p{color:red} }")).toBe("");
	});

	it("drops a screen block nested inside a print block", async () => {
		expect(
			await transform("@media print { @media screen { p { color: red } } }"),
		).toBe("");
	});

	it("unwraps a print block nested inside a print block", async () => {
		expect(
			await transform("@media print { @media print { p { color: red } } }"),
		).toBe("p{color:red}");
	});

	it("flattens a nested block without losing its siblings", async () => {
		expect(
			await transform(
				"@media print { a { color: red } @media screen { .t { display: block } } i { color: blue } }",
			),
		).toBe("a{color:red}i{color:blue}");
	});

	it("converts an @page nested inside a print block exactly once", async () => {
		expect(
			await transform(
				"@media print { @page { size: A4; color: red; @top-center { content: \"x\" } } }",
			),
		).toBe("paged-page{color:red;&::part(top-center){content:\"x\"}}");
	});
});

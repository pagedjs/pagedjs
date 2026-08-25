import { describe, it, expect } from "vitest";
import * as csstree from "css-tree";
import { CssTransformer } from "../../css-transformer/CssTransformer.js";
import { coreRules } from "./index.js";

async function transform(css, rules = []) {
	const transformer = new CssTransformer({ rules: [...coreRules, ...rules] });
	const ast = await transformer.prepare(css);
	return csstree.generate(transformer.apply(ast));
}

describe("core @page margin-box rules", () => {
	it("puts generated content on the exposed ::before pseudo-element", async () => {
		expect(
			await transform("@page { @top-center { content: \"Chapter\"; } }"),
		).toBe(
			"paged-page{&::part(top-center)::before{content:\"Chapter\"}}",
		);
	});

	it("keeps box styles separate without losing cascade or importance", async () => {
		expect(
			await transform(`
				@page {
					@bottom-center {
						color: red;
						content: "fallback";
						font-weight: bold !important;
						content: counter(page) !important;
						color: blue;
					}
				}
			`),
		).toBe(
			"paged-page{&::part(bottom-center){color:red;font-weight:bold!important;color:blue}&::part(bottom-center)::before{content:\"fallback\";content:counter(page)!important}}",
		);
	});

	it("routes generated content and its source metadata to the matching margin parts", async () => {
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

		expect(
			await transform(
				"@page { @top-center { color: red; content: generated(title); } }",
				[generated],
			),
		).toBe(
			"paged-page{&::part(top-center){color:red;--paged-generated-0-source:generated(title)}&::part(top-center)::before{content:var(--paged-generated-0, \"\")}}",
		);
	});
});

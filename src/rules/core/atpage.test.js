import { describe, it, expect } from "vitest";
import * as csstree from "css-tree";
import { CssTransformer } from "../../css-transformer/CssTransformer.js";
import { coreRules } from "./index.js";

async function transform(css) {
	const transformer = new CssTransformer({ rules: coreRules });
	const ast = await transformer.prepare(css);
	return csstree.generate(transformer.apply(ast));
}

describe("@page margin-box core rules", () => {
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
});

import { describe, it, expect } from "vitest";
import * as csstree from "css-tree";
import { CssTransformer } from "./CssTransformer.js";

const renameRule = (from, to) => ({
	type: "declaration",
	match: ({ property }) => property === from,
	transform: () => ({ property: to }),
});

async function run(rules, css, cssBaseURL) {
	const transformer = new CssTransformer({ rules });
	const ast = await transformer.prepare([{ css, cssBaseURL }]);
	return csstree.generate(transformer.apply(ast));
}

describe("CssTransformer", () => {
	it("keeps each instance's rules to itself", async () => {
		const a = new CssTransformer({ rules: [renameRule("color", "--a")] });
		const b = new CssTransformer({ rules: [renameRule("color", "--b")] });

		const fromA = csstree.generate(a.apply(await a.prepare("p { color: red; }")));
		const fromB = csstree.generate(b.apply(await b.prepare("p { color: red; }")));

		expect(fromA).toBe("p{--a:red}");
		expect(fromB).toBe("p{--b:red}");
	});

	it("runs a walker only when rules of its type exist", async () => {
		let declarationMatches = 0;
		const rules = [
			{
				type: "declaration",
				match: () => {
					declarationMatches++;
					return false;
				},
				transform: () => null,
			},
		];

		await run(rules, "p { color: red; }");
		expect(declarationMatches).toBe(1);

		declarationMatches = 0;
		await run([], "p { color: red; }");
		expect(declarationMatches).toBe(0);
	});

	it("rebases urls in a top-level sheet with no url rules", async () => {
		const out = await run(
			[],
			"p { background: url(\"img/a.png\"); }",
			"https://example.com/css/book.css",
		);
		expect(out).toContain("https://example.com/css/img/a.png");
	});

	it("lets a url rule rewrite the already-rebased url", async () => {
		const rules = [
			{
				type: "url",
				match: (url) => url.endsWith("a.png"),
				transform: (url) => `${url}?v=1`,
			},
		];
		const out = await run(
			rules,
			"p { background: url(\"img/a.png\"); }",
			"https://example.com/css/book.css",
		);
		expect(out).toContain("https://example.com/css/img/a.png?v=1");
	});

	it("converts an at-rule that returns a selector into a style rule", async () => {
		const rules = [
			{
				type: "at-rule",
				match: (node) => node.type === "Atrule" && node.name === "widget",
				transform: () => ({ selector: "& [data-widget]" }),
			},
		];

		const transformer = new CssTransformer({ rules });
		const ast = transformer.apply(csstree.parse("@widget { color: red; }"));

		const node = ast.children.first;
		expect(node.type).toBe("Rule");
		expect(node.name).toBeUndefined();
		expect(csstree.generate(node.prelude)).toBe("& [data-widget]");
		expect(csstree.generate(ast)).toBe("& [data-widget]{color:red}");
	});

	it("stops at the rule that converted an at-rule", async () => {
		let laterCalls = 0;
		const rules = [
			{
				type: "at-rule",
				match: (node) => node.type === "Atrule" && node.name === "widget",
				transform: () => ({ selector: ".widget" }),
			},
			{
				type: "at-rule",
				match: () => {
					laterCalls++;
					return false;
				},
				transform: () => null,
			},
		];

		const transformer = new CssTransformer({ rules });
		transformer.apply(csstree.parse("@widget { color: red; }"));
		expect(laterCalls).toBe(0);
	});

	it("still walks a converted at-rule's block", async () => {
		const rules = [
			{
				type: "at-rule",
				match: (node) => node.type === "Atrule" && node.name === "outer",
				transform: () => ({ selector: ".outer" }),
			},
			{
				type: "at-rule",
				match: (node) => node.type === "Atrule" && node.name === "inner",
				transform: () => ({ selector: "&::part(inner)" }),
			},
		];

		const transformer = new CssTransformer({ rules });
		const ast = transformer.apply(
			csstree.parse("@outer { @inner { color: red; } }"),
		);
		expect(csstree.generate(ast)).toBe(".outer{&::part(inner){color:red}}");
	});
});

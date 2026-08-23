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
				match: ({ url }) => url.endsWith("a.png"),
				transform: ({ url }) => ({ url: `${url}?v=1` }),
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
				match: ({ name }) => name === "widget",
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
				match: ({ name }) => name === "widget",
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
				match: ({ name }) => name === "outer",
				transform: () => ({ selector: ".outer" }),
			},
			{
				type: "at-rule",
				match: ({ name }) => name === "inner",
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

describe("the function walker", () => {
	const upper = {
		type: "function",
		match: ({ name }) => name === "shout",
		transform: ({ args }) => ({ value: `"${args[0].toUpperCase()}"` }),
	};

	it("rewrites a function anywhere in a value", async () => {
		const out = await run([upper], "p { content: shout(hi) \" and \" shout(bye); }");
		expect(out).toBe("p{content:\"HI\"\" and \"\"BYE\"}");
	});

	it("splits arguments on top-level commas only", async () => {
		let seen = null;
		const rules = [
			{
				type: "function",
				match: ({ name }) => name === "pick",
				transform: (ctx) => {
					seen = ctx.args;
					return null;
				},
			},
		];
		await run(rules, "p { content: pick(attr(href), page, \"a, b\"); }");
		expect(seen).toEqual(["attr(href)", "page", "\"a, b\""]);
	});

	it("exposes the owning declaration so a rule can scope itself", async () => {
		const rules = [
			{
				type: "function",
				match: ({ name, declaration }) =>
					name === "shout" && declaration.property === "content",
				transform: () => ({ value: "\"yes\"" }),
			},
		];
		expect(await run(rules, "p { content: shout(a); width: shout(a); }")).toBe(
			"p{content:\"yes\";width:shout(a)}",
		);
	});

	it("drops a function on remove", async () => {
		const rules = [
			{ type: "function", match: ({ name }) => name === "gone", transform: () => ({ remove: true }) },
		];
		expect(await run(rules, "p { content: gone(x); }")).toBe("p{content:}");
	});

	it("sees the value a declaration rule produced", async () => {
		const rules = [
			{
				type: "declaration",
				match: ({ property }) => property === "header",
				transform: () => ({ property: "content", value: "shout(hi)" }),
			},
			upper,
		];
		expect(await run(rules, "p { header: x; }")).toBe("p{content:\"HI\"}");
	});
});

describe("the pseudo walker", () => {
	const rules = [
		{
			type: "pseudo",
			match: ({ kind, name }) => kind === "element" && name === "marker",
			transform: () => ({ selector: "[data-marker]::marker" }),
		},
	];

	it("replaces the part without disturbing its compound", async () => {
		expect(await run(rules, ".a::marker { color: red }")).toBe(
			".a[data-marker]::marker{color:red}",
		);
	});

	it("matches the whole part, not a substring of it", async () => {
		expect(await run(rules, ".a::markerish { color: red }")).toBe(
			".a::markerish{color:red}",
		);
	});

	it("reaches selectors nested in a functional pseudo-class", async () => {
		expect(await run(rules, "p:not(.a::marker) { color: red }")).toBe(
			"p:not(.a[data-marker]::marker){color:red}",
		);
	});

	it("reports kind and args", async () => {
		const seen = [];
		const probe = [
			{
				type: "pseudo",
				match: (ctx) => {
					seen.push([ctx.kind, ctx.name, ctx.args]);
					return false;
				},
				transform: () => null,
			},
		];
		await run(probe, "a:nth-child(2n+1)::before { color: red }");
		expect(seen).toEqual([
			["class", "nth-child", ["2n+1"]],
			["element", "before", null],
		]);
	});

	it("drops a part on remove", async () => {
		const drop = [
			{ type: "pseudo", match: ({ name }) => name === "hover", transform: () => ({ remove: true }) },
		];
		expect(await run(drop, "a:hover { color: red }")).toBe("a{color:red}");
	});
});

describe("the selector walker", () => {
	const rules = [
		{
			type: "selector",
			match: ({ selector }) => selector.includes(":nth-page("),
			transform: ({ selector }) => ({
				selector: selector.replace(/:nth-page\(([^)]*)\)/g, ":nth-of-type($1)"),
			}),
		},
	];

	it("rewrites a whole selector", async () => {
		expect(await run(rules, "paged-page:nth-page(2n) { color: red }")).toBe(
			"paged-page:nth-of-type(2n){color:red}",
		);
	});

	it("gives a later rule the rewritten selector", async () => {
		const chained = [
			...rules,
			{
				type: "selector",
				match: ({ selector }) => selector.includes(":nth-of-type("),
				transform: ({ selector }) => ({ selector: `${selector}[data-nth]` }),
			},
		];
		expect(await run(chained, "paged-page:nth-page(2n) { color: red }")).toBe(
			"paged-page:nth-of-type(2n)[data-nth]{color:red}",
		);
	});
});

describe("the unified rule context", () => {
	it("hands match and transform the same object", async () => {
		const seen = [];
		const rules = [
			{
				type: "declaration",
				match: (ctx) => {
					seen.push(ctx);
					return true;
				},
				transform: (ctx) => {
					seen.push(ctx);
					return null;
				},
			},
		];
		await run(rules, "p { color: red; }");
		expect(seen).toHaveLength(2);
		expect(seen[0]).toBe(seen[1]);
	});

	it("carries node, item and list on every type", async () => {
		const captured = {};
		const probe = (type) => ({
			type,
			match: (ctx) => {
				captured[type] ??= ctx;
				return false;
			},
			transform: () => null,
		});
		const rules = [
			"declaration",
			"function",
			"at-rule",
			"media-query",
			"rule",
			"selector",
			"pseudo",
			"url",
		].map(probe);

		const transformer = new CssTransformer({ rules });
		const ast = await transformer.prepare([
			{
				css: "@media print { a:hover { background: url(\"x.png\") shout(hi); } }",
				cssBaseURL: "https://example.com/s.css",
			},
		]);
		transformer.apply(ast);

		for (const type of Object.keys(captured)) {
			expect(captured[type], type).toHaveProperty("node");
			expect(captured[type], type).toHaveProperty("item");
			expect(captured[type], type).toHaveProperty("list");
		}
		expect(Object.keys(captured).sort()).toEqual([
			"at-rule",
			"declaration",
			"function",
			"media-query",
			"pseudo",
			"rule",
			"selector",
			"url",
		]);
	});

	it("refreshes ctx for an in-place edit and stops on a structural one", async () => {
		const order = [];
		const rules = [
			{
				type: "declaration",
				match: ({ property }) => property === "a",
				transform: () => ({ property: "b" }),
			},
			{
				type: "declaration",
				match: ({ property }) => {
					order.push(property);
					return property === "b";
				},
				transform: () => ({ declarations: [{ property: "c", value: "1" }] }),
			},
			{
				type: "declaration",
				match: ({ property }) => {
					order.push(`after:${property}`);
					return false;
				},
				transform: () => null,
			},
		];
		expect(await run(rules, "p { a: 1; }")).toBe("p{c:1}");
		expect(order).toEqual(["b"]);
	});

	it("removes a declaration on remove", async () => {
		const rules = [
			{ type: "declaration", match: ({ property }) => property === "gone", transform: () => ({ remove: true }) },
		];
		expect(await run(rules, "p { gone: 1; color: red; }")).toBe("p{color:red}");
	});

	it("drops a rule whose last selector is removed", async () => {
		const rules = [
			{ type: "selector", match: ({ selector }) => selector === ".x", transform: () => ({ remove: true }) },
		];
		expect(await run(rules, ".x { color: red } .y { color: blue }")).toBe(".y{color:blue}");
		expect(await run(rules, ".x, .y { color: red }")).toBe(".y{color:red}");
	});

	it("rewrites a rule prelude and lets a later rule see it", async () => {
		const rules = [
			{
				type: "rule",
				match: ({ selector }) => selector === ".a",
				transform: () => ({ selector: ".b" }),
			},
			{
				type: "rule",
				match: ({ selector }) => selector === ".b",
				transform: ({ selector }) => ({ selector: `${selector}.c` }),
			},
		];
		expect(await run(rules, ".a { color: red }")).toBe(".b.c{color:red}");
	});

	it("applies removeDeclarations and prependDeclarations before converting", async () => {
		const rules = [
			{
				type: "at-rule",
				match: ({ name }) => name === "widget",
				transform: () => ({
					selector: ".widget",
					removeDeclarations: ["size"],
					prependDeclarations: [{ property: "page", value: "cover" }],
				}),
			},
		];
		expect(await run(rules, "@widget { size: A4; color: red; }")).toBe(
			".widget{page:cover;color:red}",
		);
	});
});


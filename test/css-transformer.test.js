import { test, expect } from "./browser-fixture.js";

test.describe("CssTransformer", () => {
	test("keeps each instance's rules to itself", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			const renameRule = (from, to) => ({
				type: "declaration",
				match: ({ property }) => property === from,
				transform: () => ({ property: to }),
			});
			const a = new CssTransformer({ rules: [renameRule("color", "--a")] });
			const b = new CssTransformer({ rules: [renameRule("color", "--b")] });
			const fromA = csstree.generate(a.apply(await a.prepare("p { color: red; }")));
			const fromB = csstree.generate(b.apply(await b.prepare("p { color: red; }")));
			__results.push({ actual: fromA, args: ["p{--a:red}"], label: undefined });
			__results.push({ actual: fromB, args: ["p{--b:red}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("runs a walker only when rules of its type exist", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			async function run(rules, css, cssBaseURL) {
				const transformer = new CssTransformer({ rules });
				const ast = await transformer.prepare([{ css, cssBaseURL }]);
				return csstree.generate(transformer.apply(ast));
			}
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
			__results.push({ actual: declarationMatches, args: [1], label: undefined });
			declarationMatches = 0;
			await run([], "p { color: red; }");
			__results.push({ actual: declarationMatches, args: [0], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("rebases urls in a top-level sheet with no url rules", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			async function run(rules, css, cssBaseURL) {
				const transformer = new CssTransformer({ rules });
				const ast = await transformer.prepare([{ css, cssBaseURL }]);
				return csstree.generate(transformer.apply(ast));
			}
			const out = await run(
				[],
				"p { background: url(\"img/a.png\"); }",
				"https://example.com/css/book.css",
			);
			__results.push({ actual: out, args: ["https://example.com/css/img/a.png"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toContain(...results[0].args);
	});

	test("lets a url rule rewrite the already-rebased url", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			async function run(rules, css, cssBaseURL) {
				const transformer = new CssTransformer({ rules });
				const ast = await transformer.prepare([{ css, cssBaseURL }]);
				return csstree.generate(transformer.apply(ast));
			}
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
			__results.push({ actual: out, args: ["https://example.com/css/img/a.png?v=1"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toContain(...results[0].args);
	});

	test("converts an at-rule that returns a selector into a style rule", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
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
			__results.push({ actual: node.type, args: ["Rule"], label: undefined });
			__results.push({ actual: node.name, args: [], label: undefined });
			__results.push({ actual: csstree.generate(node.prelude), args: ["& [data-widget]"], label: undefined });
			__results.push({ actual: csstree.generate(ast), args: ["& [data-widget]{color:red}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBeUndefined(...results[1].args);
		expect(results[2].actual, results[2].label).toBe(...results[2].args);
		expect(results[3].actual, results[3].label).toBe(...results[3].args);
	});

	test("stops at the rule that converted an at-rule", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
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
			__results.push({ actual: laterCalls, args: [0], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("still walks a converted at-rule's block", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
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
			__results.push({ actual: csstree.generate(ast), args: [".outer{&::part(inner){color:red}}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("rewrites a function anywhere in a value", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			async function run(rules, css, cssBaseURL) {
				const transformer = new CssTransformer({ rules });
				const ast = await transformer.prepare([{ css, cssBaseURL }]);
				return csstree.generate(transformer.apply(ast));
			}
			const upper = {
				type: "function",
				match: ({ name }) => name === "shout",
				transform: ({ args }) => ({ value: `"${args[0].toUpperCase()}"` }),
			};
			const out = await run([upper], "p { content: shout(hi) \" and \" shout(bye); }");
			__results.push({ actual: out, args: ["p{content:\"HI\"\" and \"\"BYE\"}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("splits arguments on top-level commas only", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			async function run(rules, css, cssBaseURL) {
				const transformer = new CssTransformer({ rules });
				const ast = await transformer.prepare([{ css, cssBaseURL }]);
				return csstree.generate(transformer.apply(ast));
			}
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
			__results.push({ actual: seen, args: [["attr(href)", "page", "\"a, b\""]], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toEqual(...results[0].args);
	});

	test("exposes the owning declaration so a rule can scope itself", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			async function run(rules, css, cssBaseURL) {
				const transformer = new CssTransformer({ rules });
				const ast = await transformer.prepare([{ css, cssBaseURL }]);
				return csstree.generate(transformer.apply(ast));
			}
			const rules = [
				{
					type: "function",
					match: ({ name, declaration }) =>
						name === "shout" && declaration.property === "content",
					transform: () => ({ value: "\"yes\"" }),
				},
			];
			__results.push({ actual: await run(rules, "p { content: shout(a); width: shout(a); }"), args: ["p{content:\"yes\";width:shout(a)}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("exposes the enclosing rule and full selector inside nested at-rules", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			async function run(rules, css, cssBaseURL) {
				const transformer = new CssTransformer({ rules });
				const ast = await transformer.prepare([{ css, cssBaseURL }]);
				return csstree.generate(transformer.apply(ast));
			}
			let seen = null;
			const rules = [
				{
					type: "function",
					match: (ctx) => {
						if (ctx.name === "generated") seen = ctx;
						return false;
					},
					transform: () => null,
				},
			];
			await run(
				rules,
				"@media print { .chapter, .appendix { content: generated(title); } }",
			);
			__results.push({ actual: seen.selector, args: [".chapter,.appendix"], label: undefined });
			__results.push({ actual: seen.rule.type, args: ["Rule"], label: undefined });
			__results.push({ actual: csstree.generate(seen.rule.prelude), args: [seen.selector], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
		expect(results[2].actual, results[2].label).toBe(...results[2].args);
	});

	test("appends metadata for multiple functions without reprocessing it", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			async function run(rules, css, cssBaseURL) {
				const transformer = new CssTransformer({ rules });
				const ast = await transformer.prepare([{ css, cssBaseURL }]);
				return csstree.generate(transformer.apply(ast));
			}
			const generatedRules = () => {
				let nextId = 0;
				return [
					{
						type: "function",
						match: ({ name }) => name === "generated",
						transform: ({ value }) => {
							const id = nextId++;
							return {
								value: `var(--paged-generated-${id}, "")`,
								declarations: [
									{
										property: `--paged-generated-${id}-source`,
										value,
									},
								],
							};
						},
					},
				];
			};
			let matches = 0;
			const [generated] = generatedRules();
			const rules = [
				{
					...generated,
					match: (ctx) => {
						const matched = generated.match(ctx);
						if (matched) matches++;
						return matched;
					},
				},
			];
			__results.push({ actual: await run(
				rules,
				".chapter, .appendix { content: generated(one) \" / \" generated(two); color: red; }",
			), args: [".chapter,.appendix{content:var(--paged-generated-0, \"\")\" / \"var(--paged-generated-1, \"\");color:red;--paged-generated-0-source:generated(one);--paged-generated-1-source:generated(two)}"], label: undefined });
			__results.push({ actual: matches, args: [2], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("keeps companion declarations in a nested at-rule block", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			async function run(rules, css, cssBaseURL) {
				const transformer = new CssTransformer({ rules });
				const ast = await transformer.prepare([{ css, cssBaseURL }]);
				return csstree.generate(transformer.apply(ast));
			}
			const generatedRules = () => {
				let nextId = 0;
				return [
					{
						type: "function",
						match: ({ name }) => name === "generated",
						transform: ({ value }) => {
							const id = nextId++;
							return {
								value: `var(--paged-generated-${id}, "")`,
								declarations: [
									{
										property: `--paged-generated-${id}-source`,
										value,
									},
								],
							};
						},
					},
				];
			};
			__results.push({ actual: await run(
				generatedRules(),
				"@page { @top-center { content: generated(title); color: red; } }",
			), args: ["@page{@top-center{content:var(--paged-generated-0, \"\");color:red;--paged-generated-0-source:generated(title)}}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("scopes generated occurrence ids to each stylesheet build", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			async function run(rules, css, cssBaseURL) {
				const transformer = new CssTransformer({ rules });
				const ast = await transformer.prepare([{ css, cssBaseURL }]);
				return csstree.generate(transformer.apply(ast));
			}
			const generatedRules = () => {
				let nextId = 0;
				return [
					{
						type: "function",
						match: ({ name }) => name === "generated",
						transform: ({ value }) => {
							const id = nextId++;
							return {
								value: `var(--paged-generated-${id}, "")`,
								declarations: [
									{
										property: `--paged-generated-${id}-source`,
										value,
									},
								],
							};
						},
					},
				];
			};
			const css = "p { content: generated(one) generated(two); }";
			const first = await run(generatedRules(), css);
			const second = await run(generatedRules(), css);
			__results.push({ actual: second, args: [first], label: undefined });
			__results.push({ actual: first, args: ["--paged-generated-0-source"], label: undefined });
			__results.push({ actual: first, args: ["--paged-generated-1-source"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toContain(...results[1].args);
		expect(results[2].actual, results[2].label).toContain(...results[2].args);
	});

	test("drops a function on remove", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			async function run(rules, css, cssBaseURL) {
				const transformer = new CssTransformer({ rules });
				const ast = await transformer.prepare([{ css, cssBaseURL }]);
				return csstree.generate(transformer.apply(ast));
			}
			const rules = [
				{ type: "function", match: ({ name }) => name === "gone", transform: () => ({ remove: true }) },
			];
			__results.push({ actual: await run(rules, "p { content: gone(x); }"), args: ["p{content:}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("sees the value a declaration rule produced", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			async function run(rules, css, cssBaseURL) {
				const transformer = new CssTransformer({ rules });
				const ast = await transformer.prepare([{ css, cssBaseURL }]);
				return csstree.generate(transformer.apply(ast));
			}
			const upper = {
				type: "function",
				match: ({ name }) => name === "shout",
				transform: ({ args }) => ({ value: `"${args[0].toUpperCase()}"` }),
			};
			const rules = [
				{
					type: "declaration",
					match: ({ property }) => property === "header",
					transform: () => ({ property: "content", value: "shout(hi)" }),
				},
				upper,
			];
			__results.push({ actual: await run(rules, "p { header: x; }"), args: ["p{content:\"HI\"}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("replaces the part without disturbing its compound", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			async function run(rules, css, cssBaseURL) {
				const transformer = new CssTransformer({ rules });
				const ast = await transformer.prepare([{ css, cssBaseURL }]);
				return csstree.generate(transformer.apply(ast));
			}
			const rules = [
				{
					type: "pseudo",
					match: ({ kind, name }) => kind === "element" && name === "marker",
					transform: () => ({ selector: "[data-marker]::marker" }),
				},
			];
			__results.push({ actual: await run(rules, ".a::marker { color: red }"), args: [".a[data-marker]::marker{color:red}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("matches the whole part, not a substring of it", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			async function run(rules, css, cssBaseURL) {
				const transformer = new CssTransformer({ rules });
				const ast = await transformer.prepare([{ css, cssBaseURL }]);
				return csstree.generate(transformer.apply(ast));
			}
			const rules = [
				{
					type: "pseudo",
					match: ({ kind, name }) => kind === "element" && name === "marker",
					transform: () => ({ selector: "[data-marker]::marker" }),
				},
			];
			__results.push({ actual: await run(rules, ".a::markerish { color: red }"), args: [".a::markerish{color:red}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("reaches selectors nested in a functional pseudo-class", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			async function run(rules, css, cssBaseURL) {
				const transformer = new CssTransformer({ rules });
				const ast = await transformer.prepare([{ css, cssBaseURL }]);
				return csstree.generate(transformer.apply(ast));
			}
			const rules = [
				{
					type: "pseudo",
					match: ({ kind, name }) => kind === "element" && name === "marker",
					transform: () => ({ selector: "[data-marker]::marker" }),
				},
			];
			__results.push({ actual: await run(rules, "p:not(.a::marker) { color: red }"), args: ["p:not(.a[data-marker]::marker){color:red}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("reports kind and args", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			async function run(rules, css, cssBaseURL) {
				const transformer = new CssTransformer({ rules });
				const ast = await transformer.prepare([{ css, cssBaseURL }]);
				return csstree.generate(transformer.apply(ast));
			}
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
			__results.push({ actual: seen, args: [[
				["class", "nth-child", ["2n+1"]],
				["element", "before", null],
			]], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toEqual(...results[0].args);
	});

	test("drops a part on remove", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			async function run(rules, css, cssBaseURL) {
				const transformer = new CssTransformer({ rules });
				const ast = await transformer.prepare([{ css, cssBaseURL }]);
				return csstree.generate(transformer.apply(ast));
			}
			const drop = [
				{ type: "pseudo", match: ({ name }) => name === "hover", transform: () => ({ remove: true }) },
			];
			__results.push({ actual: await run(drop, "a:hover { color: red }"), args: ["a{color:red}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("rewrites a whole selector", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			async function run(rules, css, cssBaseURL) {
				const transformer = new CssTransformer({ rules });
				const ast = await transformer.prepare([{ css, cssBaseURL }]);
				return csstree.generate(transformer.apply(ast));
			}
			const rules = [
				{
					type: "selector",
					match: ({ selector }) => selector.includes(":nth-page("),
					transform: ({ selector }) => ({
						selector: selector.replace(/:nth-page\(([^)]*)\)/g, ":nth-of-type($1)"),
					}),
				},
			];
			__results.push({ actual: await run(rules, "paged-page:nth-page(2n) { color: red }"), args: ["paged-page:nth-of-type(2n){color:red}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("gives a later rule the rewritten selector", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			async function run(rules, css, cssBaseURL) {
				const transformer = new CssTransformer({ rules });
				const ast = await transformer.prepare([{ css, cssBaseURL }]);
				return csstree.generate(transformer.apply(ast));
			}
			const rules = [
				{
					type: "selector",
					match: ({ selector }) => selector.includes(":nth-page("),
					transform: ({ selector }) => ({
						selector: selector.replace(/:nth-page\(([^)]*)\)/g, ":nth-of-type($1)"),
					}),
				},
			];
			const chained = [
				...rules,
				{
					type: "selector",
					match: ({ selector }) => selector.includes(":nth-of-type("),
					transform: ({ selector }) => ({ selector: `${selector}[data-nth]` }),
				},
			];
			__results.push({ actual: await run(chained, "paged-page:nth-page(2n) { color: red }"), args: ["paged-page:nth-of-type(2n)[data-nth]{color:red}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("hands match and transform the same object", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			async function run(rules, css, cssBaseURL) {
				const transformer = new CssTransformer({ rules });
				const ast = await transformer.prepare([{ css, cssBaseURL }]);
				return csstree.generate(transformer.apply(ast));
			}
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
			__results.push({ actual: (seen).length, args: [2], label: undefined });
			__results.push({ actual: seen[0], args: [seen[1]], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("carries node, item and list on every type", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
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
				__results.push({ actual: "node" in Object(captured[type]), args: [true], label: type });
				__results.push({ actual: "item" in Object(captured[type]), args: [true], label: type });
				__results.push({ actual: "list" in Object(captured[type]), args: [true], label: type });
			}
			__results.push({ actual: Object.keys(captured).sort(), args: [[
				"at-rule",
				"declaration",
				"function",
				"media-query",
				"pseudo",
				"rule",
				"selector",
				"url",
			]], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
		expect(results[2].actual, results[2].label).toBe(...results[2].args);
		expect(results[3].actual, results[3].label).toEqual(...results[3].args);
	});

	test("refreshes ctx for an in-place edit and stops on a structural one", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			async function run(rules, css, cssBaseURL) {
				const transformer = new CssTransformer({ rules });
				const ast = await transformer.prepare([{ css, cssBaseURL }]);
				return csstree.generate(transformer.apply(ast));
			}
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
			__results.push({ actual: await run(rules, "p { a: 1; }"), args: ["p{c:1}"], label: undefined });
			__results.push({ actual: order, args: [["b"]], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toEqual(...results[1].args);
	});

	test("removes a declaration on remove", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			async function run(rules, css, cssBaseURL) {
				const transformer = new CssTransformer({ rules });
				const ast = await transformer.prepare([{ css, cssBaseURL }]);
				return csstree.generate(transformer.apply(ast));
			}
			const rules = [
				{ type: "declaration", match: ({ property }) => property === "gone", transform: () => ({ remove: true }) },
			];
			__results.push({ actual: await run(rules, "p { gone: 1; color: red; }"), args: ["p{color:red}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("drops a rule whose last selector is removed", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			async function run(rules, css, cssBaseURL) {
				const transformer = new CssTransformer({ rules });
				const ast = await transformer.prepare([{ css, cssBaseURL }]);
				return csstree.generate(transformer.apply(ast));
			}
			const rules = [
				{ type: "selector", match: ({ selector }) => selector === ".x", transform: () => ({ remove: true }) },
			];
			__results.push({ actual: await run(rules, ".x { color: red } .y { color: blue }"), args: [".y{color:blue}"], label: undefined });
			__results.push({ actual: await run(rules, ".x, .y { color: red }"), args: [".y{color:red}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("rewrites a rule prelude and lets a later rule see it", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			async function run(rules, css, cssBaseURL) {
				const transformer = new CssTransformer({ rules });
				const ast = await transformer.prepare([{ css, cssBaseURL }]);
				return csstree.generate(transformer.apply(ast));
			}
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
			__results.push({ actual: await run(rules, ".a { color: red }"), args: [".b.c{color:red}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("applies removeDeclarations and prependDeclarations before converting", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const csstree = await import("css-tree");
			const { CssTransformer } = await import("/src/css-transformer/CssTransformer.js");
			async function run(rules, css, cssBaseURL) {
				const transformer = new CssTransformer({ rules });
				const ast = await transformer.prepare([{ css, cssBaseURL }]);
				return csstree.generate(transformer.apply(ast));
			}
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
			__results.push({ actual: await run(rules, "@widget { size: A4; color: red; }"), args: [".widget{page:cover;color:red}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});
});

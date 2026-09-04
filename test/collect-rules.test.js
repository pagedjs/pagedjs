import { test, expect } from "./browser-fixture.js";

test.describe("collectRules", () => {
	test("puts the core rules first", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { LayoutHandler } = await import("fragmentainers/handlers.js");
			const { coreRules } = await import("/src/print-stylesheet/rules/index.js");
			await import("/src/handlers/running-elements.js");
			const { collectRules } = await import("/src/print-stylesheet/utils/collectRules.js");
			const rule = (id) => ({ type: "declaration", id, match: () => false, transform: () => null });
			const ALPHA = rule("alpha");
			class Alpha extends LayoutHandler {
				static rules = [ALPHA];
			}
			const rules = collectRules([Alpha]);
			__results.push({ actual: rules.slice(0, coreRules.length), args: [coreRules], label: undefined });
			__results.push({ actual: rules.at(-1), args: [ALPHA], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toEqual(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("keeps handler rules in resolved catalog order", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { LayoutHandler } = await import("fragmentainers/handlers.js");
			const { coreRules } = await import("/src/print-stylesheet/rules/index.js");
			await import("/src/handlers/running-elements.js");
			const { collectRules } = await import("/src/print-stylesheet/utils/collectRules.js");
			const rule = (id) => ({ type: "declaration", id, match: () => false, transform: () => null });
			const ALPHA = rule("alpha");
			const BETA = rule("beta");
			class Alpha extends LayoutHandler {
				static rules = [ALPHA];
			}
			class Beta extends LayoutHandler {
				static rules = [BETA];
			}
			__results.push({ actual: collectRules([Alpha, Beta]).slice(coreRules.length), args: [[ALPHA, BETA]], label: undefined });
			__results.push({ actual: collectRules([Beta, Alpha]).slice(coreRules.length), args: [[BETA, ALPHA]], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toEqual(...results[0].args);
		expect(results[1].actual, results[1].label).toEqual(...results[1].args);
	});

	test("contributes nothing for a handler without rules", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { LayoutHandler } = await import("fragmentainers/handlers.js");
			const { coreRules } = await import("/src/print-stylesheet/rules/index.js");
			await import("/src/handlers/running-elements.js");
			const { collectRules } = await import("/src/print-stylesheet/utils/collectRules.js");
			class Plain extends LayoutHandler {}
			__results.push({ actual: collectRules([Plain]), args: [coreRules], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toEqual(...results[0].args);
	});

	test("replaces a base handler's rules with an overriding subclass's", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { LayoutHandler } = await import("fragmentainers/handlers.js");
			const { coreRules } = await import("/src/print-stylesheet/rules/index.js");
			await import("/src/handlers/running-elements.js");
			const { collectRules } = await import("/src/print-stylesheet/utils/collectRules.js");
			const rule = (id) => ({ type: "declaration", id, match: () => false, transform: () => null });
			const ALPHA = rule("alpha");
			const BETA = rule("beta");
			const GAMMA = rule("gamma");
			class Alpha extends LayoutHandler {
				static rules = [ALPHA];
			}
			class Beta extends LayoutHandler {
				static rules = [BETA];
			}
			class OwnRules extends Alpha {
				static rules = [GAMMA];
			}
			const rules = collectRules([Alpha, Beta, OwnRules]);
			__results.push({ actual: rules.slice(coreRules.length), args: [[GAMMA, BETA]], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toEqual(...results[0].args);
	});

	test("inherits the base rules when the subclass declares none", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { LayoutHandler } = await import("fragmentainers/handlers.js");
			const { coreRules } = await import("/src/print-stylesheet/rules/index.js");
			await import("/src/handlers/running-elements.js");
			const { collectRules } = await import("/src/print-stylesheet/utils/collectRules.js");
			const rule = (id) => ({ type: "declaration", id, match: () => false, transform: () => null });
			const ALPHA = rule("alpha");
			class Alpha extends LayoutHandler {
				static rules = [ALPHA];
			}
			class Inheriting extends Alpha {}
			__results.push({ actual: collectRules([Alpha, Inheriting]).slice(coreRules.length), args: [[ALPHA]], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toEqual(...results[0].args);
	});

	test("extends the base rules through super.rules", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { LayoutHandler } = await import("fragmentainers/handlers.js");
			const { coreRules } = await import("/src/print-stylesheet/rules/index.js");
			await import("/src/handlers/running-elements.js");
			const { collectRules } = await import("/src/print-stylesheet/utils/collectRules.js");
			const rule = (id) => ({ type: "declaration", id, match: () => false, transform: () => null });
			const ALPHA = rule("alpha");
			const GAMMA = rule("gamma");
			class Alpha extends LayoutHandler {
				static rules = [ALPHA];
			}
			class Extending extends Alpha {
				static rules = [...super.rules, GAMMA];
			}
			__results.push({ actual: collectRules([Alpha, Extending]).slice(coreRules.length), args: [[ALPHA, GAMMA]], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toEqual(...results[0].args);
	});

	test("runs both rule sets when two siblings subclass the same handler", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { LayoutHandler } = await import("fragmentainers/handlers.js");
			const { coreRules } = await import("/src/print-stylesheet/rules/index.js");
			await import("/src/handlers/running-elements.js");
			const { collectRules } = await import("/src/print-stylesheet/utils/collectRules.js");
			const rule = (id) => ({ type: "declaration", id, match: () => false, transform: () => null });
			const ALPHA = rule("alpha");
			const BETA = rule("beta");
			const GAMMA = rule("gamma");
			class Alpha extends LayoutHandler {
				static rules = [ALPHA];
			}
			class First extends Alpha {
				static rules = [BETA];
			}
			class Second extends Alpha {
				static rules = [GAMMA];
			}
			__results.push({ actual: collectRules([Alpha, First, Second]).slice(coreRules.length), args: [[BETA, GAMMA]], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toEqual(...results[0].args);
	});

	test("leaves position: fixed alone", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { LayoutHandler } = await import("fragmentainers/handlers.js");
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			await import("/src/print-stylesheet/rules/index.js");
			await import("/src/handlers/running-elements.js");
			const { collectRules } = await import("/src/print-stylesheet/utils/collectRules.js");
			const rule = (id) => ({ type: "declaration", id, match: () => false, transform: () => null });
			const ALPHA = rule("alpha");
			const BETA = rule("beta");
			class Alpha extends LayoutHandler {
				static rules = [ALPHA];
			}
			class Beta extends LayoutHandler {
				static rules = [BETA];
			}
			const transformer = new CssTransformer({ rules: collectRules([Alpha, Beta]) });
			const ast = await transformer.prepare(".pin { position: fixed; top: 0; }");
			__results.push({ actual: transformer.generate(transformer.apply(ast)), args: [".pin{position:fixed;top:0}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("projects an element() request onto the margin-box component", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("fragmentainers/handlers.js");
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			await import("/src/print-stylesheet/rules/index.js");
			const { RunningElements } = await import("/src/handlers/running-elements.js");
			const { collectRules } = await import("/src/print-stylesheet/utils/collectRules.js");
			const transformer = new CssTransformer({ rules: collectRules([RunningElements]) });
			const ast = await transformer.prepare(
				"@top-center { content: element(title, last) }",
			);
			__results.push({ actual: transformer.generate(transformer.apply(ast)), args: ["&::part(top-center){--paged-margin-content:\"\";--paged-running-element:title last}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});
});

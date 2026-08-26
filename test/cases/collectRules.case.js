import { describe, it, expect } from "../browser-suite.js";
import * as csstree from "css-tree";
import { LayoutHandler } from "fragmentainers/handlers";
import { CssTransformer } from "/src/css-transformer/CssTransformer.js";
import { coreRules } from "/src/print-stylesheet/rules/index.js";
import { RunningElements } from "/src/handlers/running-elements.js";
import { collectRules } from "/src/print-stylesheet/utils/collectRules.js";

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

class Plain extends LayoutHandler {}

describe("collectRules", () => {
	it("puts the core rules first", () => {
		const rules = collectRules([Alpha]);
		expect(rules.slice(0, coreRules.length)).toEqual(coreRules);
		expect(rules.at(-1)).toBe(ALPHA);
	});

	it("keeps handler rules in resolved catalog order", () => {
		expect(collectRules([Alpha, Beta]).slice(coreRules.length)).toEqual([ALPHA, BETA]);
		expect(collectRules([Beta, Alpha]).slice(coreRules.length)).toEqual([BETA, ALPHA]);
	});

	it("contributes nothing for a handler without rules", () => {
		expect(collectRules([Plain])).toEqual(coreRules);
	});

	it("replaces a base handler's rules with an overriding subclass's", () => {
		class OwnRules extends Alpha {
			static rules = [GAMMA];
		}

		const rules = collectRules([Alpha, Beta, OwnRules]);
		expect(rules.slice(coreRules.length)).toEqual([GAMMA, BETA]);
	});

	it("inherits the base rules when the subclass declares none", () => {
		class Inheriting extends Alpha {}

		expect(collectRules([Alpha, Inheriting]).slice(coreRules.length)).toEqual([ALPHA]);
	});

	it("extends the base rules through super.rules", () => {
		class Extending extends Alpha {
			static rules = [...super.rules, GAMMA];
		}

		expect(collectRules([Alpha, Extending]).slice(coreRules.length)).toEqual([ALPHA, GAMMA]);
	});

	// Resolution keys on `instanceof`, and `B.prototype instanceof A` is false
	// for siblings, so both take a slot and both rule sets run.
	it("runs both rule sets when two siblings subclass the same handler", () => {
		class First extends Alpha {
			static rules = [BETA];
		}
		class Second extends Alpha {
			static rules = [GAMMA];
		}

		expect(collectRules([Alpha, First, Second]).slice(coreRules.length)).toEqual([BETA, GAMMA]);
	});

	it("leaves position: fixed alone", async () => {
		const transformer = new CssTransformer({ rules: collectRules([Alpha, Beta]) });
		const ast = await transformer.prepare(".pin { position: fixed; top: 0; }");
		expect(csstree.generate(transformer.apply(ast))).toBe(".pin{position:fixed;top:0}");
	});

	// The request has to land on the box and the content on its ::before, so
	// the box's computed style is where `<paged-page>` reads the selection.
	it("splits an element() request off the margin box content", async () => {
		const transformer = new CssTransformer({ rules: collectRules([RunningElements]) });
		const ast = await transformer.prepare(
			"@top-center { content: element(title, last) }",
		);
		expect(csstree.generate(transformer.apply(ast))).toBe(
			"&::part(top-center){--paged-running-element:title last}"
				+ "&::part(top-center)::before{content:\"\"}",
		);
	});
});

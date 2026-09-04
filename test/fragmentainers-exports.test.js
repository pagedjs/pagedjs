import { readFileSync } from "node:fs";
import { test, expect } from "./browser-fixture.js";

const exportsBySpecifier = {
	"fragmentainers": [
		"ConstraintSpace", "Fragmenter", "LayoutHandler", "LayoutPassLimitError",
		"PageResolver", "RegionResolver",
	],
	"fragmentainers/fragmentation.js": [
		"BlockBreakToken", "BreakScore", "BreakToken", "CloneMap", "ConstraintSpace",
		"CounterSnapshot", "CounterState", "EarlyBreak", "FlowContext", "Fragment",
		"FragmentFlow", "FragmentationContext", "Fragmenter", "InlineBreakToken",
		"LayoutPassLimitError", "FRAGMENTATION_NONE", "FRAGMENTATION_PAGE",
		"FRAGMENTATION_COLUMN", "FRAGMENTATION_REGION", "createFragments",
		"findChildBreakToken", "locate", "parseCounterDirective", "walkFragmentTree",
	],
	"fragmentainers/layout.js": [
		"AnonymousBlockNode", "DOMLayoutNode", "FlowThreadNode", "LayoutNode",
		"LayoutRequest", "buildCumulativeHeights", "createFragments",
		"getLayoutAlgorithm", "getMonolithicBlockSize", "isMonolithic", "runLayoutGenerator",
	],
	"fragmentainers/algorithms.js": [
		"BlockContainerAlgorithm", "FlexAlgorithm", "GridAlgorithm",
		"InlineContentAlgorithm", "MulticolAlgorithm", "TableRowAlgorithm",
		"resolveColumnDimensions",
	],
	"fragmentainers/styles.js": ["computedStyleMap", "parseNumeric", "toPx"],
	"fragmentainers/components.js": [
		"ContentMeasureElement", "FragPseudoElement", "FragmentContainerElement", "pseudoFor",
	],
	"fragmentainers/resolvers.js": [
		"PageResolver", "PageRule", "RegionConstraints", "RegionResolver",
	],
	"fragmentainers/handlers.js": [
		"BodyRewriter", "EmulatePrintPixelRatio", "FixedPosition", "FragPseudoElement",
		"HandlerRegistry", "LayoutHandler", "MutationSync", "PageFloat", "PseudoElements",
		"RepeatedTableHeader", "StyleResolver", "defaultHandlers", "isPseudoElement",
		"markNativePseudo", "markPersistent", "pseudoFor", "resolveHandlerClasses",
	],
};

test("maps Fragmentainers using only its root and source prefix", async ({ page }) => {
	const imports = await page.evaluate(() => {
		const map = JSON.parse(document.querySelector("script[type=importmap]").textContent);
		return Object.fromEntries(Object.entries(map.imports).filter(([key]) =>
			key === "fragmentainers" || key.startsWith("fragmentainers/")));
	});
	expect(imports).toEqual({
		"fragmentainers": "/node_modules/fragmentainers/src/index.js",
		"fragmentainers/": "/node_modules/fragmentainers/src/",
	});
});

test("publishes only the root and explicit .js subpaths", () => {
	const manifest = JSON.parse(readFileSync(
		new URL("../node_modules/fragmentainers/package.json", import.meta.url), "utf8",
	));
	const expected = Object.fromEntries(Object.keys(exportsBySpecifier).map((specifier) => {
		const subpath = specifier.slice("fragmentainers".length);
		return subpath ? [`.${subpath}`, `./src${subpath}`] : [".", "./src/index.js"];
	}));
	expect(manifest.exports).toEqual(expected);
});

for (const [specifier, names] of Object.entries(exportsBySpecifier)) {
	test(`imports ${specifier} from the static server`, async ({ page }) => {
		const actual = await page.evaluate(async (name) => {
			const module = await import(name);
			return Object.keys(module).sort();
		}, specifier);
		expect(actual).toEqual([...names].sort());
	});
}

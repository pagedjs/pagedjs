import csstree from "css-tree";
import Following from "./following.js";

function processRule(selector) {
	let stylesheet = csstree.parse(`${selector} { color: red; }`);
	let ruleItem = stylesheet.children.head;
	let following = new Following(null, { styleSheet: {} }, null);

	following.onRule(ruleItem.data, ruleItem, stylesheet.children);

	return { stylesheet: csstree.generate(stylesheet), selectors: following.selectors };
}

describe("Following", () => {
	it.each(["td:nth-last-child(-n+3)", "tr:nth-child(2n + 1)"])(
		"keeps %s in the stylesheet",
		(selector) => {
			let result = processRule(selector);
			expect(result.stylesheet).toContain(selector.replace(/\s+/g, ""));
			expect(result.selectors).toEqual({});
		}
	);

	it.each([
		"tr + tr",
		"tr:nth-child(2n + 1) + tr",
		"li:nth-child(2n + 1 of .a + .b)",
		":has(> strong + code)"
	])(
		"handles the adjacent sibling combinator in %s",
		(selector) => {
			let result = processRule(selector);
			expect(result.stylesheet).toBe("");
			expect(Object.keys(result.selectors)).toHaveLength(1);
		}
	);
});

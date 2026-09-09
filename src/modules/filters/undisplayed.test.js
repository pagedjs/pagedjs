import csstree from "css-tree";
import UndisplayedFilter from "./undisplayed.js";

describe("UndisplayedFilter", () => {
	function filterElement(style, css) {
		const content = document.createElement("div");
		const element = document.createElement("section");
		element.className = "chapter";
		if (style !== undefined) {
			element.setAttribute("style", style);
		}
		content.appendChild(element);
		const filter = new UndisplayedFilter();
		if (css) {
			const rule = csstree.parse(css).children.first();
			filter.onDeclaration(rule.block.children.first(), null, null, { ruleNode: rule });
		}
		filter.filter(content);
		return element;
	}

	it.each(["", "padding: 24px", "color: red", "display: block"])(
		"does not mark visible inline styles as undisplayed: %s",
		(style) => {
			expect(filterElement(style).hasAttribute("data-undisplayed")).toBe(false);
		}
	);

	it("marks inline display: none as undisplayed", () => {
		expect(filterElement("display: none").dataset.undisplayed).toBe("undisplayed");
	});

	it.each([undefined, "padding: 24px"])("preserves stylesheet display: none with inline style %s", (style) => {
		expect(filterElement(style, ".chapter { display: none }").dataset.undisplayed).toBe("undisplayed");
	});

	it("preserves an inline display override of a normal stylesheet rule", () => {
		expect(filterElement("display: block", ".chapter { display: none }").hasAttribute("data-undisplayed")).toBe(false);
	});
});

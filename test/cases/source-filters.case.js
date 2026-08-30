import { describe, it, expect } from "../browser-suite.js";
import { SourceFilters } from "/src/handlers/source-filters.js";

/** Parse content the way PagedPreview parses a content string. */
function parse(html) {
	const template = document.createElement("template");
	template.innerHTML = html;
	return template.content;
}

function comments(root) {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
	const found = [];
	for (let node = walker.nextNode(); node; node = walker.nextNode()) {
		found.push(node.data);
	}
	return found;
}

describe("source filters", () => {
	it("removes script elements at every depth", () => {
		// Script text counts toward textContent, so the second assertion fails
		// if a script survives anywhere.
		const content = parse(
			"<script>dropped</script><div><p>keep</p><script>dropped</script></div>",
		);

		new SourceFilters().prepareContent(content);

		expect(content.querySelectorAll("script")).toHaveLength(0);
		expect(content.textContent).toBe("keep");
	});

	it("removes every comment, not just the first", () => {
		const content = parse("<!--a--><div><!--b--><p>x<!--c-->y</p></div>");

		new SourceFilters().prepareContent(content);

		expect(comments(content)).toEqual([]);
		expect(content.textContent).toBe("xy");
	});

	it("leaves nothing to remove when a rebuild re-enters the hook", () => {
		const content = parse("<div><!--gone--><script>dropped</script><p>keep</p></div>");

		// A rebuild constructs fresh handler instances over the same nodes, so
		// no state from the first pass survives into the second.
		new SourceFilters().prepareContent(content);
		new SourceFilters().prepareContent(content);

		expect(content.querySelectorAll("script")).toHaveLength(0);
		expect(comments(content)).toEqual([]);
		expect(content.textContent).toBe("keep");
	});
});

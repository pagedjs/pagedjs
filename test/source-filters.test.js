import { test, expect } from "./browser-fixture.js";

test.describe("source filters", () => {
	test("removes script elements at every depth", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { SourceFilters } = await import("/src/handlers/source-filters.js");
			function parse(html) {
				const template = document.createElement("template");
				template.innerHTML = html;
				return template.content;
			}
			const content = parse(
				"<script>dropped</script><div><p>keep</p><script>dropped</script></div>",
			);
			new SourceFilters().prepareContent(content);
			__results.push({ actual: (content.querySelectorAll("script")).length, args: [0], label: undefined });
			__results.push({ actual: content.textContent, args: ["keep"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("removes every comment, not just the first", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { SourceFilters } = await import("/src/handlers/source-filters.js");
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
			const content = parse("<!--a--><div><!--b--><p>x<!--c-->y</p></div>");
			new SourceFilters().prepareContent(content);
			__results.push({ actual: comments(content), args: [[]], label: undefined });
			__results.push({ actual: content.textContent, args: ["xy"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toEqual(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("leaves nothing to remove when a rebuild re-enters the hook", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { SourceFilters } = await import("/src/handlers/source-filters.js");
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
			const content = parse("<div><!--gone--><script>dropped</script><p>keep</p></div>");
			new SourceFilters().prepareContent(content);
			new SourceFilters().prepareContent(content);
			__results.push({ actual: (content.querySelectorAll("script")).length, args: [0], label: undefined });
			__results.push({ actual: comments(content), args: [[]], label: undefined });
			__results.push({ actual: content.textContent, args: ["keep"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toEqual(...results[1].args);
		expect(results[2].actual, results[2].label).toBe(...results[2].args);
	});
});

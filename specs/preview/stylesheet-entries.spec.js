import { test, expect } from "./harness-fixture.js";

const HREF = "/specs/preview/fixtures/linked.css";

test("fetches stylesheet entries given as hrefs", async ({ page }) => {
	const result = await page.evaluate(async (href) => {
		const { PrintStyleSheet } = window.Paged;
		const sheet = await PrintStyleSheet.fromEntries([
			href,
			{ href },
			{ css: "em { color: rgb(4, 5, 6); }" },
		]);
		return {
			rules: [...sheet.cssRules].map((rule) => rule.cssText),
			pageData: sheet.toJSON().length,
		};
	}, HREF);

	const colors = result.rules.filter((text) => text.includes("color"));
	expect(colors).toEqual([
		"p { margin: 0px; color: rgb(1, 2, 3); }",
		"p { margin: 0px; color: rgb(1, 2, 3); }",
		"em { color: rgb(4, 5, 6); }",
	]);
	expect(result.pageData).toBe(2);
});

test("skips an entry whose href cannot be resolved", async ({ page }) => {
	const result = await page.evaluate(async (href) => {
		const { PrintStyleSheet } = window.Paged;
		const warnings = [];
		const warn = console.warn;
		console.warn = (...args) => warnings.push(args.join(" "));
		try {
			const sheet = await PrintStyleSheet.fromEntries(["http://[unresolvable", href]);
			return {
				rules: [...sheet.cssRules].map((rule) => rule.cssText),
				warnings,
			};
		} finally {
			console.warn = warn;
		}
	}, HREF);

	expect(result.rules.some((text) => text.includes("rgb(1, 2, 3)"))).toBe(true);
	expect(result.warnings.join(" ")).toContain("Invalid stylesheet URL");
});

test("renders content from stylesheets passed as hrefs", async ({ page }) => {
	const result = await page.evaluate(async (href) => {
		const { PagedPreview } = window.Paged;
		const previewer = new PagedPreview();
		await previewer.preview("<p>hello</p>", [href], document.body);
		const styles = getComputedStyle(previewer.pages[0]);
		const out = {
			width: styles.width,
			color: getComputedStyle(previewer.querySelector("p")).color,
		};
		previewer.destroy();
		return out;
	}, HREF);

	expect(result).toEqual({ width: "300px", color: "rgb(1, 2, 3)" });
});

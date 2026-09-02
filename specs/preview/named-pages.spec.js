import { test, expect } from "./harness-fixture.js";

const CSS = `
	@page { size: 300px 200px; margin: 0; }
	@page chapter { margin: 0; }
	section { page: chapter; }
	p { margin: 0; height: 60px; }
`;

test("names every page a named section spans, not just the one it starts on", async ({
	page,
}) => {
	const names = await page.evaluate(async (css) => {
		const { PagedPreview } = window.Paged;
		const previewer = new PagedPreview();
		const content = `<section>${"<p>x</p>".repeat(12)}</section>`;
		await previewer.preview(content, [{ css }], document.body);
		const out = previewer.pages.map((pagedPage) => pagedPage.getAttribute("name"));
		previewer.destroy();
		return out;
	}, CSS);

	expect(names.length).toBeGreaterThan(1);
	expect(names.every((name) => name === "chapter")).toBe(true);
});

test("drops the name again on the pages after the named section", async ({ page }) => {
	const names = await page.evaluate(async (css) => {
		const { PagedPreview } = window.Paged;
		const previewer = new PagedPreview();
		const content = `<section>${"<p>x</p>".repeat(6)}</section><div>${"<p>y</p>".repeat(6)}</div>`;
		await previewer.preview(content, [{ css }], document.body);
		const out = previewer.pages.map((pagedPage) => pagedPage.getAttribute("name"));
		previewer.destroy();
		return out;
	}, CSS);

	expect(names[0]).toBe("chapter");
	expect(names[names.length - 1]).toBe(null);
});

test("keeps the name while a single tall child of the section spans pages", async ({ page }) => {
	const names = await page.evaluate(async (css) => {
		const { PagedPreview } = window.Paged;
		const previewer = new PagedPreview();
		const content = "<section><div style=\"height: 700px\">tall</div></section>";
		await previewer.preview(content, [{ css }], document.body);
		const out = previewer.pages.map((pagedPage) => pagedPage.getAttribute("name"));
		previewer.destroy();
		return out;
	}, CSS);

	expect(names.length).toBeGreaterThan(1);
	expect(names.every((name) => name === "chapter")).toBe(true);
});

import { test, expect } from "./harness-fixture.js";

test("sizes pages from a page box that declares a unitless zero bleed", async ({ page }) => {
	const result = await page.evaluate(async () => {
		const { PagedPreview } = window.Paged;
		const css = "@page { size: 216mm 279mm; bleed: 0; margin: 10mm; } p { margin: 0; }";
		const previewer = new PagedPreview();
		await previewer.preview("<p>hello</p>", [{ css }], document.body);
		const styles = getComputedStyle(previewer.pages[0]);
		const out = {
			width: styles.width,
			height: styles.height,
			bleed: styles.getPropertyValue("--paged-bleed").trim(),
		};
		previewer.destroy();
		return out;
	});

	// 216mm x 279mm at 96dpi, not the auto size an invalid calc() collapses to.
	expect(Math.round(parseFloat(result.width))).toBe(816);
	expect(Math.round(parseFloat(result.height))).toBe(1054);
	expect(result.bleed).toBe("0px");
});

test("adds the declared bleed to both edges of the sheet", async ({ page }) => {
	const result = await page.evaluate(async () => {
		const { PagedPreview } = window.Paged;
		const css = "@page { size: 100px 200px; bleed: 5px; margin: 0; } p { margin: 0; }";
		const previewer = new PagedPreview();
		await previewer.preview("<p>hello</p>", [{ css }], document.body);
		const styles = getComputedStyle(previewer.pages[0]);
		const out = { width: styles.width, height: styles.height };
		previewer.destroy();
		return out;
	});

	expect(result).toEqual({ width: "110px", height: "210px" });
});

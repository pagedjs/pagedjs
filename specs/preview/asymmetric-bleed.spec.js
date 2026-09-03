import { test, expect } from "./harness-fixture.js";

test("applies asymmetric bleed to preview and physical page rules", async ({ page }) => {
	const result = await page.evaluate(async () => {
		const { PagedPreview } = window.Paged;
		const css = `
			@page { size: 6in 9in; margin: 0; bleed: 10mm; }
			@page :left { bleed: 0.125in 0in 0.125in 0.125in; }
			@page :right { bleed: 0.125in 0.125in 0.125in 0in; }
			section { break-after: page; }
		`;
		const previewer = new PagedPreview();
		await previewer.preview(
			"<section>right</section><section>left</section>",
			[{ css }],
			document.body,
		);
		await previewer.document.updateComplete;
		const pages = previewer.pages.map((pagedPage) => {
			const styles = getComputedStyle(pagedPage);
			return {
				width: styles.width,
				height: styles.height,
				top: styles.getPropertyValue("--paged-bleed-top").trim(),
				right: styles.getPropertyValue("--paged-bleed-right").trim(),
				bottom: styles.getPropertyValue("--paged-bleed-bottom").trim(),
				left: styles.getPropertyValue("--paged-bleed-left").trim(),
			};
		});
		const pageStyle = document.querySelector("style[data-pagedjs-ignore]")?.textContent;
		previewer.destroy();
		return { pages, pageStyle };
	});

	expect(result.pages).toEqual([
		{
			width: "588px",
			height: "888px",
			top: "0.125in",
			right: "0.125in",
			bottom: "0.125in",
			left: "0in",
		},
		{
			width: "588px",
			height: "888px",
			top: "0.125in",
			right: "0in",
			bottom: "0.125in",
			left: "0.125in",
		},
	]);
	expect(result.pageStyle).toContain(
		"@page :left { margin: 0; size: calc(0.125in + 6in + 0in) calc(0.125in + 9in + 0.125in); }",
	);
	expect(result.pageStyle).toContain(
		"@page :right { margin: 0; size: calc(0in + 6in + 0.125in) calc(0.125in + 9in + 0.125in); }",
	);
});

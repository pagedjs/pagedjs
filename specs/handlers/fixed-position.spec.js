import { test, expect } from "../preview/harness-fixture.js";

const CSS = `
@page { size: 300px 200px; margin: 0; }
p { margin: 0; }
.pin { position: fixed; top: 0; right: 0; }
`;

test("position: fixed survives the transform and repeats on every page", async ({
	page,
}) => {
	const result = await page.evaluate(async (css) => {
		const { PagedPreview } = window.Paged;
		const lines = Array.from({ length: 40 }, (_, i) => `<p>line ${i}</p>`).join("");
		const previewer = new PagedPreview();
		await previewer.preview(
			`<div class="pin">pinned</div>${lines}`,
			[{ css }],
			document.body,
		);
		const res = {
			pages: previewer.pages.length,
			pinned: previewer.querySelectorAll(".pin").length,
			claimed: previewer.textContent.startsWith("line 0"),
		};
		previewer.destroy();
		return res;
	}, CSS);

	expect(result.pages).toBeGreaterThan(1);
	expect(result.pinned).toBe(result.pages);
	expect(result.claimed).toBe(true);
});

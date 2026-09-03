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

test("nested fixed subtrees repeat across forced-break segments", async ({ page }) => {
	const result = await page.evaluate(async () => {
		const { PagedPreview } = window.Paged;
		const css = `
			@page { size: 300px 200px; margin: 0; }
			section { break-before: page; }
			.pin { position: fixed; top: 0; right: 0; }
		`;
		const previewer = new PagedPreview();
		await previewer.preview(
			`<section><div class="pin">pinned <span data-fixed-child>child</span></div><p>one</p></section>
			<section><p>two</p></section>
			<section><p>three</p></section>
			<section><p>four</p></section>`,
			[{ css }],
			document.body,
		);
		const pages = [...previewer.querySelectorAll("paged-page")];
		const res = {
			pages: pages.length,
			pins: pages.map((printedPage) => printedPage.querySelectorAll(".pin").length),
			children: pages.map(
				(printedPage) => printedPage.querySelectorAll("[data-fixed-child]").length,
			),
			positions: pages.map(
				(printedPage) => getComputedStyle(printedPage.querySelector(".pin")).position,
			),
			rightAligned: pages.map((printedPage) => {
				const pin = printedPage.querySelector(".pin");
				const pinRect = pin.getBoundingClientRect();
				const pageRect = pin.parentElement.getBoundingClientRect();
				return Math.abs(pageRect.right - pinRect.right) < 1;
			}),
			intrinsicWidth: pages.map((printedPage) => {
				const pin = printedPage.querySelector(".pin");
				return pin.getBoundingClientRect().width < pin.parentElement.getBoundingClientRect().width;
			}),
		};
		previewer.destroy();
		return res;
	});

	expect(result.pages).toBe(4);
	expect(result.pins).toEqual([1, 1, 1, 1]);
	expect(result.children).toEqual([1, 1, 1, 1]);
	expect(result.positions).toEqual(["absolute", "absolute", "absolute", "absolute"]);
	expect(result.rightAligned).toEqual([true, true, true, true]);
	expect(result.intrinsicWidth).toEqual([true, true, true, true]);
});

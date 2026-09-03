import { test, expect } from "./harness-fixture.js";

test("projects margin-box styles and content onto the component", async ({
	page,
}) => {
	const result = await page.evaluate(async () => {
		const { PagedPreview } = window.Paged;
		const css = `
			@page {
				size: 300px 200px;
				margin: 40px;
				@top-center {
					background-color: rgb(12, 34, 56);
					content: "Margin title";
				}
			}
			p { margin: 0; }
		`;
		const previewer = new PagedPreview();
		await previewer.preview("<p>body</p>", [{ css }], document.body);

		const pagedPage = previewer.pages[0];
		await pagedPage.updateComplete;
		const margins = pagedPage.shadowRoot.querySelector("paged-margins");
		await margins.updateComplete;
		const box = margins.shadowRoot.querySelector("#top-center");
		const boxStyle = getComputedStyle(box);
		const generated = box.shadowRoot.querySelector(".generated");
		const beforeStyle = getComputedStyle(generated, "::before");
		const output = {
			backgroundColor: boxStyle.backgroundColor,
			boxContent: boxStyle.getPropertyValue("--paged-margin-content"),
			beforeContent: beforeStyle.content,
		};

		previewer.destroy();
		return output;
	});

	expect(result).toEqual({
		backgroundColor: "rgb(12, 34, 56)",
		boxContent: "\"Margin title\"",
		beforeContent: "\"Margin title\"",
	});
});

test("resolves page counters inside component-generated margin content", async ({ page }) => {
	await page.evaluate(async () => {
		const { PagedPreview } = window.Paged;
		const previewer = new PagedPreview();
		await previewer.preview(
			"<p>body</p>",
			[{ css: "@page { size: 300px 200px; margin: 40px; @top-center { content: \"Page \" counter(page); } }" }],
			document.body,
		);
	});

	const session = await page.context().newCDPSession(page);
	const snapshot = await session.send("DOMSnapshot.captureSnapshot", { computedStyles: [] });
	const text = snapshot.documents[0].layout.text
		.map((index) => snapshot.strings[index])
		.join(" ");
	expect(text).toMatch(/Page\s+1/);
});

import { test, expect } from "./harness-fixture.js";

test("projects margin-box styles onto the box and content onto ::before", async ({
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
		const beforeStyle = getComputedStyle(box, "::before");
		const output = {
			backgroundColor: boxStyle.backgroundColor,
			boxContent: boxStyle.content,
			beforeContent: beforeStyle.content,
		};

		previewer.destroy();
		return output;
	});

	expect(result).toEqual({
		backgroundColor: "rgb(12, 34, 56)",
		boxContent: "normal",
		beforeContent: "\"Margin title\"",
	});
});

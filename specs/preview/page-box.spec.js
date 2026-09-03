import { test, expect } from "./harness-fixture.js";

test("renders page padding and borders inside the page margins", async ({ page }) => {
	const result = await page.evaluate(async () => {
		const { PagedPreview } = window.Paged;
		const css = `
			@page {
				size: 600px 800px;
				margin: 50px;
				padding: 20px;
				border: 5px solid red;
			}
			html, body, p { margin: 0; padding: 0; }
		`;
		const previewer = new PagedPreview();
		await previewer.preview("<p>page content</p>", [{ css }], document.body);
		const pagedPage = previewer.pages[0];
		await pagedPage.updateComplete;
		const pageBox = pagedPage.shadowRoot.querySelector(".page-box");
		const pageArea = pagedPage.pageArea;
		const content = pagedPage.contentArea;
		const hostStyle = getComputedStyle(pagedPage);
		const boxStyle = getComputedStyle(pageBox);
		const dimensions = (element) => {
			const rect = element.getBoundingClientRect();
			return { width: rect.width, height: rect.height };
		};
		const output = {
			host: {
				paddingTop: hostStyle.paddingTop,
				borderTopWidth: hostStyle.borderTopWidth,
			},
			pageBox: dimensions(pageBox),
			pageArea: dimensions(pageArea),
			content: dimensions(content),
			decoration: {
				boxSizing: boxStyle.boxSizing,
				paddingTop: boxStyle.paddingTop,
				borderTopWidth: boxStyle.borderTopWidth,
				borderTopStyle: boxStyle.borderTopStyle,
				borderTopColor: boxStyle.borderTopColor,
			},
		};
		previewer.destroy();
		return output;
	});

	expect(result).toEqual({
		host: { paddingTop: "0px", borderTopWidth: "0px" },
		pageBox: { width: 500, height: 700 },
		pageArea: { width: 450, height: 650 },
		content: { width: 450, height: 650 },
		decoration: {
			boxSizing: "border-box",
			paddingTop: "20px",
			borderTopWidth: "5px",
			borderTopStyle: "solid",
			borderTopColor: "rgb(255, 0, 0)",
		},
	});
});

test("uses padding and borders when choosing page breaks", async ({ page }) => {
	const result = await page.evaluate(async () => {
		const { PagedPreview } = window.Paged;
		const css = `
			@page {
				size: 200px 200px;
				margin: 0;
				padding: 20px;
				border: 5px solid;
			}
			html, body, .block { margin: 0; padding: 0; }
			.block { height: 80px; }
		`;
		const previewer = new PagedPreview();
		await previewer.preview(
			"<div class=\"block\">one</div><div class=\"block\">two</div>",
			[{ css }],
			document.body,
		);
		const output = {
			pages: previewer.pages.length,
			contentArea: previewer.pages[0].contentArea.constraints.contentArea,
		};
		previewer.destroy();
		return output;
	});

	expect(result.pages).toBe(2);
	expect(result.contentArea).toEqual({ inlineSize: 150, blockSize: 150 });
});

test("cascades named and first-page decoration into layout and rendering", async ({
	page,
}) => {
	const result = await page.evaluate(async () => {
		const { PagedPreview } = window.Paged;
		const css = `
			@page {
				size: 300px 300px;
				margin: 0;
				padding: 10px;
				border: 2px solid black;
			}
			@page chapter:first {
				padding-left: 30px;
				border-top-width: 7px;
				border-top-color: blue;
			}
			html, body, section { margin: 0; padding: 0; }
			section { page: chapter; }
		`;
		const previewer = new PagedPreview();
		await previewer.preview("<section>chapter</section>", [{ css }], document.body);
		const pagedPage = previewer.pages[0];
		await pagedPage.updateComplete;
		const pageBoxStyle = getComputedStyle(
			pagedPage.shadowRoot.querySelector(".page-box"),
		);
		const constraints = pagedPage.contentArea.constraints;
		const output = {
			name: pagedPage.name,
			padding: constraints.padding,
			borderWidths: constraints.borderWidths,
			contentArea: constraints.contentArea,
			paint: {
				paddingLeft: pageBoxStyle.paddingLeft,
				borderTopWidth: pageBoxStyle.borderTopWidth,
				borderTopColor: pageBoxStyle.borderTopColor,
			},
		};
		previewer.destroy();
		return output;
	});

	expect(result).toEqual({
		name: "chapter",
		padding: { top: 10, right: 10, bottom: 10, left: 30 },
		borderWidths: { top: 7, right: 2, bottom: 2, left: 2 },
		contentArea: { inlineSize: 256, blockSize: 271 },
		paint: {
			paddingLeft: "30px",
			borderTopWidth: "7px",
			borderTopColor: "rgb(0, 0, 255)",
		},
	});
});

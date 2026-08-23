import { test, expect } from "./harness-fixture.js";

test.describe("page component plumbing", () => {
	test("named first-page marks render before preview resolves", async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { PagedPreview } = window.Paged;
			const css = `
				@page { size: 300px 200px; margin: 0; }
				@page chapter:first { bleed: 3px; marks: crop cross; }
				p { page: chapter; margin: 0; }
			`;
			const previewer = new PagedPreview();
			await previewer.preview("<p>chapter</p>", [{ css }], document.body);

			const pagedPage = previewer.pages[0];
			const output = {
				name: pagedPage.name,
				first: pagedPage.matches(":state(first)"),
				cropMarks: pagedPage.shadowRoot.querySelectorAll(".paged-crop").length,
				crossMarks: pagedPage.shadowRoot.querySelectorAll(".paged-cross").length,
			};
			previewer.destroy();
			return output;
		});

		expect(result).toEqual({
			name: "chapter",
			first: true,
			cropMarks: 4,
			crossMarks: 4,
		});
	});

	test("blank-page marks reach the component", async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { PagedPreview } = window.Paged;
			const css = `
				@page { size: 300px 200px; margin: 0; }
				@page :blank { bleed: 3px; marks: crop; }
				p { margin: 0; }
				.force-right { break-before: right; }
			`;
			const previewer = new PagedPreview();
			await previewer.preview(
				"<p>first</p><p class=\"force-right\">third</p>",
				[{ css }],
				document.body,
			);

			const blank = previewer.pages.find((pagedPage) => pagedPage.blank);
			const output = {
				isBlank: blank?.matches(":state(blank)") ?? false,
				cropMarks: blank?.shadowRoot.querySelectorAll(".paged-crop").length ?? 0,
			};
			previewer.destroy();
			return output;
		});

		expect(result).toEqual({ isBlank: true, cropMarks: 4 });
	});

	test("page and pages counters are configured when preview resolves", async ({
		page,
	}) => {
		const result = await page.evaluate(async () => {
			const { PagedPreview } = window.Paged;
			const css = `
				@page { size: 300px 200px; margin: 0; }
				p { margin: 0; }
				p + p { break-before: page; }
			`;
			const previewer = new PagedPreview();
			await previewer.preview("<p>one</p><p>two</p>", [{ css }], document.body);

			const pages = previewer.pages;
			const output = {
				count: previewer.document.style.getPropertyValue("--paged-page-count"),
				indexes: pages.map((pagedPage) => pagedPage.getAttribute("index")),
				documentReset: getComputedStyle(previewer.document).counterReset,
				pageIncrements: pages.map(
					(pagedPage) => getComputedStyle(pagedPage).counterIncrement,
				),
			};
			previewer.destroy();
			return output;
		});

		expect(result.count).toBe("2");
		expect(result.indexes).toEqual(["0", "1"]);
		expect(result.documentReset).toContain("page 0");
		expect(result.documentReset).toContain("pages 2");
		expect(result.pageIncrements).toEqual(["page 1", "page 1"]);
	});

	test("page accessors expose slotted content and its footnote area", async ({
		page,
	}) => {
		const result = await page.evaluate(async () => {
			const pagedPage = document.createElement("paged-page");
			const content = document.createElement("fragment-container");
			const footnotes = document.createElement("div");
			footnotes.setAttribute("data-footnote-area", "");
			content.appendChild(footnotes);
			pagedPage.appendChild(content);
			document.body.appendChild(pagedPage);
			await pagedPage.updateComplete;

			const output = {
				contentArea: pagedPage.contentArea === content,
				footnotesArea: pagedPage.footnotesArea === footnotes,
			};
			pagedPage.remove();
			return output;
		});

		expect(result).toEqual({ contentArea: true, footnotesArea: true });
	});
});

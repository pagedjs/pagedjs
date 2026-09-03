import { test, expect } from "./harness-fixture.js";

const CSS = `
@page {
	size: 400px 400px;
	margin: 0;

	@footnote {
		border-top: 2px solid rgb(0, 128, 0);
		padding-top: 8px;
	}
}
p { margin: 0; }
.fn { float: footnote; }
::footnote-call { color: rgb(220, 20, 60); }
`;

const CONTENT = "<p>Main text<span class=\"fn\">Footnote body text</span></p>";

async function render(page, css) {
	return page.evaluate(
		async ({ css, content }) => {
			const { PagedPreview } = window.Paged;
			const previewer = new PagedPreview();
			await previewer.preview(content, [{ css }], document.body);

			const area = previewer.querySelector("[data-footnote-area]");
			const call = previewer.querySelector("[data-footnote-call]");
			const body = area?.querySelector("[data-footnote-marker]") ?? null;
			const areaStyle = area && getComputedStyle(area);
			const callStyle = call && getComputedStyle(call, "::after");
			const result = {
				hasArea: area !== null,
				keepsClass: area ? area.classList.contains("footnote-area") : false,
				borderTop: areaStyle
					? [
						areaStyle.borderTopWidth,
						areaStyle.borderTopStyle,
						areaStyle.borderTopColor,
					].join(" ")
					: "",
				paddingTop: areaStyle ? areaStyle.paddingTop : "",
				areaText: area ? area.textContent : "",
				callColor: callStyle ? callStyle.color : "",
				bodyDisplay: body ? getComputedStyle(body).display : "",
				footnoteDisplay: body?.getAttribute("data-footnote-display") ?? "",
			};
			previewer.destroy();
			return result;
		},
		{ css, content: CONTENT },
	);
}

test.describe("author footnote CSS through the preview pipeline", () => {
	test("@footnote styles the rendered footnote area", async ({ page }) => {
		const result = await render(page, CSS);
		expect(result.hasArea).toBe(true);
		expect(result.keepsClass).toBe(true);
		expect(result.borderTop).toBe("2px solid rgb(0, 128, 0)");
		expect(result.paddingTop).toBe("8px");
		expect(result.areaText).toContain("Footnote body text");
	});

	test("::footnote-call styles the generated call marker", async ({ page }) => {
		const result = await render(page, CSS);
		expect(result.callColor).toBe("rgb(220, 20, 60)");
	});

	test("footnote-display controls the rendered body", async ({ page }) => {
		const result = await render(
			page,
			CSS.replace("float: footnote;", "float: footnote; footnote-display: inline;"),
		);
		expect(result.bodyDisplay).toContain("inline");
		expect(result.footnoteDisplay).toBe("inline");
	});

	test("the @footnotes spelling is accepted as an alias", async ({ page }) => {
		const result = await render(page, CSS.replace("@footnote {", "@footnotes {"));
		expect(result.hasArea).toBe(true);
		expect(result.borderTop).toBe("2px solid rgb(0, 128, 0)");
	});
});

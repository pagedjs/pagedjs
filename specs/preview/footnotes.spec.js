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
p > span#main-note.fn[data-call-style="accent"]::footnote-call {
	color: rgb(220, 20, 60);
	font-size: 30px;
	font-weight: 700;
}
`;

const CONTENT =
	"<p>Main text<span id=\"main-note\" class=\"fn\" data-call-style=\"accent\">Footnote body text</span></p>";

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
				callDisplay: call ? getComputedStyle(call).display : "",
				callFontSize: callStyle ? callStyle.fontSize : "",
				callFontWeight: callStyle ? callStyle.fontWeight : "",
				callTag: call?.tagName ?? "",
				callID: call?.id ?? "",
				callStyleName: call?.getAttribute("data-call-style") ?? "",
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

	test("compound-qualified ::footnote-call styles the generated call marker", async ({
		page,
	}) => {
		const result = await render(page, CSS);
		expect(result.callColor).toBe("rgb(220, 20, 60)");
		expect(result.callDisplay).not.toBe("none");
		expect(result.callFontSize).toBe("30px");
		expect(result.callFontWeight).toBe("700");
		expect(result.callTag).toBe("SPAN");
		expect(result.callID).toBe("main-note");
		expect(result.callStyleName).toBe("accent");
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

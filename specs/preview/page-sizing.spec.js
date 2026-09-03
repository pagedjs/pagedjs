import { test, expect } from "./harness-fixture.js";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { PDF_SETTINGS } from "../test_helpers/constants.js";

test("maps default-sized components one-to-one onto Letter PDF pages", async ({ page }) => {
	const result = await page.evaluate(async () => {
		const { PagedPreview } = window.Paged;
		const css = "#first { break-after: page; }";
		const previewer = new PagedPreview();
		await previewer.preview(
			"<div id=\"first\">first</div><div>second</div>",
			[{ css }],
			document.body,
		);
		await previewer.document.updateComplete;
		window.pageSizingPreviewer = previewer;
		return {
			pageCount: previewer.pages.length,
			pages: previewer.pages.map((pagedPage) => {
				const styles = getComputedStyle(pagedPage);
				return { width: styles.width, height: styles.height };
			}),
			pageStyle: document.querySelector("style[data-pagedjs-ignore]")?.textContent,
		};
	});

	const pdfBuffer = await page.pdf(PDF_SETTINGS);
	const pdf = await getDocument({ data: new Uint8Array(pdfBuffer) }).promise;
	try {
		const sizes = [];
		for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
			const pdfPage = await pdf.getPage(pageNumber);
			const viewport = pdfPage.getViewport({ scale: 1 });
			sizes.push({ width: viewport.width, height: viewport.height });
		}

		expect(result.pageCount).toBe(2);
		expect(result.pages).toEqual([
			{ width: "816px", height: "1056px" },
			{ width: "816px", height: "1056px" },
		]);
		expect(result.pageStyle).toContain("size: 8.5in 11in");
		expect(sizes).toEqual([
			{ width: 612, height: 792 },
			{ width: 612, height: 792 },
		]);
	} finally {
		await pdf.destroy();
		await page.evaluate(() => {
			window.pageSizingPreviewer.destroy();
			delete window.pageSizingPreviewer;
		});
	}
});

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

test("uses the auto bleed when crop marks are present", async ({ page }) => {
	const result = await page.evaluate(async () => {
		const { PagedPreview } = window.Paged;
		const css = "@page { size: 100px 200px; margin: 0; marks: crop cross; } p { margin: 0; }";
		const previewer = new PagedPreview();
		await previewer.preview("<p>hello</p>", [{ css }], document.body);
		const pagedPage = previewer.pages[0];
		await pagedPage.updateComplete;
		const styles = getComputedStyle(pagedPage);
		const output = {
			width: styles.width,
			height: styles.height,
			bleed: styles.getPropertyValue("--paged-bleed").trim(),
			cropMarks: pagedPage.shadowRoot.querySelectorAll(".paged-crop").length,
			crossMarks: pagedPage.shadowRoot.querySelectorAll(".paged-cross").length,
			pageStyle: document.querySelector("style[data-pagedjs-ignore]")?.textContent,
		};
		previewer.destroy();
		return output;
	});

	expect(result).toMatchObject({
		width: "116px",
		height: "216px",
		bleed: "6pt",
		cropMarks: 4,
		crossMarks: 4,
	});
	expect(result.pageStyle).toContain(
		"size: calc(6pt + 100px + 6pt) calc(6pt + 200px + 6pt)",
	);
});

test("does not replace a cascaded explicit bleed with auto", async ({ page }) => {
	const result = await page.evaluate(async () => {
		const { PagedPreview } = window.Paged;
		const css = `
			@page { size: 100px 200px; margin: 0; bleed: 5px; }
			@page :first { marks: crop cross; }
			p { margin: 0; }
		`;
		const previewer = new PagedPreview();
		await previewer.preview("<p>hello</p>", [{ css }], document.body);
		const pagedPage = previewer.pages[0];
		await pagedPage.updateComplete;
		const styles = getComputedStyle(pagedPage);
		const output = {
			width: styles.width,
			height: styles.height,
			bleed: styles.getPropertyValue("--paged-bleed").trim(),
			cropMarks: pagedPage.shadowRoot.querySelectorAll(".paged-crop").length,
			crossMarks: pagedPage.shadowRoot.querySelectorAll(".paged-cross").length,
		};
		previewer.destroy();
		return output;
	});

	expect(result).toEqual({
		width: "110px",
		height: "210px",
		bleed: "5px",
		cropMarks: 4,
		crossMarks: 4,
	});
});

test("resolves explicit auto against cascaded marks", async ({ page }) => {
	const result = await page.evaluate(async () => {
		const { PagedPreview } = window.Paged;
		const css = `
			@page { size: 100px 200px; margin: 0; marks: crop; }
			@page :first { bleed: auto; }
			p { margin: 0; }
		`;
		const previewer = new PagedPreview();
		await previewer.preview("<p>hello</p>", [{ css }], document.body);
		const pagedPage = previewer.pages[0];
		await pagedPage.updateComplete;
		const styles = getComputedStyle(pagedPage);
		const output = {
			width: styles.width,
			height: styles.height,
			bleed: styles.getPropertyValue("--paged-bleed").trim(),
			cropMarks: pagedPage.shadowRoot.querySelectorAll(".paged-crop").length,
		};
		previewer.destroy();
		return output;
	});

	expect(result).toEqual({
		width: "116px",
		height: "216px",
		bleed: "6pt",
		cropMarks: 4,
	});
});

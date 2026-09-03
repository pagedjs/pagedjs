import { test, expect } from "../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../test_helpers/constants.js";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";


test.describe("bleed", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("custom-bleeds/custom-bleeds.html");
	});


	test("should render text", async () => {
		let text = await page.evaluate(() => document.body.textContent);
		expect(text).toContain("Chapter 1. Loomings.");
	});

	test("should render 16 pages", async () => {
		let pages = await page.$$eval("paged-page", (r) => r.length);
		expect(pages).toBe(16);
	});

	test("should apply asymmetric bleed to right and left pages", async () => {
		const pages = await page.$$eval("paged-page", (elements) =>
			elements.slice(0, 2).map((element) => {
				const styles = getComputedStyle(element);
				return {
					width: styles.width,
					height: styles.height,
					top: styles.getPropertyValue("--paged-bleed-top").trim(),
					right: styles.getPropertyValue("--paged-bleed-right").trim(),
					bottom: styles.getPropertyValue("--paged-bleed-bottom").trim(),
					left: styles.getPropertyValue("--paged-bleed-left").trim(),
				};
			}),
		);

		expect(pages).toEqual([
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

		const pageStyle = await page.$eval(
			"style[data-pagedjs-ignore]",
			(style) => style.textContent,
		);
		expect(pageStyle).toContain(
			"@page :left { margin: 0; size: calc(0.125in + 6in + 0in) calc(0.125in + 9in + 0.125in); }",
		);
		expect(pageStyle).toContain(
			"@page :right { margin: 0; size: calc(0in + 6in + 0.125in) calc(0.125in + 9in + 0.125in); }",
		);
	});

	test("should print one component per asymmetric sheet", async () => {
		const componentCount = await page.locator("paged-page").count();
		const pdfBuffer = await page.pdf(PDF_SETTINGS);
		const pdf = await getDocument({ data: new Uint8Array(pdfBuffer) }).promise;
		try {
			const sizes = [];
			for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
				const pdfPage = await pdf.getPage(pageNumber);
				const viewport = pdfPage.getViewport({ scale: 1 });
				sizes.push({ width: viewport.width, height: viewport.height });
			}

			expect(pdf.numPages).toBe(componentCount);
			expect(sizes).toHaveLength(componentCount);
			for (const size of sizes) {
				expect(size.width).toBeCloseTo(441, 0);
				expect(size.height).toBe(666);
			}
		} finally {
			await pdf.destroy();
		}
	});

	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

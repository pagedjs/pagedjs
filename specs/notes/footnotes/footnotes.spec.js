import { test, expect } from "../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("footnotes", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("notes/footnotes/footnotes.html");
	});


	test("should render 14 pages", async () => {
		let pages = await page.$$eval("paged-page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(14);
	});

	test("page 2 footnote", async () => {
		let textContent = await page.$eval("paged-page[index='1']", (r) => r.textContent);

		// callout
		expect(textContent).toContain("Legend");

		// callout
		expect(textContent).toContain("Incunabula");
	});

	test("page 4 long footnote", async () => {
		let textContent = await page.$eval("paged-page[index='3']", (r) => r.textContent);

		// callout
		expect(textContent).toContain("centuries before");

		// footnote
		expect(textContent).toContain("ipse eruditio fiat");
	});

	test("page 5 split footnote", async () => {
		let textContent = await page.$eval("paged-page[index='4']", (r) => r.textContent);

		// callout
		expect(textContent).toContain("Angelo Roccha");

		// footnote
		expect(textContent).toContain("Characteres");
	});

	test("page 6 footnote split from page 5", async () => {
		let textContent = await page.$eval("paged-page[index='5']", (r) => r.textContent);

		// footnote
		expect(textContent).toContain("enim a primis");
	});


	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

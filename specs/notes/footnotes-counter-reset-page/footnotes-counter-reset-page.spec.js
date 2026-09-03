import { test, expect } from "../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("footnotes-counter-reset-page", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("notes/footnotes-counter-reset-page/footnotes-counter-reset-page.html");
	});


	test("should render 6 pages", async () => {
		let pages = await page.$$eval("paged-page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(6);
	});


	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

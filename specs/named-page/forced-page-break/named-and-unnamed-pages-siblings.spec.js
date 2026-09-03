import { test, expect } from "../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("named-and-unnamed-pages-siblings", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("named-page/forced-page-break/named-and-unnamed-pages-siblings.html");
	});


	test("should force a page break between unnamed pages and named pages (4 pages)", async () => {
		let pages = await page.$$eval("paged-page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(4);
	});

	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

import { test, expect } from "../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("copy-column-widths", () => {
	test.skip(true, "Depends on the removed legacy Handler API");
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("tables/copy-column-widths/copy-column-widths.html");
	});


	test.skip("should render 3 pages", async () => {
		let pages = await page.$$eval("paged-page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(3);
	});


	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

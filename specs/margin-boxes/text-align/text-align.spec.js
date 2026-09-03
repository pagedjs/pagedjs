import { test, expect } from "../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("issue", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("margin-boxes/text-align/text-align.html");
	});


	test.skip("should render 6 pages", async () => {
		let pages = await page.$$eval("paged-page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(6);
	});


	if (PDF_REVIEW) {
		test.skip("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

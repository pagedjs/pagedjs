import { test, expect } from "../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("combined", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("page-rules/combined/combined.html");
	});


	test("should render 1 page", async () => {
		let pages = await page.$$eval("paged-page", (r) => {
			return r.length;
		});
		expect(pages).toEqual(1);
	});

	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
});

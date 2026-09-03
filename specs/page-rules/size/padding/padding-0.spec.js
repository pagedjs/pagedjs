import { test, expect } from "../../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../../test_helpers/constants.js";


test.describe("padding-0", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("page-rules/size/padding/padding-0.html");
	});


	test("should render 1 page", async () => {
		let pages = await page.$$eval("paged-page", (r) => r.length);
		expect(pages).toBe(1);
	});

	if (PDF_REVIEW) {
		test.skip("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);
			await expect(pdf).toMatchPdfSnapshot();
		});
	}
});

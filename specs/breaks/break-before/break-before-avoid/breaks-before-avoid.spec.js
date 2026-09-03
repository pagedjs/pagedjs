import { test, expect } from "../../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../../test_helpers/constants.js";


test.describe("break-before-avoid", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("breaks/break-before/break-before-avoid/break-before-avoid.html");
	});


	test("should render 5 pages", async () => {
		let pages = await page.$$eval("paged-page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(5);
	});

	test("page 3 should be Section 2", async () => {
		let text = await page.$eval("paged-page[index='2']", (r) => r.textContent);

		expect(text).toContain("Section 2");
	});

	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

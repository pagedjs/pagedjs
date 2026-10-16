import { test, expect } from "../../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../../test_helpers/constants.js";


test.describe("break-after-avoid", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("breaks/break-after/break-after-avoid/break-after-avoid.html");
	});


	test("should render 5 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(5);
	});

	test("page 3 should be Section 2", async () => {
		let text = await page.$eval("[data-page-number='3']", (r) => r.textContent);

		expect(text).toContain("Section 2");
	});

	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

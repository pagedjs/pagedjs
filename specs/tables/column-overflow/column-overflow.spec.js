import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("column-overflow", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("tables/column-overflow/column-overflow.html");
	});


	test("should render 2 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(2);
	});

	test("page 2 should have wrapped text", async () => {
		let text = await page.$eval("[data-page-number='2']", (r) => r.textContent);

		expect(text).toContain("placeholde1 placeholde2");
	});

	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

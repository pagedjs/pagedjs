import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("first-page", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("page-selector/first-page/first-page.html");
	});


	test("should have a first page class on page 1", async () => {
		let chapter = await page.$eval("[data-page-number='1']", (r) => {
			return r.classList.contains("pagedjs_first_page");
		});

		expect(chapter).toBe(true);
	});

	test("should not give page 2 a first page class", async () => {
		let chapter = await page.$eval("[data-page-number='2']", (r) => {
			return r.classList.contains("pagedjs_first_page");
		});

		expect(chapter).toBe(false);
	});

	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

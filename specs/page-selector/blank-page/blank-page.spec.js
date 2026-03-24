import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("blank-page", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("page-selector/blank-page/blank-page.html");
	});


	test("should have an empty class on page 6", async () => {
		let chapter = await page.$eval("[data-page-number='4']", (r) => {
			return r.classList.contains("pagedjs_blank_page");
		});

		expect(chapter).toBe(true);
	});

	test("should not give page 1 an empty class", async () => {
		let chapter = await page.$eval("[data-page-number='1']", (r) => {
			return r.classList.contains("pagedjs_blank_page");
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

import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("counter-page", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("counters/counter-page/counter-page.html");
	});


	// Unable to read counter values
	test.skip("should have a page number for all pages", async () => {
		let text1 = await page.$eval("[data-page-number='1'] .pagedjs_margin-bottom-left > .pagedjs_margin-content", (r) => window.getComputedStyle(r, "::after").content);
		expect(text1).toContain("1");

		let text2 = await page.$eval("[data-page-number='2'] .pagedjs_margin-bottom-left > .pagedjs_margin-content", (r) => window.getComputedStyle(r, "::after").content);
		expect(text2).toContain("2");

		let text3 = await page.$eval("[data-page-number='3'] .pagedjs_margin-bottom-left > .pagedjs_margin-content", (r) => window.getComputedStyle(r, "::after").content);
		expect(text3).toContain("3");

		let text4 = await page.$eval("[data-page-number='4'] .pagedjs_margin-bottom-left > .pagedjs_margin-content", (r) => window.getComputedStyle(r, "::after").content);
		expect(text4).toContain("4");

		let text5 = await page.$eval("[data-page-number='5'] .pagedjs_margin-bottom-left > .pagedjs_margin-content", (r) => window.getComputedStyle(r, "::after").content);
		expect(text5).toContain("5");

		let text6 = await page.$eval("[data-page-number='6'] .pagedjs_margin-bottom-left > .pagedjs_margin-content", (r) => window.getComputedStyle(r, "::after").content);
		expect(text6).toContain("6");
	});

	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("multiple-named", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("named-page/multiple-named/multiple-named.html");
	});


	test("should put contet and preamble on a single page", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(1);
	});

	test("should put contet and preamble on a page with a green background", async () => {
		let textColor = await page.$eval("#page-1", (pg) => window.getComputedStyle(pg).backgroundColor);

		expect(textColor).toContain("rgb(0, 128, 0)"); // green
	});



	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
});

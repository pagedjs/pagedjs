import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("css is awesome", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("hyphens/awesome/awesome.html");
	});


	test.skip("should render 7 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(7);
	});

	test.skip("page 1 should have a hyphen", async () => {
		let text = await page.$eval("[data-page-number='1']", (r) => r.textContent);

		expect(text).toContain("\u2010");
	});

	test.skip("page 5 should NOT have a hyphen", async () => {
		let text = await page.$eval("[data-page-number='5']", (r) => r.textContent);

		expect(text).not.toContain("\u2010");
	});


	if (!DEBUG) {
		test.skip("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

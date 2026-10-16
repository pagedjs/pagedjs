import { test, expect } from "../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../test_helpers/constants.js";


test.describe("marks", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("marks/marks.html");
	});


	test("should render text", async () => {
		let text = await page.evaluate(() => document.body.textContent);
		expect(text).toContain("Chapter 1. Loomings.");
	});

	test("should render 1 page", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => r.length);
		expect(pages).toBe(1);
	});

	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

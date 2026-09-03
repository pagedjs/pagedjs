import { test, expect } from "../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../test_helpers/constants.js";


test.describe("bleed", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("bleed/bleed.html");
	});


	test("should render text", async () => {
		let text = await page.evaluate(() => document.body.textContent);
		expect(text).toContain("Chapter 1. Loomings.");
	});

	test("should render 14 pages", async () => {
		let pages = await page.$$eval("paged-page", (r) => r.length);
		expect(pages).toBe(7);
	});

	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

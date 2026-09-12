import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("counter-pages", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("counters/nested/nested.html");
	});


	test("should have a reset and increment on first h1", async () => {
		let text = await page.$eval("[data-page-number='1'] .pagedjs_page_content h1", (r) => window.getComputedStyle(r)["counterIncrement"]);
		expect(text).toContain("titleLevel1 1 titleLevel2 0");
	});

	test("should have a increment on first h2", async () => {
		let text = await page.$eval("[data-page-number='1'] .pagedjs_page_content h2", (r) => window.getComputedStyle(r)["counterIncrement"]);
		expect(text).toContain("titleLevel2 1");
	});

	test("should have a reset and increment on first h3", async () => {
		let text = await page.$eval("[data-page-number='2'] .pagedjs_page_content h3", (r) => window.getComputedStyle(r)["counterIncrement"]);
		expect(text).toContain("titleLevel3 1");
	});

	test("should have a reset and increment on last h1", async () => {
		let text = await page.$eval("[data-page-number='7'] .pagedjs_page_content h1", (r) => window.getComputedStyle(r)["counterIncrement"]);
		expect(text).toContain("titleLevel1 1 titleLevel2 -4");
	});

	test("should have a increment on last h2", async () => {
		let text = await page.$eval("[data-page-number='8'] .pagedjs_page_content h2", (r) => window.getComputedStyle(r)["counterIncrement"]);
		expect(text).toContain("titleLevel2 1");
	});

	test("should have a reset and increment on last h3", async () => {
		let text = await page.$eval("[data-page-number='8'] .pagedjs_page_content h3", (r) => window.getComputedStyle(r)["counterIncrement"]);
		expect(text).toContain("titleLevel3 0");
	});

	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

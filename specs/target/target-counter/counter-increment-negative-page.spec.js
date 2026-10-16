import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("counter-increment-negative-page", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("target/target-counter/counter-increment-negative-page.html");
	});


	test("first page should have a page increment of -1", async () => {
		const counterIncrement = await page.$eval("[data-page-number='1']", (element) => window.getComputedStyle(element).counterIncrement);
		expect(counterIncrement).toEqual("page -1");
	});

	if (!DEBUG) {
		test("should create a pdf", async () => {
			const pdf = await page.pdf(PDF_SETTINGS);
			expect(pdf).toMatchPdfSnapshot();
		});
	}
});

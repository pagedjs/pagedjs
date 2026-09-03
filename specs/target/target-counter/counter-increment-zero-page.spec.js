import { test, expect } from "../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("counter-increment-zero-page", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("target/target-counter/counter-increment-zero-page.html");
	});


	test("cover page (first) should have a page increment of 0", async () => {
		const counterIncrement = await page.$eval("paged-page[index='0']", (element) => window.getComputedStyle(element).counterIncrement);
		expect(counterIncrement).toEqual("page 0");
	});

	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			const pdf = await page.pdf(PDF_SETTINGS);
			await expect(pdf).toMatchPdfSnapshot();
		});
	}
});

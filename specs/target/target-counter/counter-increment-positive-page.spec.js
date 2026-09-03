import { test, expect } from "../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("counter-increment-positive-page", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("target/target-counter/counter-increment-positive-page.html");
	});


	test("all pages should have a page increment of 2", async () => {
		const firstPageCounterIncrement = await page.$eval("paged-page[index='0']", (element) => window.getComputedStyle(element).counterIncrement);
		const secondPageCounterIncrement = await page.$eval("paged-page[index='1']", (element) => window.getComputedStyle(element).counterIncrement);
		const thirdPageCounterIncrement = await page.$eval("paged-page[index='2']", (element) => window.getComputedStyle(element).counterIncrement);
		const fourthPageCounterIncrement = await page.$eval("paged-page[index='3']", (element) => window.getComputedStyle(element).counterIncrement);
		expect(firstPageCounterIncrement).toEqual("page 2");
		expect(secondPageCounterIncrement).toEqual("page 2");
		expect(thirdPageCounterIncrement).toEqual("page 2");
		expect(fourthPageCounterIncrement).toEqual("page 2");
	});

	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			const pdf = await page.pdf(PDF_SETTINGS);
			await expect(pdf).toMatchPdfSnapshot();
		});
	}
});

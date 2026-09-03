import { test, expect } from "../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("first-page", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("page-selector/first-page/first-page.html");
	});


	test("should have a first page class on page 1", async () => {
		let chapter = await page.$eval("paged-page[index='0']", (r) => {
			return r.hasAttribute("first");
		});

		expect(chapter).toBe(true);
	});

	test("should not give page 2 a first page class", async () => {
		let chapter = await page.$eval("paged-page[index='1']", (r) => {
			return r.hasAttribute("first");
		});

		expect(chapter).toBe(false);
	});

	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

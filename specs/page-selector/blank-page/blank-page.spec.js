import { test, expect } from "../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("blank-page", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("page-selector/blank-page/blank-page.html");
	});


	test("should mark page 4 as blank", async () => {
		let chapter = await page.$eval("paged-page[index='3']", (r) => {
			return r.hasAttribute("blank");
		});

		expect(chapter).toBe(true);
	});

	test("should not mark page 1 as blank", async () => {
		let chapter = await page.$eval("paged-page[index='0']", (r) => {
			return r.hasAttribute("blank");
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

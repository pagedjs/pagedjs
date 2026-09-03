import { test, expect } from "../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("counter-pages", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("counters/counter-pages/counter-pages.html");
	});


	// Unable to read counter values
	test.skip("should have page numbering", async () => {
		let text = await page.$eval("paged-page[index='0'] .pagedjs_margin-bottom-left > .pagedjs_margin-content", (r) => window.getComputedStyle(r, "::after").content);
		expect(text).toContain("1 / 6");
	});

	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

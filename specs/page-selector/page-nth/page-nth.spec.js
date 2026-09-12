import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("page-nth", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("page-selector/page-nth/page-nth.html");
	});


	test("should have a yellow background on page 6", async () => {
		let textColor = await page.$eval("[data-page-number='3']", (r) => window.getComputedStyle(r).backgroundColor);
		expect(textColor).toContain("rgb(255, 255, 0)"); // yellow
	});

	test("should have bottom center text", async () => {
		let text = await page.$eval("[data-page-number='3'] .pagedjs_margin-bottom-center > .pagedjs_margin-content", (r) => window.getComputedStyle(r, "::after").content);
		expect(text).toContain("3rd page of the document");
	});

	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

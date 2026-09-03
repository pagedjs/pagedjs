import { test, expect, marginBoxStyle } from "../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("page-nth", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("page-selector/page-nth/page-nth.html");
	});


	test("should have a yellow background on page 6", async () => {
		let textColor = await page.$eval("paged-page[index='2']", (r) => window.getComputedStyle(r).backgroundColor);
		expect(textColor).toContain("rgb(255, 255, 0)"); // yellow
	});

	test("should have bottom center text", async () => {
		let text = await marginBoxStyle(
			page,
			3,
			"bottom-center",
			"content",
			"::after",
		);
		expect(text).toContain("3rd page of the document");
	});

	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

import { test, expect, marginBoxStyle } from "../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("vertical-align", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("margin-boxes/vertical-align/vertical-align.html");
	});


	test("Render the top-left at the top", async () => {
		let pages = await marginBoxStyle(page, 1, "top-left", "align-items");

		expect(pages).toEqual("flex-start");
	});


	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

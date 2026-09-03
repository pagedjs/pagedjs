import { test, expect } from "../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("target-counter-single-colon", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("target/target-counter/target-counter-single-colon.html");
	});


	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			const pdf = await page.pdf(PDF_SETTINGS);
			await expect(pdf).toMatchPdfSnapshot();
		});
	}
});

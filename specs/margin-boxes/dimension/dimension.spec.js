import { test, expect } from "../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("margin-box-dimension", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("margin-boxes/dimension/dimension.html");
	});



	if (PDF_REVIEW) {
		test.skip("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

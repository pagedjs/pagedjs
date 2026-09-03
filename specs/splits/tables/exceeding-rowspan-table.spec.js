import { test, expect } from "../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("rowspan uneven table", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("splits/tables/exceeding-rowspan-table.html");
	});


	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
});

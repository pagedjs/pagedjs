import { test, expect, marginBoxStyle } from "../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("vertical-align", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("margin-boxes/vertical-align/vertical-align.html");
	});


	test("Render the top-left at the top", async () => {
		let pages = await marginBoxStyle(page, 1, "top-left", "--paged-margin-vertical-position");

		expect(pages).toEqual("0%");
	});


	test("Render the right-middle in the middle", async () => {
		let pages = await marginBoxStyle(page, 1, "right-middle", "--paged-margin-vertical-position");

		expect(pages).toEqual("50%");
	});


	test("Render the bottom-right at the bottom", async () => {
		let pages = await marginBoxStyle(page, 1, "bottom-right", "--paged-margin-vertical-position");

		expect(pages).toEqual("100%");
	});


	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

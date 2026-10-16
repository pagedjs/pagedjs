import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("vertical-align", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("margin-boxes/vertical-align/vertical-align.html");
	});


	test("Render the top-left at the top", async () => {
		let pages = await page.$eval(".pagedjs_margin-top-left", (r) => {
			return window.getComputedStyle(r)["align-items"];
		});

		expect(pages).toEqual("flex-start");
	});


	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

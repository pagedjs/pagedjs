import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("text-align", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("margin-boxes/style/style.html");
	});


	test("Render the top-left-corner with a crimson background", async () => {
		let pages = await page.$eval(".pagedjs_margin-top-left-corner", (r) => {
			return window.getComputedStyle(r)["background-color"];
		});

		expect(pages).toEqual("rgb(220, 20, 60)");
	});

	test("Render the left-top with a cornflowerblue border", async () => {
		let pages = await page.$eval(".pagedjs_margin-left-top", (r) => {
			return window.getComputedStyle(r)["border-color"];
		});

		expect(pages).toEqual("rgb(100, 149, 237)");
	});


	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

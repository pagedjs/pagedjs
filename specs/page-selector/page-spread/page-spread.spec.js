import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("page-spread", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("page-selector/page-spread/page-spread.html");
	});


	test("should render page 2 as left", async () => {
		let isLeft = await page.$eval("[data-page-number='2']", (r) => {
			return r.classList.contains("pagedjs_left_page");
		});

		expect(isLeft).toEqual(true);
	});

	test("should render page 3 as right", async () => {
		let isRight = await page.$eval("[data-page-number='3']", (r) => {
			return r.classList.contains("pagedjs_right_page");
		});

		expect(isRight).toEqual(true);
	});

	test("should have bottom center text of right on the first page", async () => {
		let text = await page.$eval("[data-page-number='1'] .pagedjs_margin-bottom-center > .pagedjs_margin-content", (r) => window.getComputedStyle(r, "::after").content);
		expect(text).toContain("right");
	});

	test("should have a yellow background on page 6", async () => {
		let color = await page.$eval("[data-page-number='6']", (r) => window.getComputedStyle(r).backgroundColor);
		expect(color).toContain("rgb(255, 255, 0)"); // yellow
	});

	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

import { test, expect } from "../../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../../test_helpers/constants.js";


test.describe("break-after-page", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("breaks/break-after/break-after-page/break-after-page.html");
	});


	test("should render 31 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(31);
	});

	test("should render page 2 as left", async () => {
		let isLeft = await page.$eval("[data-page-number='2']", (r) => {
			return r.classList.contains("pagedjs_left_page");
		});

		expect(isLeft).toEqual(true);
	});

	test("page 3 should be Section 1", async () => {
		let text = await page.$eval("[data-page-number='2']", (r) => r.textContent);

		expect(text).toContain("Section 1");
	});

	test("should render page 4 as left", async () => {
		let isLeft = await page.$eval("[data-page-number='4']", (r) => {
			return r.classList.contains("pagedjs_left_page");
		});

		expect(isLeft).toEqual(true);
	});

	test("page 4 should be Section 2", async () => {
		let text = await page.$eval("[data-page-number='4']", (r) => r.textContent);

		expect(text).toContain("Section 2");
	});

	test("should render page 7 as right", async () => {
		let isRight = await page.$eval("[data-page-number='7']", (r) => {
			return r.classList.contains("pagedjs_right_page");
		});

		expect(isRight).toEqual(true);
	});

	test("page 7 should be Section 3", async () => {
		let text = await page.$eval("[data-page-number='7']", (r) => r.textContent);

		expect(text).toContain("Section 3");
	});

	test("page 8 should break after h2", async () => {
		let text = await page.$eval("[data-page-number='8']", (r) => r.textContent);

		expect(text.trim()).toEqual("A - h2 (inline element)");
	});

	test("should render page 9 as right", async () => {
		let isRight = await page.$eval("[data-page-number='9']", (r) => {
			return r.classList.contains("pagedjs_right_page");
		});

		expect(isRight).toEqual(true);
	});

	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

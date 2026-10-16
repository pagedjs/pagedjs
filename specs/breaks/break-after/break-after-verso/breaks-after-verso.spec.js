import { test, expect } from "../../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../../test_helpers/constants.js";


test.describe("break-after-verso", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("breaks/break-after/break-after-verso/break-after-verso.html");
	});


	test("should render 38 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(38);
	});

	test("should render page 4 as verso", async () => {
		let isLeft = await page.$eval("[data-page-number='4']", (r) => {
			return r.classList.contains("pagedjs_left_page");
		});

		expect(isLeft).toEqual(true);
	});

	test("page 4 should be Section 2", async () => {
		let text = await page.$eval("[data-page-number='4']", (r) => r.textContent);

		expect(text).toContain("Section 2");
	});

	test("should render page 7 as blank", async () => {
		let isBlank = await page.$eval("[data-page-number='7']", (r) => {
			return r.classList.contains("pagedjs_blank_page");
		});

		expect(isBlank).toEqual(true);
	});

	test("should render page 8 as verso", async () => {
		let isLeft = await page.$eval("[data-page-number='8']", (r) => {
			return r.classList.contains("pagedjs_left_page");
		});

		expect(isLeft).toEqual(true);
	});

	test("page 8 should be Section 3", async () => {
		let text = await page.$eval("[data-page-number='8']", (r) => r.textContent);

		expect(text).toContain("Section 3");
	});

	test("page 9 should break after h2", async () => {
		let text = await page.$eval("[data-page-number='9']", (r) => r.textContent);

		expect(text.trim()).toEqual("A - h2 (inline element)");
	});

	test("should render page 10 as verso", async () => {
		let isLeft = await page.$eval("[data-page-number='10']", (r) => {
			return r.classList.contains("pagedjs_left_page");
		});

		expect(isLeft).toEqual(true);
	});

	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

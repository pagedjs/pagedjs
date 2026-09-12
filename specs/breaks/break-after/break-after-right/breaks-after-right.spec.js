import { test, expect } from "../../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../../test_helpers/constants.js";


test.describe("break-after-right", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("breaks/break-after/break-after-right/break-after-right.html");
	});


	test("should render 39 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(39);
	});

	test("should render page 2 as blank", async () => {
		let isBlank = await page.$eval("[data-page-number='2']", (r) => {
			return r.classList.contains("pagedjs_blank_page");
		});

		expect(isBlank).toEqual(true);
	});

	test("should render page 3 as right", async () => {
		let isRight = await page.$eval("[data-page-number='3']", (r) => {
			return r.classList.contains("pagedjs_right_page");
		});

		expect(isRight).toEqual(true);
	});

	test("page 3 should be Section 1", async () => {
		let text = await page.$eval("[data-page-number='3']", (r) => r.textContent);

		expect(text).toContain("Section 1");
	});

	test("should render page 5 as right", async () => {
		let isRight = await page.$eval("[data-page-number='5']", (r) => {
			return r.classList.contains("pagedjs_right_page");
		});

		expect(isRight).toEqual(true);
	});

	test("page 5 should be Section 2", async () => {
		let text = await page.$eval("[data-page-number='5']", (r) => r.textContent);

		expect(text).toContain("Section 2");
	});

	test("should render page 8 as blank", async () => {
		let isBlank = await page.$eval("[data-page-number='8']", (r) => {
			return r.classList.contains("pagedjs_blank_page");
		});

		expect(isBlank).toEqual(true);
	});

	test("should render page 9 as right", async () => {
		let isRight = await page.$eval("[data-page-number='9']", (r) => {
			return r.classList.contains("pagedjs_right_page");
		});

		expect(isRight).toEqual(true);
	});

	test("page 9 should be Section 3", async () => {
		let text = await page.$eval("[data-page-number='9']", (r) => r.textContent);

		expect(text).toContain("Section 3");
	});

	test("page 10 should break after h2", async () => {
		let text = await page.$eval("[data-page-number='10']", (r) => r.textContent);

		expect(text.trim()).toEqual("A - h2 (inline element)");
	});

	test("should render page 11 as right", async () => {
		let isRight = await page.$eval("[data-page-number='11']", (r) => {
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

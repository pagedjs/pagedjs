import { test, expect } from "../../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../../test_helpers/constants.js";


test.describe("first-page-of-page-group", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("page-selector/page-group/first-page-of-page-group/first-page-of-page-group.html");
	});


	test("should not give page 1 a named first page class", async () => {
		let chapter = await page.$eval("[data-page-number='1']", (r) => {
			return r.classList.contains("pagedjs_chapter_first_page");
		});

		expect(chapter).toBe(false);
	});

	test("should have a named first page class on page 2", async () => {
		let chapter = await page.$eval("[data-page-number='2']", (r) => {
			return r.classList.contains("pagedjs_chapter_first_page");
		});

		expect(chapter).toBe(true);
	});

	test("should have bottom center text on page 2", async () => {
		let text = await page.$eval("[data-page-number='2'] .pagedjs_margin-bottom-center > .pagedjs_margin-content", (r) => window.getComputedStyle(r, "::after").content);
		expect(text).toContain("first page of the chapter");
	});

	test("should not give page 3 a named first page class", async () => {
		let chapter = await page.$eval("[data-page-number='3']", (r) => {
			return r.classList.contains("pagedjs_chapter_first_page");
		});

		expect(chapter).toBe(false);
	});

	test("should have a named first page class on page 5", async () => {
		let chapter = await page.$eval("[data-page-number='5']", (r) => {
			return r.classList.contains("pagedjs_chapter_first_page");
		});

		expect(chapter).toBe(true);
	});

	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

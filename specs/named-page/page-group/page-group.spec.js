import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("page-group", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("named-page/page-group/page-group.html");
	});


	test("should render 12 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(12);
	});

	test("should not give page 1 a named class", async () => {
		let chapter = await page.$eval("[data-page-number='1']", (r) => {
			return r.classList.contains("pagedjs_chapter_page");
		});

		expect(chapter).toBe(false);
	});

	test("should give the page 2 a chapter class", async () => {
		let chapter = await page.$eval("[data-page-number='3']", (r) => {
			return r.classList.contains("pagedjs_chapter_page");
		});

		expect(chapter).toBe(true);
	});

	test("should give the page 4 an aside class", async () => {
		let aside = await page.$eval("[data-page-number='4']", (r) => {
			return r.classList.contains("pagedjs_aside_page");
		});

		expect(aside).toBe(true);
	});

	test("should give the page 5 an aside class", async () => {
		let aside = await page.$eval("[data-page-number='5']", (r) => {
			return r.classList.contains("pagedjs_aside_page");
		});

		expect(aside).toBe(true);
	});


	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

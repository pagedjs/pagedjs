import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("named-page", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("named-page/named-page/named-page.html");
	});


	test("should render 8 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(8);
	});

	test("should not give page 1 a named class", async () => {
		let chapter = await page.$eval("[data-page-number='1']", (r) => {
			return r.classList.contains("pagedjs_chapter_page");
		});

		expect(chapter).toBe(false);
	});

	test("should give the page 3 a named class", async () => {
		let chapter = await page.$eval("[data-page-number='3']", (r) => {
			return r.classList.contains("pagedjs_chapter_page");
		});

		expect(chapter).toBe(true);
	});

	test("should give the page 4 a named class", async () => {
		let chapter = await page.$eval("[data-page-number='4']", (r) => {
			return r.classList.contains("pagedjs_chapter_page");
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

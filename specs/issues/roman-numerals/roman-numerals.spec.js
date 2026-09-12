import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("roman-numerals", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("issues/roman-numerals/roman-numerals.html");
	});


	test("should render 5 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});
		expect(pages).toEqual(5);
	});

	test("Preface should be in Roman numerals", async () => {
		let text = await page.$eval("#toc-preface", (r) => window.getComputedStyle(r, "::after").content);
		expect(text).toContain("lower-roman");
	});

	test("First Chapter should be 1", async () => {
		let text = await page.$eval("#toc-first-chapter", (r) => window.getComputedStyle(r, "::after").content);
		expect(text).toContain("counter(target-counter");
	});


	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

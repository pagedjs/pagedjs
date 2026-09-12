import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("footnotes-place", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("notes/footnotes-place/footnotes-place.html");
	});


	test("should render 3 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(3);
	});

	test("should have two callouts on page 1", async () => {
		let callouts = await page.$$eval("[data-page-number='1'] [data-footnote-call]", (r) => r.length);
		expect(callouts).toEqual(2);
	});

	test("should have only one footnote on page 1", async () => {
		let textStart = await page.$eval("[data-page-number='1']", (r) => r.textContent);
		expect(textStart).toContain("Annales Hirsaugienses");
		expect(textStart).not.toContain("Origines");
	});

	test("should place footnote 2 on page 2", async () => {
		let textStart = await page.$eval("[data-page-number='2']", (r) => r.textContent);
		expect(textStart).toContain("Origines");
	});


	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

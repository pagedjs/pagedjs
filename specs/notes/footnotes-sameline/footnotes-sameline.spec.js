import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("footnotes-sameline", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("notes/footnotes-sameline/footnotes-sameline.html");
	});


	test("should render 2 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(2);
	});

	test("should have three callouts on page 1", async () => {
		let callouts = await page.$$eval("[data-page-number='1'] [data-footnote-call]", (r) => r.length);
		expect(callouts).toEqual(3);
	});

	test("should have only 3 footnote on page 1", async () => {
		let callouts = await page.$$eval("[data-page-number='1'] [data-footnote-marker]", (r) => r.length);
		expect(callouts).toEqual(3);
	});


	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

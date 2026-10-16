import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("footnotes padding", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("notes/footnotes-padding/footnotes-padding.html");
	});


	test("should render 6 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(6);
	});

	test("cut the footnote on page 1", async () => {
		let textStart = await page.$eval("[data-page-number='1']", (r) => r.textContent);
		expect(textStart).toContain("The Haarlem Legend of the Invention of Printing by");
		expect(textStart).not.toContain("Lourens Janszoon Coster");
	});


	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("footnotes-styles", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("notes/footnotes-styles/footnotes-styles.html");
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

	test("should have red colored callouts", async () => {
		let color = await page.$eval("[data-page-number='1'] [data-footnote-call]", (r) => window.getComputedStyle(r, "::after").color);
		expect(color).toContain("rgb(255, 0, 0)"); // red
	});

	test("should have 30px font-size for callouts", async () => {
		let size = await page.$eval("[data-page-number='1'] [data-footnote-call]", (r) => window.getComputedStyle(r, "::after").fontSize);
		expect(size).toEqual("30px");
	});

	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

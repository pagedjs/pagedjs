import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("imports", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("issues/imports/imports.html");
	});


	test("should render 6 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(6);
	});

	test("should have a green paragaph 1", async () => {
		let color = await page.$eval("[data-page-number='1'] p:nth-of-type(1)", (r) => window.getComputedStyle(r).color);
		expect(color).toContain("rgb(0, 128, 0)"); // green
	});

	test("should have a yellow paragaph 1", async () => {
		let color = await page.$eval("[data-page-number='1'] p:nth-of-type(2)", (r) => window.getComputedStyle(r).color);
		expect(color).toContain("rgb(255, 255, 0)"); // yellow
	});

	test("should have a orange paragaph 1", async () => {
		let color = await page.$eval("[data-page-number='1'] p:nth-of-type(3)", (r) => window.getComputedStyle(r).color);
		expect(color).toContain("rgb(255, 165, 0)"); // orange
	});

	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

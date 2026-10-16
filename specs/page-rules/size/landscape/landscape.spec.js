import { test, expect } from "../../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../../test_helpers/constants.js";


test.describe("landscape", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("page-rules/size/landscape/landscape.html");
	});


	test("should render 1 page", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(1);
	});

	test("should give the page a width of 210mm", async () => {
		let width = await page.$eval(".pagedjs_page", (r) => {
			return window.getComputedStyle(r).getPropertyValue("--pagedjs-width");
		});

		expect(width).toEqual("210mm");
	});

	test("should give the page a height of 148mm", async () => {
		let width = await page.$eval(".pagedjs_page", (r) => {
			return window.getComputedStyle(r).getPropertyValue("--pagedjs-height");
		});

		expect(width).toEqual("148mm");
	});

	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

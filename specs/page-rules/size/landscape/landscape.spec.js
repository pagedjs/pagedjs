import { test, expect } from "../../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../../test_helpers/constants.js";


test.describe("landscape", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("page-rules/size/landscape/landscape.html");
	});


	test("should render 2 pages", async () => {
		let pages = await page.$$eval("paged-page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(2);
	});

	test("should give the page a width of 210mm", async () => {
		let width = await page.$eval("paged-page", (r) =>
			CSSNumericValue.parse(
				getComputedStyle(r).getPropertyValue("--paged-width"),
			).to("mm").value);

		expect(width).toBeCloseTo(210);
	});

	test("should give the page a height of 148mm", async () => {
		let width = await page.$eval("paged-page", (r) =>
			CSSNumericValue.parse(
				getComputedStyle(r).getPropertyValue("--paged-height"),
			).to("mm").value);

		expect(width).toBeCloseTo(148);
	});

	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

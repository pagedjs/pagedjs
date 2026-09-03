import { test, expect } from "../../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../../test_helpers/constants.js";


test.describe("page-size", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("page-rules/size/page-size/page-size.html");
	});


	test("should render 1 page", async () => {
		let pages = await page.$$eval("paged-page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(1);
	});

	test("should give the page a width of 148mm", async () => {
		let width = await page.$eval("paged-page", (r) =>
			CSSNumericValue.parse(
				getComputedStyle(r).getPropertyValue("--paged-width"),
			).to("mm").value);

		expect(width).toBeCloseTo(148);
	});

	test("should give the page a height of 210mm", async () => {
		let width = await page.$eval("paged-page", (r) =>
			CSSNumericValue.parse(
				getComputedStyle(r).getPropertyValue("--paged-height"),
			).to("mm").value);

		expect(width).toBeCloseTo(210);
	});

	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

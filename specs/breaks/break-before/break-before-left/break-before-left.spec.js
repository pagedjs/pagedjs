import { test, expect } from "../../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../../test_helpers/constants.js";


test.describe("break-before-left", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("breaks/break-before/break-before-left/break-before-left.html");
	});


	test("should render 36 pages", async () => {
		let pages = await page.$$eval("paged-page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(36);
	});

	// it('should render page 1 as blank', async () => {
	// 	let isBlank = await page.$eval("paged-page[index='0']", (r) => {
	// 		return r.hasAttribute("blank");
	// 	});
	//
	// 	expect(isBlank).toEqual(true);
	// })

	test("should render page 1 as right", async () => {
		let isLeft = await page.$eval("paged-page[index='0']", (r) => {
			return r.hasAttribute("recto");
		});

		expect(isLeft).toEqual(true);
	});

	test("page 1 should be Section", async () => {
		let text = await page.$eval("paged-page[index='0']", (r) => r.textContent);

		expect(text).toContain("Section");
	});

	test("page 2 should be Section 1", async () => {
		let text = await page.$eval("paged-page[index='1']", (r) => r.textContent);

		expect(text).toContain("Section 1");
	});

	test("should render page 7 as blank", async () => {
		let isBlank = await page.$eval("paged-page[index='6']", (r) => {
			return r.hasAttribute("blank");
		});

		expect(isBlank).toEqual(true);
	});

	test("page 10 include h2", async () => {
		let text = await page.$eval("paged-page[index='9']", (r) => r.textContent);

		expect(text).toContain("A - h2 (inline element)");
	});


	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

import { test, expect } from "../../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../../test_helpers/constants.js";


test.describe("break-after-verso", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("breaks/break-after/break-after-verso/break-after-verso.html");
	});


	test("should render 38 pages", async () => {
		let pages = await page.$$eval("paged-page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(38);
	});

	test("should render page 4 as verso", async () => {
		let isLeft = await page.$eval("paged-page[index='3']", (r) => {
			return r.hasAttribute("verso");
		});

		expect(isLeft).toEqual(true);
	});

	test("page 4 should be Section 2", async () => {
		let text = await page.$eval("paged-page[index='3']", (r) => r.textContent);

		expect(text).toContain("Section 2");
	});

	test("should render page 7 as blank", async () => {
		let isBlank = await page.$eval("paged-page[index='6']", (r) => {
			return r.hasAttribute("blank");
		});

		expect(isBlank).toEqual(true);
	});

	test("should render page 8 as verso", async () => {
		let isLeft = await page.$eval("paged-page[index='7']", (r) => {
			return r.hasAttribute("verso");
		});

		expect(isLeft).toEqual(true);
	});

	test("page 8 should be Section 3", async () => {
		let text = await page.$eval("paged-page[index='7']", (r) => r.textContent);

		expect(text).toContain("Section 3");
	});

	test("page 9 should break after h2", async () => {
		let text = await page.$eval("paged-page[index='8']", (r) => r.textContent);

		expect(text.trim()).toEqual("A - h2 (inline element)");
	});

	test("should render page 10 as verso", async () => {
		let isLeft = await page.$eval("paged-page[index='9']", (r) => {
			return r.hasAttribute("verso");
		});

		expect(isLeft).toEqual(true);
	});

	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

import { test, expect } from "../../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../../test_helpers/constants.js";


test.describe("break-after-recto", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("breaks/break-after/break-after-recto/break-after-recto.html");
	});


	test("should render 39 pages", async () => {
		let pages = await page.$$eval("paged-page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(39);
	});

	test("should render page 2 as blank", async () => {
		let isBlank = await page.$eval("paged-page[index='1']", (r) => {
			return r.hasAttribute("blank");
		});

		expect(isBlank).toEqual(true);
	});

	test("should render page 3 as recto", async () => {
		let isRight = await page.$eval("paged-page[index='2']", (r) => {
			return r.hasAttribute("recto");
		});

		expect(isRight).toEqual(true);
	});

	test("page 3 should be Section 1", async () => {
		let text = await page.$eval("paged-page[index='2']", (r) => r.textContent);

		expect(text).toContain("Section 1");
	});

	test("should render page 5 as recto", async () => {
		let isRight = await page.$eval("paged-page[index='4']", (r) => {
			return r.hasAttribute("recto");
		});

		expect(isRight).toEqual(true);
	});

	test("page 5 should be Section 2", async () => {
		let text = await page.$eval("paged-page[index='4']", (r) => r.textContent);

		expect(text).toContain("Section 2");
	});

	test("should render page 8 as blank", async () => {
		let isBlank = await page.$eval("paged-page[index='7']", (r) => {
			return r.hasAttribute("blank");
		});

		expect(isBlank).toEqual(true);
	});

	test("should render page 9 as recto", async () => {
		let isRight = await page.$eval("paged-page[index='8']", (r) => {
			return r.hasAttribute("recto");
		});

		expect(isRight).toEqual(true);
	});

	test("page 9 should be Section 3", async () => {
		let text = await page.$eval("paged-page[index='8']", (r) => r.textContent);

		expect(text).toContain("Section 3");
	});

	test("page 10 should break after h2", async () => {
		let text = await page.$eval("paged-page[index='9']", (r) => r.textContent);

		expect(text.trim()).toEqual("A - h2 (inline element)");
	});

	test("should render page 11 as recto", async () => {
		let isRight = await page.$eval("paged-page[index='10']", (r) => {
			return r.hasAttribute("recto");
		});

		expect(isRight).toEqual(true);
	});

	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

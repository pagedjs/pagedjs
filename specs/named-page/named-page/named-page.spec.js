import { test, expect } from "../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("named-page", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("named-page/named-page/named-page.html");
	});


	test("should render 8 pages", async () => {
		let pages = await page.$$eval("paged-page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(8);
	});

	test("should not give page 1 a named class", async () => {
		let chapter = await page.$eval("paged-page[index='0']", (r) => {
			return r.name === "chapter";
		});

		expect(chapter).toBe(false);
	});

	test("should give the page 3 a named class", async () => {
		let chapter = await page.$eval("paged-page[index='2']", (r) => {
			return r.name === "chapter";
		});

		expect(chapter).toBe(true);
	});

	test("should give the page 4 a named class", async () => {
		let chapter = await page.$eval("paged-page[index='3']", (r) => {
			return r.name === "chapter";
		});

		expect(chapter).toBe(true);
	});


	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

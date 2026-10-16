import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("duplicate-headers", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("issues/duplicate-headers/duplicate-headers.html");
	});


	test("should render 6 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(6);
	});

	test("page 1 header should be \"chapter\"", async () => {
		let text = await page.$eval("[data-page-number='1'] .pagedjs_margin-top-left > .pagedjs_margin-content", (r) => r.textContent);

		expect(text).toContain("chapter");
	});

	test("page 3 header should be \"chapter nth\"", async () => {
		let text = await page.$eval("[data-page-number='3'] .pagedjs_margin-top-left > .pagedjs_margin-content", (r) => r.textContent);

		expect(text).toContain("chapter nth");
	});

	test("page 4 header should be \"chapter left\"", async () => {
		let text = await page.$eval("[data-page-number='4'] .pagedjs_margin-top-left > .pagedjs_margin-content", (r) => r.textContent);

		expect(text).toContain("chapter left");
	});

	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("in-top-level", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("breaks/in-top-level/in-top-level.html");
	});


	test("should render 4 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(4);
	});

	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

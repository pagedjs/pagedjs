import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("rebuild-all-tds", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("tables/rebuild-all-tds/rebuild-all-tds.html");
	});


	test.skip("should render 3 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(3);
	});


	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

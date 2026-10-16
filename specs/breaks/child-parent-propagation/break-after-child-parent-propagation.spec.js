import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("break-after-child-parent-propagation", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("breaks/child-parent-propagation/break-after-child-parent-propagation.html");
	});


	test("should not break between the box (section) and its containers (main)", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(2);
	});

	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
});

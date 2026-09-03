import { test, expect } from "../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("break-before-container-propagation", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("breaks/child-parent-propagation/break-before-container-propagation.html");
	});


	test("should page break between containers (header and main)", async () => {
		let pages = await page.$$eval("paged-page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(3);
	});

	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
});

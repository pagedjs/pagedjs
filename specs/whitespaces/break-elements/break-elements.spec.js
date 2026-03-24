import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("break-elements", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("whitespaces/break-elements/break-elements.html");
	});


	test("should render 2 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(2);
	});

	// Note that this test really relies on the PDF matching. It is possible
	// for the element to be there in the DOM but not be displayed (as it is
	// with other tests).
	test("should include point 9", async () => {
		let tenthRowFirstData = await page.$eval("table tr:nth-child(10) td:nth-child(1)", (r) => {
			return r.textContent;
		});

		expect(tenthRowFirstData).toEqual("9.");
	});

	test("should include point 9 on page 1", async () => {
		let point9 = await page.$eval("table tr:nth-child(10) td:nth-child(1)", (r) => {
			let pageId = r.closest(".pagedjs_page").dataset.pageNumber;
			return pageId;
		});

		expect(point9).toEqual("1");
	});

	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("lists", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("splits/lists/lists.html");
	});


	test("should give the first list item on page 1 and number of 1", async () => {
		let itemnum = await page.$eval("[data-page-number='1'] section li:nth-of-type(1)", (r) => {
			return r.getAttribute("data-item-num");
		});

		expect(itemnum).toBe("1");
	});

	test("should give the first list item on page 2 and number of 7", async () => {
		let itemnum = await page.$eval("[data-page-number='2'] section li:nth-of-type(1)", (r) => {
			return r.getAttribute("data-item-num");
		});

		expect(itemnum).toBe("7");
	});

	test("should give the first list item on page 3 no list item style", async () => {
		let item = await page.$eval("[data-page-number='3'] section li:nth-of-type(1)", (r) => {
			return window.getComputedStyle(r)["list-style"];
		});

		expect(item).toContain("none");
	});


	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

import { test, expect } from "../../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../../test_helpers/constants.js";


test.describe("spread-of-page-group", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("page-selector/page-group/spread-of-page-group/spread-of-page-group.html");
	});


	test("should have no background on page 1", async () => {
		let color = await page.$eval("[data-page-number='1']", (r) => window.getComputedStyle(r).backgroundColor);
		expect(color).toContain("rgba(0, 0, 0, 0)"); // transparent
	});

	test("should have a yellow background on page 3", async () => {
		let color = await page.$eval("[data-page-number='3']", (r) => window.getComputedStyle(r).backgroundColor);
		expect(color).toContain("rgb(255, 255, 0)"); // yellow
	});

	test("should have a red background on page 4", async () => {
		let color = await page.$eval("[data-page-number='4']", (r) => window.getComputedStyle(r).backgroundColor);
		expect(color).toContain("rgb(255, 0, 0)"); // red
	});

	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

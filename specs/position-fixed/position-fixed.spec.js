import { test, expect } from "../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../test_helpers/constants.js";


test.describe("element with position: fixed", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("position-fixed/position-fixed.html");
	});


	test("Page 2 should have a fixed element with a position absolute", async () => {
		let text = await page.$eval("paged-page[index='1'] .fixed", (r) =>
			window.getComputedStyle(r).getPropertyValue("position"));
		expect(text).toEqual("absolute");
	});
	test("Page 3 should have a fixed element with a position absolute", async () => {
		let text = await page.$eval("paged-page[index='2'] .fixed", (r) =>
			window.getComputedStyle(r).getPropertyValue("position"));
		expect(text).toEqual("absolute");
	});
	test("Page 4 should have a fixed element with a position absolute", async () => {
		let text = await page.$eval("paged-page[index='3'] .fixed", (r) =>
			window.getComputedStyle(r).getPropertyValue("position"));
		expect(text).toEqual("absolute");
	});
	test("Page 5 should have a fixed element with a position absolute", async () => {
		let text = await page.$eval("paged-page[index='4'] .fixed", (r) =>
			window.getComputedStyle(r).getPropertyValue("position"));
		expect(text).toEqual("absolute");
	});
	test("Page 2 should have a fixed sub-element with a position absolute", async () => {
		let text = await page.$eval("paged-page[index='1'] .sub", (r) =>
			window.getComputedStyle(r).getPropertyValue("position"));
		expect(text).toEqual("absolute");
	});
	test("Page 3 should have a fixed sub-element with a position absolute", async () => {
		let text = await page.$eval("paged-page[index='2'] .sub", (r) =>
			window.getComputedStyle(r).getPropertyValue("position"));
		expect(text).toEqual("absolute");
	});
	test("Page 4 should have a fixed sub-element with a position absolute", async () => {
		let text = await page.$eval("paged-page[index='3'] .sub", (r) =>
			window.getComputedStyle(r).getPropertyValue("position"));
		expect(text).toEqual("absolute");
	});
	test("Page 5 should have a fixed sub-element with a position absolute", async () => {
		let text = await page.$eval("paged-page[index='4'] .sub", (r) =>
			window.getComputedStyle(r).getPropertyValue("position"));
		expect(text).toEqual("absolute");
	});
	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

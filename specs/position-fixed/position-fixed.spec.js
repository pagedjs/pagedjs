import { test, expect } from "../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../test_helpers/constants.js";


test.describe("element with position: fixed", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("position-fixed/position-fixed.html");
	});


	test("Page 2 should have a fixed element with a position absolute", async () => {
		let text = await page.$eval("#page-2 .fixed", (r) =>
			window.getComputedStyle(r).getPropertyValue("position"));
		expect(text).toEqual("absolute");
	});
	test("Page 3 should have a fixed element with a position absolute", async () => {
		let text = await page.$eval("#page-3 .fixed", (r) =>
			window.getComputedStyle(r).getPropertyValue("position"));
		expect(text).toEqual("absolute");
	});
	test("Page 4 should have a fixed element with a position absolute", async () => {
		let text = await page.$eval("#page-4 .fixed", (r) =>
			window.getComputedStyle(r).getPropertyValue("position"));
		expect(text).toEqual("absolute");
	});
	test("Page 5 should have a fixed element with a position absolute", async () => {
		let text = await page.$eval("#page-5 .fixed", (r) =>
			window.getComputedStyle(r).getPropertyValue("position"));
		expect(text).toEqual("absolute");
	});
	test("Page 2 should have a fixed sub-element with a position absolute", async () => {
		let text = await page.$eval("#page-2 .sub", (r) =>
			window.getComputedStyle(r).getPropertyValue("position"));
		expect(text).toEqual("absolute");
	});
	test("Page 3 should have a fixed sub-element with a position absolute", async () => {
		let text = await page.$eval("#page-3 .sub", (r) =>
			window.getComputedStyle(r).getPropertyValue("position"));
		expect(text).toEqual("absolute");
	});
	test("Page 4 should have a fixed sub-element with a position absolute", async () => {
		let text = await page.$eval("#page-4 .sub", (r) =>
			window.getComputedStyle(r).getPropertyValue("position"));
		expect(text).toEqual("absolute");
	});
	test("Page 5 should have a fixed sub-element with a position absolute", async () => {
		let text = await page.$eval("#page-5 .sub", (r) =>
			window.getComputedStyle(r).getPropertyValue("position"));
		expect(text).toEqual("absolute");
	});
	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

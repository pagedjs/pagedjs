import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("target-text", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("target/target-text/target-text.html");
	});


	test("Table of content should include chapter titles", async () => {
		let text = await page.$eval("nav li#first a" , (r) => window.getComputedStyle(r, "::after").content);
		expect(text).toEqual("\"'Lorem \\\"ipsum\\\" dolor sit amet'\"");
	});

	test("Table of content should include second chapter title", async () => {
		let text = await page.$eval("nav li#second a" , (r) => window.getComputedStyle(r, "::after").content);
		expect(text).toEqual("\"'Lorem ipsum dolor sit amet'\"");
	});

	test("Table of content should include first-letter of the chapter title", async () => {
		let text = await page.$eval("nav li#third a" , (r) => window.getComputedStyle(r, "::after").content);
		expect(text).toEqual("\"P\"");
	});

	test("Table of content should include the content of the before pseudo element", async () => {
		let text = await page.$eval("nav li#fourth a" , (r) => window.getComputedStyle(r, "::after").content);
		expect(text).toEqual("\"This is 'inside' the before:\"");
	});

	test("Table of content should include the content of the after pseudo element", async () => {
		let text = await page.$eval("nav li#fifth a" , (r) => window.getComputedStyle(r, "::after").content);
		expect(text).toEqual("\": This is inside the after\"");
	});
	// if (!DEBUG) {
	// 	it('should create a pdf', async () => {
	// 		let pdf = await page.pdf(PDF_SETTINGS);
	// 		// no need to check the pdf with those test
	// 		// expect(pdf).toMatchPdfSnapshot();
	// 	})
	// }
}
);

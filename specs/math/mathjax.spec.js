import { test, expect } from "../test_helpers/fixtures.js";


test.describe("default", () => {
	let page;

	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("math/mathjax.html");
	});


	test("mathjax elements should not throw an exception", async () => {
		let count = await page.$$eval("math" , (r) => {
			return r.length;
		});
		expect(count).toEqual(96);
	});
});

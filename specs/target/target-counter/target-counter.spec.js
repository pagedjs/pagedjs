import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


// the test for the target counters are problematics as we can’t find a way to find their value without recreating the whole thing in js.
test.describe("target-counter", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("target/target-counter/target-counter.html");
	});


	test("Cross reference should include See p. text", async () => {
		let text = await page.$eval("#ref-call", (r) => window.getComputedStyle(r, "::after").content);
		expect(text).toContain("(See p. ");
	});

	test("link to element with ID \"chap2.dot\" must been parsed by the lib", async () => {
		let text = await page.$eval("#dot-id", (r) => window.getComputedStyle(r, "::after").content);
		expect(text).toContain("counter");
	});


	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

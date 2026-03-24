import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("screen-media", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("media/screen/screen.html");
	});


	test("should render green text", async () => {
		let textColor = await page.$eval("h1", (h1) => window.getComputedStyle(h1).color);
		expect(textColor).toContain("rgb(0, 128, 0)"); // green
	});

	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

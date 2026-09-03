import { test, expect } from "../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../test_helpers/constants.js";

test.describe("all-media", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("media/all/all.html");
	});

	test("renders green text", async () => {
		const textColor = await page.$eval(
			"h1",
			(heading) => window.getComputedStyle(heading).color,
		);
		expect(textColor).toContain("rgb(0, 128, 0)");
	});

	if (PDF_REVIEW) {
		test("creates a PDF", async () => {
			const pdf = await page.pdf(PDF_SETTINGS);
			await expect(pdf).toMatchPdfSnapshot();
		});
	}
});

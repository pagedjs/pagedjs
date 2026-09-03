import { test, expect, marginBoxStyle } from "../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("page-spread", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("page-selector/page-spread/page-spread.html");
	});


	test("should render page 2 as left", async () => {
		let isLeft = await page.$eval("paged-page[index='1']", (r) => {
			return r.hasAttribute("verso");
		});

		expect(isLeft).toEqual(true);
	});

	test("should render page 3 as right", async () => {
		let isRight = await page.$eval("paged-page[index='2']", (r) => {
			return r.hasAttribute("recto");
		});

		expect(isRight).toEqual(true);
	});

	test("should have bottom center text of right on the first page", async () => {
		let text = await marginBoxStyle(
			page,
			1,
			"bottom-center",
			"content",
			"::after",
		);
		expect(text).toContain("right");
	});

	test("should have a yellow background on page 6", async () => {
		let color = await page.$eval("paged-page[index='5']", (r) => window.getComputedStyle(r).backgroundColor);
		expect(color).toContain("rgb(255, 255, 0)"); // yellow
	});

	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

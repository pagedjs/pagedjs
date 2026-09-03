import { test, expect, marginBoxStyle } from "../../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../../test_helpers/constants.js";


test.describe("first-page-of-page-group", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("page-selector/page-group/first-page-of-page-group/first-page-of-page-group.html");
	});


	test("should not give page 1 a named first page class", async () => {
		let chapter = await page.$eval("paged-page[index='0']", (r) => {
			return r.name === "chapter" && r.hasAttribute("first");
		});

		expect(chapter).toBe(false);
	});

	test("should have a named first page class on page 2", async () => {
		let chapter = await page.$eval("paged-page[index='1']", (r) => {
			return r.name === "chapter" && r.hasAttribute("first");
		});

		expect(chapter).toBe(true);
	});

	test("should have bottom center text on page 2", async () => {
		let text = await marginBoxStyle(
			page,
			2,
			"bottom-center",
			"content",
			"::after",
		);
		expect(text).toContain("first page of the chapter");
	});

	test("should not give page 3 a named first page class", async () => {
		let chapter = await page.$eval("paged-page[index='2']", (r) => {
			return r.name === "chapter" && r.hasAttribute("first");
		});

		expect(chapter).toBe(false);
	});

	test("should have a named first page class on page 5", async () => {
		let chapter = await page.$eval("paged-page[index='4']", (r) => {
			return r.name === "chapter" && r.hasAttribute("first");
		});

		expect(chapter).toBe(true);
	});

	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

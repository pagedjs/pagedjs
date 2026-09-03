import { test, expect, marginBoxText } from "../../test_helpers/fixtures.js";
import { PDF_REVIEW, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("duplicate-headers", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("issues/duplicate-headers/duplicate-headers.html");
	});


	test("should render 6 pages", async () => {
		let pages = await page.$$eval("paged-page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(6);
	});

	test("page 1 header should be \"chapter\"", async () => {
		let text = await marginBoxText(page, 1, "top-left");

		expect(text).toContain("chapter");
	});

	test("page 3 header should be \"chapter nth\"", async () => {
		let text = await marginBoxText(page, 3, "top-left");

		expect(text).toContain("chapter nth");
	});

	test("page 4 header should be \"chapter left\"", async () => {
		let text = await marginBoxText(page, 4, "top-left");

		expect(text).toContain("chapter left");
	});

	if (PDF_REVIEW) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			await expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

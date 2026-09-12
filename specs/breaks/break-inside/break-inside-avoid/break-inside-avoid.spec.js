import { test, expect } from "../../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../../test_helpers/constants.js";


test.describe("break-inside-avoid", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("breaks/break-inside/break-inside-avoid/break-inside-avoid.html");
	});


	test("should render 5 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(5);
	});

	test("page 2 should have unbroken text", async () => {
		let text = await page.$eval("[data-page-number='2']", (r) => r.textContent);

		expect(text).toContain("Cras ut augue condimentum, egestas nisi in, dictum erat. Nullam tincidunt tincidunt tempor. Sed in eleifend nibh, sit amet feugiat nisi. Cras at ante ut urna sagittis dictum ut nec elit. In feugiat euismod massa sagittis dictum. Nullam eu nisl eu elit laoreet tincidunt id sed ligula. Praesent vulputate faucibus nibh, ut ultrices nunc aliquam nec. Mauris et condimentum ligula. Vestibulum nec tortor quis urna dictum luctus. Cras quis suscipit metus. Ut dignissim ullamcorper aliquam. Donec condimentum eu tellus at interdum.");
	});

	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

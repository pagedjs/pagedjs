import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("footnote-policy", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("notes/footnote-policy/footnote-policy.html");
	});


	test("should render 6 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(6);
	});

	test("display auto footnotes should split text", async () => {
		let textStart = await page.$eval("[data-page-number='1']", (r) => r.textContent);

		expect(textStart).toContain("Characteres");

		let textEnd = await page.$eval("[data-page-number='2']", (r) => r.textContent);

		expect(textEnd).toContain("genus typos me vidisse");
	});

	test("display line footnotes should stay with the callout line", async () => {
		let textStart = await page.$eval("[data-page-number='4']", (r) => r.textContent);

		// line
		expect(textStart).toContain("Strasburg");

		// footnote
		expect(textStart).toContain("Argentoratensi");
	});

	test("display block footnotes should stay with the callout paragraph block", async () => {
		let textStart = await page.$eval("[data-page-number='6']", (r) => r.textContent);

		// paragraph
		expect(textStart).toContain("The legend");

		// footnote
		expect(textStart).toContain("Argentoratensi");
	});


	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

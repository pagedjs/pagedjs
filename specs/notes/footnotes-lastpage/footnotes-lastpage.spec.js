import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("footnotes lastpage", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("notes/footnotes-lastpage/footnotes-lastpage.html");
	});


	test("should render 6 pages", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(6);
	});

	test("not display footnote 4 on page 2", async () => {
		let textStart = await page.$eval("[data-page-number='2']", (r) => r.textContent);

		// line
		expect(textStart).toContain("sand-cast bodies");

		// footnote
		expect(textStart).not.toContain("three-line pica");
	});

	test("should display footnote 4 on page 3", async () => {
		let textStart = await page.$eval("[data-page-number='3']", (r) => r.textContent);

		// line
		expect(textStart).not.toContain("sand-cast bodies");

		// footnote
		expect(textStart).toContain("three-line pica");
	});

	test("not display footnote 8 on page 5", async () => {
		let textStart = await page.$eval("[data-page-number='2']", (r) => r.textContent);

		// line
		expect(textStart).toContain("sand-cast bodies");

		// footnote
		expect(textStart).not.toContain("three-line pica");
	});

	test("should display footnote 8 on page 6", async () => {
		let textStart = await page.$eval("[data-page-number='3']", (r) => r.textContent);

		// line
		expect(textStart).not.toContain("sand-cast bodies");

		// footnote
		expect(textStart).toContain("three-line pica");
	});


	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

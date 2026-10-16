import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("numbering", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("splits/numbering/numbering.html");
	});


	test("should give the section 1 paragraph 1 a number of 1", async () => {
		let counter = await page.$eval("[data-page-number='1'] section p:nth-of-type(1)", (r) => {
			return r.getAttribute("data-counter-paragraph-value");
		});

		expect(counter).toBe("1");
	});

	test("should give the section 1 paragraph 2 a number of 2", async () => {
		let counter = await page.$eval("[data-page-number='1'] section p:nth-of-type(2)", (r) => {
			return r.getAttribute("data-counter-paragraph-value");
		});

		expect(counter).toBe("2");
	});

	test("should give the section 1 paragraph 3 a number of 3, on page 2", async () => {
		let counter = await page.$eval("[data-page-number='2'] section p:nth-of-type(2)", (r) => {
			return r.getAttribute("data-counter-paragraph-value");
		});

		expect(counter).toBe("3");
	});


	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

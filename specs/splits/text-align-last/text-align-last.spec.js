import { test, expect } from "../../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../../test_helpers/constants.js";


test.describe("text-align-last", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("splits/text-align-last/text-align-last.html");
	});


	test("should give the first paragraph on page 1 a text-align-last of justify", async () => {
		let align = await page.$eval("[data-page-number='1'] section p:nth-of-type(1)", (r) => {
			return window.getComputedStyle(r)["text-align-last"];
		});

		expect(align).toBe("justify");
	});

	test("should give the first paragraph on page 2 a text-align-last of auto", async () => {
		let align = await page.$eval("[data-page-number='2'] section p:nth-of-type(1)", (r) => {
			return window.getComputedStyle(r)["text-align-last"];
		});

		expect(align).toBe("auto");
	});

	test("should give the first paragraph on page 3 a text-align-last of auto", async () => {
		let align = await page.$eval("[data-page-number='3'] section p:nth-of-type(1)", (r) => {
			return window.getComputedStyle(r)["text-align-last"];
		});

		expect(align).toBe("auto");
	});

	test("should give the first paragraph on page 4 a text-align-last of auto", async () => {
		let align = await page.$eval("[data-page-number='4'] section p:nth-of-type(1)", (r) => {
			return window.getComputedStyle(r)["text-align-last"];
		});

		expect(align).toBe("auto");
	});




	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
}
);

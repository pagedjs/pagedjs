import { test, expect } from "../test_helpers/fixtures.js";
import { DEBUG, PDF_SETTINGS } from "../test_helpers/constants.js";


test.describe("style-order-simple", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("styles/simple.html");
	});


	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
});

test.describe("style-order-consecutive", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("styles/consecutive.html");
	});


	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
});

test.describe("style-order-scattered", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("styles/scattered.html");
	});


	if (!DEBUG) {
		test("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPdfSnapshot();
		});
	}
});

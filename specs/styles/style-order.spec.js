const TIMEOUT = 10000; // Some page might take longer than this to renderer

describe("style-order-simple", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("styles/simple.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPDFSnapshot(1);
		});
	}
});

describe("style-order-consecutive", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("styles/consecutive.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPDFSnapshot(1);
		});
	}
});

describe("style-order-scattered", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("styles/scattered.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await page.pdf(PDF_SETTINGS);

			expect(pdf).toMatchPDFSnapshot(1);
		});
	}
});

const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe("target-counter-single-colon", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("target/target-counter/target-counter-single-colon.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	if (!DEBUG) {
		it("should create a pdf", async () => {
			const pdf = await page.pdf(PDF_SETTINGS);
			expect(pdf).toMatchPDFSnapshot(1);
		});
	}
});

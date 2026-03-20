const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe("counter-page", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("counters/counter-page-reset/counter-page-reset.html");
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await generatePdf("counters/counter-page-reset/counter-page-reset.html");

			expect(pdf).toMatchPDFSnapshot(1);
			expect(pdf).toMatchPDFSnapshot(3);
		});
	}
}
);

const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe("counter-page-reset-scope", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("counters/counter-page-reset/counter-page-reset-scope.html");
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await generatePdf("counters/counter-page-reset/counter-page-reset-scope.html");

			expect(pdf).toMatchPDFSnapshot(3);
			expect(pdf).toMatchPDFSnapshot(4);
			expect(pdf).toMatchPDFSnapshot(5);
		});
	}
}
);

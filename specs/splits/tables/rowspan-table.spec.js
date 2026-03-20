const TIMEOUT = 10000;

describe("rowspan table", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("splits/tables/rowspan-table.html");
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await generatePdf("splits/tables/rowspan-table.html");

			expect(pdf).toMatchPDFSnapshot(1);
			expect(pdf).toMatchPDFSnapshot(2);
		});
	}
});

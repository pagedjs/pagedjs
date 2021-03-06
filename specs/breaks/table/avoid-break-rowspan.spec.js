const TIMEOUT = 10000;

describe("breaks-table-avoid-break-rowspan", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("breaks/table/avoid-break-rowspan.html");
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
			expect(pdf).toMatchPDFSnapshot(2);
		});
	}
});

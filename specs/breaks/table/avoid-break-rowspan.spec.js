const TIMEOUT = 10000;

describe("breaks-table-avoid-break-rowspan", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("breaks/table/avoid-break-rowspan.html");
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await generatePdf("breaks/table/avoid-break-rowspan.html");
			expect(pdf).toMatchPDFSnapshot(1);
			expect(pdf).toMatchPDFSnapshot(2);
		});
	}
});

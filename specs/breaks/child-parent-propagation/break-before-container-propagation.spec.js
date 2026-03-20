const TIMEOUT = 10000;

describe("break-before-container-propagation", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("breaks/child-parent-propagation/break-before-container-propagation.html");
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("should page break between containers (header and main)", async () => {
		let pages = await page.$$eval(".pagedjs_page", (r) => {
			return r.length;
		});

		expect(pages).toEqual(3);
	});

	if (!DEBUG) {
		it("should create a pdf", async () => {
			let pdf = await generatePdf("breaks/child-parent-propagation/break-before-container-propagation.html");

			expect(pdf).toMatchPDFSnapshot(1);
			expect(pdf).toMatchPDFSnapshot(2);
			expect(pdf).toMatchPDFSnapshot(3);
		});
	}
});

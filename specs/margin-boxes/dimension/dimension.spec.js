const TIMEOUT = 10000;

describe("margin-box-dimension", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("margin-boxes/dimension/dimension.html");
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});


	if (!DEBUG) {
		it.skip("should create a pdf", async () => {
			let pdf = await generatePdf("margin-boxes/dimension/dimension.html");

			expect(pdf).toMatchPDFSnapshot(1);
		});
	}
}
);

const TIMEOUT = 10000;

describe('margin-box-dimension', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('margin-boxes/dimension/dimension.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})


		if (!DEBUG) {
			xit('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(1);
			})
		}
	}
)

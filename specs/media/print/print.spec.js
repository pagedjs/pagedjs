const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe('print-media', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('media/print/print.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

		it('should render green text', async () => {
			let textColor = await page.$eval("h1", (h1) => window.getComputedStyle(h1).color);
			expect(textColor).toContain('rgb(0, 128, 0)'); // green
		})

		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(1);
			})
		}
	}
)

const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe('page-nth', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('page-selector/page-nth/page-nth.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

		it('should have a yellow background on page 6', async () => {
			let textColor = await page.$eval("[data-page-number='3']", (r) => window.getComputedStyle(r).backgroundColor);
			expect(textColor).toContain('rgb(255, 255, 0)'); // yellow
		})

		it('should have bottom center text', async () => {
			let text = await page.$eval("[data-page-number='3'] .pagedjs_margin-bottom-center > .pagedjs_margin-content", (r) => window.getComputedStyle(r, '::after').content);
			expect(text).toContain("3rd page of the document");
		})

		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(3);
			})
		}
	}
)

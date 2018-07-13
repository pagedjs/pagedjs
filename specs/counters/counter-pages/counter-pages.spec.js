const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe('counter-pages', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('counters/counter-pages/counter-pages.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

    // Unable to read counter values
    xit('should have page numbering', async () => {
      let text = await page.$eval("[data-page-number='1'] .pagedjs_margin-bottom-left > .pagedjs_margin-content", (r) => window.getComputedStyle(r, '::after').content);
      expect(text).toContain("1 / 6");
    })

		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(1);
			})
		}
	}
)

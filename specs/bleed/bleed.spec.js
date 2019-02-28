const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe('bleed', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('bleed/bleed.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

		it('should render text', async () => {
			let text = await page.evaluate(() => document.body.textContent);
			expect(text).toContain('Chapter 1. Loomings.');
		})

		it('should render 7 pages', async () => {
			let pages = await page.$$eval(".pagedjs_page", (r) => r.length);
			expect(pages).toBe(7);
		})

		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(1);
			})
		}
	}
)

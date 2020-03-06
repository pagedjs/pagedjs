const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe('default', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('default/position-fixed.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

		it('should render 1 page', async () => {
			let pages = await page.$$eval(".pagedjs_page", (r) => r.length);
			expect(pages).toBe(5);
		})

		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(1);
			})
		}
	}
)

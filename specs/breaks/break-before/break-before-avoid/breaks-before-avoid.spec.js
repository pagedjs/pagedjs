const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe('break-before-avoid', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('breaks/break-before/break-before-avoid/break-before-avoid.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

		it('should render 5 pages', async () => {
			let pages = await page.$$eval(".pagedjs_page", (r) => {
				return r.length;
			});

			expect(pages).toEqual(5);
		})

		it('page 3 should be Section 2', async () => {
			let text = await page.$eval("[data-page-number='3']", (r) => r.textContent);

			expect(text).toContain('Section 2');
		})

		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(3);
			})
		}
	}
)

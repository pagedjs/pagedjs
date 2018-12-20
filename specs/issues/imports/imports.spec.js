const TIMEOUT = 10000;

describe('imports', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('issues/imports/imports.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

		it('should render 6 pages', async () => {
			let pages = await page.$$eval(".pagedjs_page", (r) => {
				return r.length;
			});

			expect(pages).toEqual(6);
		})

		it('should have a green paragaph 1', async () => {
			let color = await page.$eval("[data-page-number='1'] p:nth-of-type(1)", (r) => window.getComputedStyle(r).color);
			expect(color).toContain('rgb(0, 128, 0)'); // green
		})

		it('should have a yellow paragaph 1', async () => {
			let color = await page.$eval("[data-page-number='1'] p:nth-of-type(2)", (r) => window.getComputedStyle(r).color);
			expect(color).toContain('rgb(255, 255, 0)'); // yellow
		})

		it('should have a orange paragaph 1', async () => {
			let color = await page.$eval("[data-page-number='1'] p:nth-of-type(3)", (r) => window.getComputedStyle(r).color);
			expect(color).toContain('rgb(255, 165, 0)'); // orange
		})

		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(1);
			})
		}
	}
)

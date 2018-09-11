const TIMEOUT = 10000;

describe('css is awesome', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('hyphens/awesome/awesome.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

		xit('should render 7 pages', async () => {
			let pages = await page.$$eval(".pagedjs_page", (r) => {
				return r.length;
			});

			expect(pages).toEqual(7);
		})

		xit('page 1 should have a hyphen', async () => {
			let text = await page.$eval("[data-page-number='1']", (r) => r.textContent);

			expect(text).toContain('\u2010');
		})


		if (!DEBUG) {
			xit('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(1);
				expect(pdf).toMatchPDFSnapshot(2);
			})
		}
	}
)

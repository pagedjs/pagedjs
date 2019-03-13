const TIMEOUT = 10000;

describe('landscape', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('page-rules/size/landscape/landscape.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

		it('should render 1 page', async () => {
			let pages = await page.$$eval(".pagedjs_page", (r) => {
				return r.length;
			});

			expect(pages).toEqual(1);
		})

		it('should give the page a width of 210mm', async () => {
			let width = await page.$eval(".pagedjs_page", (r) => {
				return window.getComputedStyle(r).getPropertyValue("--pagedjs-width");
			});

			expect(width).toEqual("210mm");
		})

    it('should give the page a height of 148mm', async () => {
			let width = await page.$eval(".pagedjs_page", (r) => {
				return window.getComputedStyle(r).getPropertyValue("--pagedjs-height");
			});

			expect(width).toEqual("148mm");
		})

		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(1);
			})
		}
	}
)

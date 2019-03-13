const TIMEOUT = 10000;

describe('length', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('page-rules/size/length/length.html')
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

		it('should give the page a width of 140mm', async () => {
			let width = await page.$eval(".pagedjs_page", (r) => {
				return window.getComputedStyle(r).getPropertyValue("--pagedjs-width");
			});

			expect(width).toEqual("140mm");
		})

    it('should give the page a height of 200mm', async () => {
			let width = await page.$eval(".pagedjs_page", (r) => {
				return window.getComputedStyle(r).getPropertyValue("--pagedjs-height");
			});

			expect(width).toEqual("200mm");
		})

		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(1);
			})
		}
	}
)

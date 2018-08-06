const TIMEOUT = 10000;

describe('content-none', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('generate-content/content-none/content-none.html')
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


		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(3);
				expect(pdf).toMatchPDFSnapshot(4);
			})
		}
	}
)

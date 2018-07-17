const TIMEOUT = 10000;

describe('issue', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('issues/template/template.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

		xit('should render 6 pages', async () => {
			let pages = await page.$$eval(".pagedjs_page", (r) => {
				return r.length;
			});

			expect(pages).toEqual(6);
		})


		if (!DEBUG) {
			xit('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(1);
			})
		}
	}
)

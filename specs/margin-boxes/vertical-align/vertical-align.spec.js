const TIMEOUT = 10000;

describe('vertical-align', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('margin-boxes/vertical-align/vertical-align.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

		it('Render the top-left at the top', async () => {
			let pages = await page.$eval(".pagedjs_margin-top-left", (r) => {
				return window.getComputedStyle(r)["align-items"];
			});

			expect(pages).toEqual("flex-start");
		})


		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(1);
			})
		}
	}
)

const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe('break-inside-avoid', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('breaks/break-inside/break-inside-avoid/break-inside-avoid.html')
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

		it('page 2 should have unbroken text', async () => {
			let text = await page.$eval("[data-page-number='2']", (r) => r.textContent);

			expect(text).toContain('Cras ut augue condimentum, egestas nisi in, dictum erat. Nullam tincidunt tincidunt tempor. Sed in eleifend nibh, sit amet feugiat nisi. Cras at ante ut urna sagittis dictum ut nec elit. In feugiat euismod massa sagittis dictum. Nullam eu nisl eu elit laoreet tincidunt id sed ligula. Praesent vulputate faucibus nibh, ut ultrices nunc aliquam nec. Mauris et condimentum ligula. Vestibulum nec tortor quis urna dictum luctus. Cras quis suscipit metus. Ut dignissim ullamcorper aliquam. Donec condimentum eu tellus at interdum.');
		})

		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(1);
				expect(pdf).toMatchPDFSnapshot(2);
				expect(pdf).toMatchPDFSnapshot(5);
			})
		}
	}
)

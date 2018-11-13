const TIMEOUT = 10000;

describe('issue-74', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('issues/issue-74/issue-74.html')
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

		it('Preface should be in Roman numerals', async () => {
			let text = await page.$eval("#toc-preface", (r) => window.getComputedStyle(r, '::after').content);
			expect(text).toContain("lower-roman");
		})

		it('First Chapter should be 1', async () => {
			let text = await page.$eval("#toc-first-chapter", (r) => window.getComputedStyle(r, '::after').content);
			expect(text).toContain("counter(target-counter");
		})


		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

        expect(pdf).toMatchPDFSnapshot(1);
				expect(pdf).toMatchPDFSnapshot(4);
			})
		}
	}
)

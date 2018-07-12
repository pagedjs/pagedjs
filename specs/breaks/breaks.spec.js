const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe('breaks', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('breaks/breaks.html')
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

			expect(pages).toEqual(6);
		})

		it('should avoid breaking after h2', async () => {
			let h2ParentPage = await page.$eval("h2", (r) => {
				let pageId = r.closest(".pagedjs_page").dataset.pageNumber;
				return pageId;
			});
			let pParentPage = await page.$eval("#afterh2", (r) => {
				let pageId = r.closest(".pagedjs_page").dataset.pageNumber;
				return pageId;
			});

			expect(h2ParentPage).toEqual(pParentPage);
		})

		it('should break after each section', async () => {
			let sections = await page.$$eval("section", (r) => {
				let prev, curr;
				let section;
				for (let i = 0; i < r.length; i++) {
					section = r[i];
					curr = section.closest(".pagedjs_page").dataset.pageNumber;
					if(curr === prev) {
						return false;
					}
					prev = curr;
				}
				return true;
			});

			expect(sections).toEqual(true);
		})

		it('should render a blank page before break-before=right', async () => {
			let blank = await page.$eval(".pagedjs_blank_page", (r) => {
				return r.dataset.pageNumber;
			});

			expect(blank).toEqual("4");
		})

		it('should render break-before=right sections as right page', async () => {
			let isRight = await page.$eval("[data-page-number='5']", (r) => {
				return r.classList.contains("pagedjs_right_page");
			});

			expect(isRight).toEqual(true);
		})

		it('should breaking after #breakAfter', async () => {
			let h4ParentPage = await page.$eval("#breakAfter", (r) => {
				let pageId = r.closest(".pagedjs_page").dataset.pageNumber;
				return pageId;
			});
			let pParentPage = await page.$eval("#afterh4", (r) => {
				let pageId = r.closest(".pagedjs_page").dataset.pageNumber;
				return pageId;
			});

			expect(h4ParentPage).not.toEqual(pParentPage);
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

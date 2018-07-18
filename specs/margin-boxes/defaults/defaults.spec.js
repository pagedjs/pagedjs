const TIMEOUT = 10000;

describe('margin-box-defaults', async () => {
		let page;
		let rendered;
		beforeAll(async () => {
			page = await loadPage('margin-boxes/defaults/defaults.html')
			return page.rendered;
		}, TIMEOUT)

		afterAll(async () => {
			if (!DEBUG) {
				await page.close();
			}
		})

		// top
		it('Render the top-left-corner aligned right', async () => {
			let pages = await page.$eval(".pagedjs_margin-top-left-corner", (r) => {
				return window.getComputedStyle(r)["text-align"];
			});

			expect(pages).toEqual("right");
		})

		it('Render the top-left-corner in the middle', async () => {
			let pages = await page.$eval(".pagedjs_margin-top-left-corner", (r) => {
				return window.getComputedStyle(r)["align-items"];
			});

			expect(pages).toEqual("center");
		})

		it('Render the top-left aligned left', async () => {
			let pages = await page.$eval(".pagedjs_margin-top-left", (r) => {
				return window.getComputedStyle(r)["text-align"];
			});

			expect(pages).toEqual("left");
		})

		it('Render the top-left in the middle', async () => {
			let pages = await page.$eval(".pagedjs_margin-top-left", (r) => {
				return window.getComputedStyle(r)["align-items"];
			});

			expect(pages).toEqual("center");
		})

		it('Render the top-center aligned center', async () => {
			let pages = await page.$eval(".pagedjs_margin-top-center", (r) => {
				return window.getComputedStyle(r)["text-align"];
			});

			expect(pages).toEqual("center");
		})

		it('Render the top-center in the middle', async () => {
			let pages = await page.$eval(".pagedjs_margin-top-center", (r) => {
				return window.getComputedStyle(r)["align-items"];
			});

			expect(pages).toEqual("center");
		})

		it('Render the top-right aligned right', async () => {
			let pages = await page.$eval(".pagedjs_margin-top-right", (r) => {
				return window.getComputedStyle(r)["text-align"];
			});

			expect(pages).toEqual("right");
		})

		it('Render the top-right in the middle', async () => {
			let pages = await page.$eval(".pagedjs_margin-top-right", (r) => {
				return window.getComputedStyle(r)["align-items"];
			});

			expect(pages).toEqual("center");
		})

		it('Render the top-right-corner aligned left', async () => {
			let pages = await page.$eval(".pagedjs_margin-top-right-corner", (r) => {
				return window.getComputedStyle(r)["text-align"];
			});

			expect(pages).toEqual("left");
		})

		it('Render the top-right-corner in the middle', async () => {
			let pages = await page.$eval(".pagedjs_margin-top-right-corner", (r) => {
				return window.getComputedStyle(r)["align-items"];
			});

			expect(pages).toEqual("center");
		})

		// left
		it('Render the left-top aligned center', async () => {
			let pages = await page.$eval(".pagedjs_margin-left-top", (r) => {
				return window.getComputedStyle(r)["text-align"];
			});

			expect(pages).toEqual("center");
		})

		it('Render the left-top at the top', async () => {
			let pages = await page.$eval(".pagedjs_margin-left-top", (r) => {
				return window.getComputedStyle(r)["align-items"];
			});

			expect(pages).toEqual("flex-start");
		})

		it('Render the left-middle aligned center', async () => {
			let pages = await page.$eval(".pagedjs_margin-left-middle", (r) => {
				return window.getComputedStyle(r)["text-align"];
			});

			expect(pages).toEqual("center");
		})

		it('Render the left-top in the middle', async () => {
			let pages = await page.$eval(".pagedjs_margin-left-middle", (r) => {
				return window.getComputedStyle(r)["align-items"];
			});

			expect(pages).toEqual("center");
		})

		it('Render the left-bottom aligned center', async () => {
			let pages = await page.$eval(".pagedjs_margin-left-bottom", (r) => {
				return window.getComputedStyle(r)["text-align"];
			});

			expect(pages).toEqual("center");
		})

		it('Render the left-bottom at the bottom', async () => {
			let pages = await page.$eval(".pagedjs_margin-left-bottom", (r) => {
				return window.getComputedStyle(r)["align-items"];
			});

			expect(pages).toEqual("flex-end");
		})

		// right
		it('Render the right-top aligned center', async () => {
			let pages = await page.$eval(".pagedjs_margin-right-top", (r) => {
				return window.getComputedStyle(r)["text-align"];
			});

			expect(pages).toEqual("center");
		})

		it('Render the right-top at the top', async () => {
			let pages = await page.$eval(".pagedjs_margin-right-top", (r) => {
				return window.getComputedStyle(r)["align-items"];
			});

			expect(pages).toEqual("flex-start");
		})

		it('Render the right-middle aligned center', async () => {
			let pages = await page.$eval(".pagedjs_margin-right-middle", (r) => {
				return window.getComputedStyle(r)["text-align"];
			});

			expect(pages).toEqual("center");
		})

		it('Render the right-middle at the middle', async () => {
			let pages = await page.$eval(".pagedjs_margin-right-middle", (r) => {
				return window.getComputedStyle(r)["align-items"];
			});

			expect(pages).toEqual("center");
		})

		it('Render the right-bottom aligned center', async () => {
			let pages = await page.$eval(".pagedjs_margin-right-bottom", (r) => {
				return window.getComputedStyle(r)["text-align"];
			});

			expect(pages).toEqual("center");
		})

		it('Render the right-bottom at the bottom', async () => {
			let pages = await page.$eval(".pagedjs_margin-right-bottom", (r) => {
				return window.getComputedStyle(r)["align-items"];
			});

			expect(pages).toEqual("flex-end");
		})

		// bottom
		it('Render the bottom-left-corner aligned right', async () => {
			let pages = await page.$eval(".pagedjs_margin-bottom-left-corner", (r) => {
				return window.getComputedStyle(r)["text-align"];
			});

			expect(pages).toEqual("right");
		})

		it('Render the bottom-left-corner in the middle', async () => {
			let pages = await page.$eval(".pagedjs_margin-bottom-left-corner", (r) => {
				return window.getComputedStyle(r)["align-items"];
			});

			expect(pages).toEqual("center");
		})

		it('Render the bottom-left aligned left', async () => {
			let pages = await page.$eval(".pagedjs_margin-bottom-left", (r) => {
				return window.getComputedStyle(r)["text-align"];
			});

			expect(pages).toEqual("left");
		})

		it('Render the bottom-left in the middle', async () => {
			let pages = await page.$eval(".pagedjs_margin-top-left", (r) => {
				return window.getComputedStyle(r)["align-items"];
			});

			expect(pages).toEqual("center");
		})

		it('Render the bottom-center aligned center', async () => {
			let pages = await page.$eval(".pagedjs_margin-bottom-center", (r) => {
				return window.getComputedStyle(r)["text-align"];
			});

			expect(pages).toEqual("center");
		})

		it('Render the bottom-center in the middle', async () => {
			let pages = await page.$eval(".pagedjs_margin-bottom-center", (r) => {
				return window.getComputedStyle(r)["align-items"];
			});

			expect(pages).toEqual("center");
		})

		it('Render the bottom-right aligned right', async () => {
			let pages = await page.$eval(".pagedjs_margin-bottom-right", (r) => {
				return window.getComputedStyle(r)["text-align"];
			});

			expect(pages).toEqual("right");
		})

		it('Render the bottom-right in the middle', async () => {
			let pages = await page.$eval(".pagedjs_margin-bottom-right", (r) => {
				return window.getComputedStyle(r)["align-items"];
			});

			expect(pages).toEqual("center");
		})

		it('Render the bottom-right-corner aligned left', async () => {
			let pages = await page.$eval(".pagedjs_margin-bottom-right-corner", (r) => {
				return window.getComputedStyle(r)["text-align"];
			});

			expect(pages).toEqual("left");
		})

		it('Render the bottom-right-corner in the middle', async () => {
			let pages = await page.$eval(".pagedjs_margin-bottom-right-corner", (r) => {
				return window.getComputedStyle(r)["align-items"];
			});

			expect(pages).toEqual("center");
		})

		if (!DEBUG) {
			it('should create a pdf', async () => {
				let pdf = await page.pdf(PDF_SETTINGS);

				expect(pdf).toMatchPDFSnapshot(1);
			})
		}
	}
)

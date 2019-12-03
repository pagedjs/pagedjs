const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe("first", async () => {
	let page;
	let rendered;
	beforeAll(async () => {
		page = await loadPage("string/string-first.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("should set the running header as \"aaa\" on the first page", async () => {
		let text = await page.$eval(".pagedjs_first_page", (r) => 
			window.getComputedStyle(r).getPropertyValue("--pagedjs-string-alphabet"));		
		expect(text).toEqual("\"aaa\"");
	});

	it("should set the running header as \"fff\" on the second page", async () => {
		let text = await page.$eval("#page-2", (r) => 
			window.getComputedStyle(r).getPropertyValue("--pagedjs-string-alphabet"));		
		expect(text).toEqual("\"fff\"");
	});

		
});



describe("last", async () => {
	let page;
	let rendered;
	beforeAll(async () => {
		page = await loadPage("string/string-last.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("should set the running header as \"fff\" on the first page", async () => {
		let text = await page.$eval(".pagedjs_first_page", (r) => 
			window.getComputedStyle(r).getPropertyValue("--pagedjs-string-alphabet"));		
		expect(text).toEqual("\"fff\"");
	});

	it("should set the running header as \"fff\" on the second page", async () => {
		let text = await page.$eval("#page-2", (r) => 
			window.getComputedStyle(r).getPropertyValue("--pagedjs-string-alphabet"));		
		expect(text).toEqual("\"fff\"");
	});

		
});





describe("first-except", async () => {
	let page;
	let rendered;
	beforeAll(async () => {
		page = await loadPage("string/string-first-except.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("should set the running header as nothing on the first page", async () => {
		let text = await page.$eval(".pagedjs_first_page", (r) => 
			window.getComputedStyle(r).getPropertyValue("--pagedjs-string-alphabet"));		
		expect(text).toEqual("\"\"");
	});

	it("should set the running header as \"aaa\" on the second page", async () => {
		let text = await page.$eval("#page-2", (r) => 
			window.getComputedStyle(r).getPropertyValue("--pagedjs-string-alphabet"));		
		expect(text).toEqual("\"aaa\"");
	});

		
});



describe("string-start", async () => {
	let page;
	let rendered;
	beforeAll(async () => {
		page = await loadPage("string/string-start.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("should set the running header as nothing on the first page", async () => {
		let text = await page.$eval(".pagedjs_first_page", (r) => 
			window.getComputedStyle(r).getPropertyValue("--pagedjs-string-alphabet"));		
		expect(text).toEqual("\"aaa\"");
	});

	it("should set the running header as \"fff\" on the third page", async () => {
		let text = await page.$eval("#page-3", (r) => 
			window.getComputedStyle(r).getPropertyValue("--pagedjs-string-alphabet"));		
		expect(text).toEqual("\"fff\"");
	});
	it("should set the running header as \"ggg\" on page 4", async () => {
		let text = await page.$eval("#page-4", (r) => 
			window.getComputedStyle(r).getPropertyValue("--pagedjs-string-alphabet"));		
		expect(text).toEqual("\"ggg\"");
	});
		
});
const TIMEOUT = 10000; // Some book might take longer than this to renderer

describe("default", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("string/string-default.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("should set the running header as \"a '' this \" ' aa\" on the first page", async () => {
		let text = await page.$eval(".pagedjs_first_page", (r) =>
			window.getComputedStyle(r).getPropertyValue("--pagedjs-string-alphabet"));
		expect(text).toEqual("\"a ' this \\\" ' aa\"");
	});

	it("should set the running header as \"fff\" on the second page", async () => {
		let text = await page.$eval("#page-2", (r) =>
			window.getComputedStyle(r).getPropertyValue("--pagedjs-string-alphabet"));
		expect(text).toEqual("\"fff\"");
	});
});

describe("first", () => {
	let page;
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

describe("last", () => {
	let page;
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

describe("first-except", () => {
	let page;
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

describe("string-start", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("string/string-start.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	// The start value is empty, as the string had not yet been set at the start of the page.
	// See https://www.w3.org/TR/css-gcpm-3/#string-start
	it("should set the running header as nothing on the first page", async () => {
		let text = await page.$eval(".pagedjs_first_page", (r) =>
			window.getComputedStyle(r).getPropertyValue("--pagedjs-string-alphabet"));
		expect(text).toEqual("\"\"");
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

describe("string-multiple", () => {
	let page;
	beforeAll(async () => {
		page = await loadPage("string/string-multiple.html");
		return page.rendered;
	}, TIMEOUT);

	afterAll(async () => {
		if (!DEBUG) {
			await page.close();
		}
	});

	it("should set the running header as \"aaa\" on the second page", async () => {
		let text = await page.$eval("#page-2", (r) =>
			window.getComputedStyle(r).getPropertyValue("--pagedjs-string-alphabet"));
		expect(text).toEqual("\"aaa\"");
	});
	it("should set the running header as \"1111\" on the second page", async () => {
		let text = await page.$eval("#page-2", (r) =>
			window.getComputedStyle(r).getPropertyValue("--pagedjs-string-alphabetbis"));
		expect(text).toEqual("\"1111\"");
	});
	it("should set the running header as \"fff\" on the third page", async () => {
		let text = await page.$eval("#page-9", (r) =>
			window.getComputedStyle(r).getPropertyValue("--pagedjs-string-alphabet"));
		expect(text).toEqual("\"bbb\"");
	});
	it("should set the running header as \"fff\" on the third page", async () => {
		let text = await page.$eval("#page-9", (r) =>
			window.getComputedStyle(r).getPropertyValue("--pagedjs-string-alphabetbis"));
		expect(text).toEqual("\"2222\"");
	});
});

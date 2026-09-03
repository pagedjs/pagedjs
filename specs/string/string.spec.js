import { test, expect } from "../test_helpers/fixtures.js";


test.describe("default", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("string/string-default.html");
	});


	test("should set the running header as \"a '' this \" ' aa\" on the first page", async () => {
		let text = await page.$eval("paged-page[first]", (r) =>
			window.getComputedStyle(r).getPropertyValue("--paged-string-first-alphabet"));
		expect(text).toEqual("\"aaa\"");
	});

	test("should set the running header as \"fff\" on the second page", async () => {
		let text = await page.$eval("paged-page[index='1']", (r) =>
			window.getComputedStyle(r).getPropertyValue("--paged-string-first-alphabet"));
		expect(text).toEqual("\"fff\"");
	});
});

test.describe("first", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("string/string-first.html");
	});


	test("should set the running header as \"aaa\" on the first page", async () => {
		let text = await page.$eval("paged-page[first]", (r) =>
			window.getComputedStyle(r).getPropertyValue("--paged-string-first-alphabet"));
		expect(text).toEqual("\"aaa\"");
	});

	test("should set the running header as \"fff\" on the second page", async () => {
		let text = await page.$eval("paged-page[index='1']", (r) =>
			window.getComputedStyle(r).getPropertyValue("--paged-string-first-alphabet"));
		expect(text).toEqual("\"fff\"");
	});
});

test.describe("last", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("string/string-last.html");
	});


	test("should set the running header as \"fff\" on the first page", async () => {
		let text = await page.$eval("paged-page[first]", (r) =>
			window.getComputedStyle(r).getPropertyValue("--paged-string-last-alphabet"));
		expect(text).toEqual("\"fff\"");
	});

	test("should set the running header as \"fff\" on the second page", async () => {
		let text = await page.$eval("paged-page[index='1']", (r) =>
			window.getComputedStyle(r).getPropertyValue("--paged-string-last-alphabet"));
		expect(text).toEqual("\"fff\"");
	});
});

test.describe("first-except", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("string/string-first-except.html");
	});


	test("should set the running header as nothing on the first page", async () => {
		let text = await page.$eval("paged-page[first]", (r) =>
			window.getComputedStyle(r).getPropertyValue("--paged-string-first-except-alphabet"));
		expect(text).toEqual("\"\"");
	});

	test("should set the running header as \"aaa\" on the second page", async () => {
		let text = await page.$eval("paged-page[index='1']", (r) =>
			window.getComputedStyle(r).getPropertyValue("--paged-string-first-except-alphabet"));
		expect(text).toEqual("\"aaa\"");
	});
});

test.describe("string-start", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("string/string-start.html");
	});


	// The start value is empty, as the string had not yet been set at the start of the page.
	// See https://www.w3.org/TR/css-gcpm-3/#string-start
	test("should set the running header as nothing on the first page", async () => {
		let text = await page.$eval("paged-page[first]", (r) =>
			window.getComputedStyle(r).getPropertyValue("--paged-string-start-alphabet"));
		expect(text).toEqual("\"\"");
	});

	test("should set the running header as \"fff\" on the third page", async () => {
		let text = await page.$eval("paged-page[index='2']", (r) =>
			window.getComputedStyle(r).getPropertyValue("--paged-string-start-alphabet"));
		expect(text).toEqual("\"fff\"");
	});
	test("should set the running header as \"ggg\" on page 4", async () => {
		let text = await page.$eval("paged-page[index='3']", (r) =>
			window.getComputedStyle(r).getPropertyValue("--paged-string-start-alphabet"));
		expect(text).toEqual("\"ggg\"");
	});
});

test.describe("string-multiple", () => {
	let page;
	test.beforeAll(async ({ loadPage }) => {
		page = await loadPage("string/string-multiple.html");
	});


	test("should set the running header as \"aaa\" on the second page", async () => {
		let text = await page.$eval("paged-page[index='1']", (r) =>
			window.getComputedStyle(r).getPropertyValue("--paged-string-first-except-alphabet"));
		expect(text).toEqual("\"aaa\"");
	});
	test("should set the running header as \"1111\" on the second page", async () => {
		let text = await page.$eval("paged-page[index='1']", (r) =>
			window.getComputedStyle(r).getPropertyValue("--paged-string-first-except-alphabetbis"));
		expect(text).toEqual("\"1111\"");
	});
	test("should set the running header as \"bbb\" on page 9", async () => {
		let text = await page.$eval("paged-page[index='8']", (r) =>
			window.getComputedStyle(r).getPropertyValue("--paged-string-first-except-alphabet"));
		expect(text).toEqual("\"bbb\"");
	});
	test("should set the running header bis as \"2222\" on page 9", async () => {
		let text = await page.$eval("paged-page[index='8']", (r) =>
			window.getComputedStyle(r).getPropertyValue("--paged-string-first-except-alphabetbis"));
		expect(text).toEqual("\"2222\"");
	});

	test.describe("string-attr", () => {
		let page;
		test.beforeAll(async ({ loadPage }) => {
			page = await loadPage("string/string-attr.html");
		});
	
		
		test("should set the running header as \"a '' this \" 'Chpater A\" on the first page", async () => {
			let text = await page.$eval("paged-page[first]", (r) =>
				window.getComputedStyle(r).getPropertyValue("--paged-string-first-alphabet"));
			expect(text).toEqual("\"Chapter A\"");
		});
	
		test("should set the running header as \"Chapter F\" on the second page", async () => {
			let text = await page.$eval("paged-page[index='1']", (r) =>
				window.getComputedStyle(r).getPropertyValue("--paged-string-first-alphabet"));
			expect(text).toEqual("\"Chapter F\"");
		});
	});
});

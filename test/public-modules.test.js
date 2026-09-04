import { test, expect } from "./browser-fixture.js";

test("imports components without loading the transformer", async ({ page }) => {
	const requests = [];
	page.on("request", (request) => requests.push(request.url()));
	const result = await page.evaluate(async () => {
		const components = await import("pagedjs/components.js");
		return { exports: Object.keys(components), registered: customElements.get("paged-page") === components.PagedPage };
	});
	expect(result.exports).toEqual(["PagedDocument", "PagedMarginBox", "PagedMarginContent", "PagedMargins", "PagedPage"]);
	expect(result.registered).toBe(true);
	expect(requests.filter((url) => /css-tree|css-transformer/.test(url))).toEqual([]);
});

test("imports the standalone transformer without other runtime modules", async ({ page }) => {
	const requests = [];
	page.on("request", (request) => requests.push(request.url()));
	const result = await page.evaluate(async () => {
		const module = await import("@pagedjs/css-transformer");
		const transformer = new module.CssTransformer();
		return { exports: Object.keys(module), css: transformer.generate(await transformer.prepare("p{color:red}")) };
	});
	expect(result).toEqual({ exports: ["CssTransformer"], css: "p{color:red}" });
	expect(requests).toHaveLength(1);
	expect(requests[0]).toContain("/node_modules/@pagedjs/css-transformer/dist/index.js");
});

for (const entry of ["pagedjs", "pagedjs/polyfill.js"]) {
	test(`imports ${entry} independently with polyfill autorun disabled`, async ({ page }) => {
		const result = await page.evaluate(async (entry) => {
			window.PagedConfig = { auto: false };
			const module = await import(entry);
			const api = entry === "pagedjs" ? module : window.Paged;
			return {
				preview: typeof api.PagedPreview,
				stylesheet: typeof api.PrintStyleSheet,
				fragmenter: typeof api.Fragmenter,
				polyfill: entry === "pagedjs" || module.default instanceof api.PagedPreview,
				registered: customElements.get("paged-page") === api.components.PagedPage,
				pages: document.querySelectorAll("paged-document").length,
			};
		}, entry);
		expect(result).toEqual({ preview: "function", stylesheet: "function", fragmenter: "function", polyfill: true, registered: true, pages: 0 });
	});
}

test("public modules share class identities and the prepared page data path", async ({ page }) => {
	const result = await page.evaluate(async () => {
		window.PagedConfig = { auto: false };
		const [api, components, polyfill, { CssTransformer }, fragmentainers] = await Promise.all([
			import("pagedjs"), import("pagedjs/components.js"), import("pagedjs/polyfill.js"),
			import("@pagedjs/css-transformer"), import("fragmentainers"),
		]);
		const sheet = await api.PrintStyleSheet.fromText("@page{size:A4}@media screen{@page{size:A5}}");
		return {
			components: api.components.PagedPage === components.PagedPage,
			fragmenter: api.Fragmenter === fragmentainers.Fragmenter,
			preview: polyfill.default instanceof api.PagedPreview,
			global: window.Paged === api,
			transformer: typeof CssTransformer.prototype.generate,
			sizes: sheet.toJSON().map((rule) => rule.size),
		};
	});
	expect(result).toEqual({ components: true, fragmenter: true, preview: true, global: true, transformer: "function", sizes: ["A4"] });
});

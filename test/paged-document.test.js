import { test, expect } from "./browser-fixture.js";

test.describe("PagedDocument", () => {
	test("defines the document and page counter plumbing", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { PagedPage } = await import("/src/components/PagedPage/PagedPage.js");
			await import("/src/components/PagedMargins/PagedMargins.js");
			const { PagedDocument } = await import("/src/components/PagedDocument/PagedDocument.js");
			try {
				__results.push({ actual: PagedDocument.styles.cssText, args: ["counter-reset: page 0 pages var(--paged-page-count, 0);"], label: undefined });
				__results.push({ actual: PagedPage.styles.cssText, args: ["counter-increment: page;"], label: undefined });
			} finally {
				document.body.replaceChildren();
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toContain(...results[0].args);
		expect(results[1].actual, results[1].label).toContain(...results[1].args);
	});

	test("settles its pages within a single update", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("/src/components/PagedPage/PagedPage.js");
			await import("/src/components/PagedMargins/PagedMargins.js");
			await import("/src/components/PagedDocument/PagedDocument.js");
			try {
				const pagedDocument = document.createElement("paged-document");
				const page = pagedDocument.addPage();
				document.body.appendChild(pagedDocument);
				await pagedDocument.updateComplete;
				__results.push({ actual: page.marginBox("top-center")?.id, args: ["top-center"], label: undefined });
			} finally {
				document.body.replaceChildren();
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("indexes assigned pages and maintains the total page count", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("/src/components/PagedPage/PagedPage.js");
			await import("/src/components/PagedMargins/PagedMargins.js");
			await import("/src/components/PagedDocument/PagedDocument.js");
			function nextTask() {
				return new Promise((resolve) => setTimeout(resolve, 0));
			}
			try {
				const pagedDocument = document.createElement("paged-document");
				const first = pagedDocument.addPage();
				const second = pagedDocument.addPage();
				document.body.appendChild(pagedDocument);
				await pagedDocument.updateComplete;
				__results.push({ actual: first.getAttribute("index"), args: ["0"], label: undefined });
				__results.push({ actual: second.getAttribute("index"), args: ["1"], label: undefined });
				__results.push({ actual: pagedDocument.style.getPropertyValue("--paged-page-count"), args: ["2"], label: undefined });
				first.remove();
				await nextTask();
				__results.push({ actual: second.getAttribute("index"), args: ["0"], label: undefined });
				__results.push({ actual: pagedDocument.style.getPropertyValue("--paged-page-count"), args: ["1"], label: undefined });
			} finally {
				document.body.replaceChildren();
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
		expect(results[2].actual, results[2].label).toBe(...results[2].args);
		expect(results[3].actual, results[3].label).toBe(...results[3].args);
		expect(results[4].actual, results[4].label).toBe(...results[4].args);
	});
});

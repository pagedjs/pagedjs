import { afterEach, describe, expect, it } from "../browser-suite.js";
import { PagedPage } from "/src/components/PagedPage/PagedPage.js";
// The page resolves its boxes only once `<paged-margins>` is defined.
import "/src/components/PagedMargins/PagedMargins.js";
import { PagedDocument } from "/src/components/PagedDocument/PagedDocument.js";

afterEach(() => {
	document.body.replaceChildren();
});

function nextTask() {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("PagedDocument", () => {
	it("defines the document and page counter plumbing", () => {
		expect(PagedDocument.styles.cssText).toContain(
			"counter-reset: page 0 pages var(--paged-page-count, 0);",
		);
		expect(PagedPage.styles.cssText).toContain("counter-increment: page;");
	});

	it("settles its pages within a single update", async () => {
		// Pages are separate elements with their own update cycles, and each folds
		// its margins into its own `updateComplete`, so awaiting the document is
		// awaiting the whole tree.
		const pagedDocument = document.createElement("paged-document");
		const page = pagedDocument.addPage();

		document.body.appendChild(pagedDocument);
		await pagedDocument.updateComplete;

		expect(page.marginBox("top-center")?.id).toBe("top-center");
	});

	it("indexes assigned pages and maintains the total page count", async () => {
		const pagedDocument = document.createElement("paged-document");
		const first = pagedDocument.addPage();
		const second = pagedDocument.addPage();

		document.body.appendChild(pagedDocument);
		await pagedDocument.updateComplete;

		expect(first.getAttribute("index")).toBe("0");
		expect(second.getAttribute("index")).toBe("1");
		expect(pagedDocument.style.getPropertyValue("--paged-page-count")).toBe("2");

		first.remove();
		await nextTask();

		expect(second.getAttribute("index")).toBe("0");
		expect(pagedDocument.style.getPropertyValue("--paged-page-count")).toBe("1");
	});
});

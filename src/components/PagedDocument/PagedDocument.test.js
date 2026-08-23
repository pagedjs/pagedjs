import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PagedPage } from "../PagedPage/PagedPage.js";
import { PagedDocument } from "./PagedDocument.js";

let originalAttachInternals;

beforeAll(() => {
	originalAttachInternals = HTMLElement.prototype.attachInternals;
	HTMLElement.prototype.attachInternals = () => ({ states: new Set() });
});

afterEach(() => {
	document.body.replaceChildren();
});

afterAll(() => {
	HTMLElement.prototype.attachInternals = originalAttachInternals;
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

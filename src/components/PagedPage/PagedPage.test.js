import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PagedPage } from "./PagedPage.js";

let originalAttachInternals;

beforeAll(() => {
	originalAttachInternals = HTMLElement.prototype.attachInternals;
	HTMLElement.prototype.attachInternals = () => ({ states: new Set() });
});

afterEach(() => {
	document.body.replaceChildren();
	document.head.querySelectorAll("style[data-test]").forEach((style) => {
		style.remove();
	});
});

afterAll(() => {
	HTMLElement.prototype.attachInternals = originalAttachInternals;
});

async function settle(page) {
	await page.updateComplete;
	await page.updateComplete;
}

function addPageStyle(cssText) {
	const style = document.createElement("style");
	style.dataset.test = "";
	style.textContent = cssText;
	document.head.appendChild(style);
}

describe("PagedPage", () => {
	it("renders marks from the cascaded marks and bleed custom properties", async () => {
		addPageStyle(`
			paged-page {
				--paged-marks: crop cross;
				--paged-bleed: 3mm;
			}
		`);
		const page = document.createElement("paged-page");
		document.body.appendChild(page);

		await settle(page);

		expect(page.shadowRoot.querySelectorAll(".paged-crop")).toHaveLength(4);
		expect(page.shadowRoot.querySelectorAll(".paged-cross")).toHaveLength(4);
	});

	it("resolves marks after page identity and state attributes are reflected", async () => {
		addPageStyle(`
			paged-page[name="chapter"][first] {
				--paged-marks: crop;
				--paged-bleed: 3mm;
			}
		`);
		const page = document.createElement("paged-page");
		page.name = "chapter";
		page.first = true;
		document.body.appendChild(page);

		await settle(page);

		expect(page.shadowRoot.querySelectorAll(".paged-crop")).toHaveLength(4);
	});

	it("does not render marks when the cascaded bleed is zero", async () => {
		addPageStyle(`
			paged-page {
				--paged-marks: crop cross;
				--paged-bleed: 0px;
			}
		`);
		const page = document.createElement("paged-page");
		document.body.appendChild(page);

		await settle(page);

		expect(page.shadowRoot.querySelector(".paged-crop")).toBeNull();
		expect(page.shadowRoot.querySelector(".paged-cross")).toBeNull();
	});

	it("retains direct marks and bleed property configuration", async () => {
		const page = document.createElement("paged-page");
		page.marks = "crop";
		page.bleed = "3mm";
		document.body.appendChild(page);

		await settle(page);

		expect(page.shadowRoot.querySelectorAll(".paged-crop")).toHaveLength(4);
		expect(page.shadowRoot.querySelector(".paged-cross")).toBeNull();
	});

	it("exposes the composed footnote area separately from the content area", async () => {
		const page = document.createElement("paged-page");
		const content = document.createElement("fragment-container");
		const footnotes = document.createElement("div");
		footnotes.setAttribute("data-footnote-area", "");
		content.appendChild(footnotes);
		page.appendChild(content);
		document.body.appendChild(page);

		await settle(page);

		expect(page.contentArea).toBe(content);
		expect(page.footnotesArea).toBe(footnotes);
	});

	it("injects only its page-specific sheet when self-configuration is enabled", () => {
		const originalCSS = globalThis.CSS;
		const originalReplaceSync = CSSStyleSheet.prototype.replaceSync;
		const adoptedDescriptor = Object.getOwnPropertyDescriptor(
			document,
			"adoptedStyleSheets",
		);
		Object.defineProperty(document, "adoptedStyleSheets", {
			configurable: true,
			writable: true,
			value: [],
		});
		CSSStyleSheet.prototype.replaceSync = function replaceSync(cssText) {
			this.testCssText = cssText;
		};
		globalThis.CSS = { supports: () => true };

		try {
			const page = document.createElement("paged-page");
			page.name = "standalone";
			page.width = "210mm";
			page.height = "297mm";
			page.inject = true;
			document.body.appendChild(page);

			expect(document.adoptedStyleSheets).toHaveLength(1);
			expect(document.adoptedStyleSheets[0].testCssText).toContain(
				"@page standalone",
			);
			expect(document.adoptedStyleSheets[0].testCssText).not.toContain(
				"@media print",
			);
		} finally {
			globalThis.CSS = originalCSS;
			if (originalReplaceSync) {
				CSSStyleSheet.prototype.replaceSync = originalReplaceSync;
			} else {
				delete CSSStyleSheet.prototype.replaceSync;
			}
			if (adoptedDescriptor) {
				Object.defineProperty(document, "adoptedStyleSheets", adoptedDescriptor);
			} else {
				delete document.adoptedStyleSheets;
			}
		}
	});

	it("contains valid page styles and owns only the page counter increment", () => {
		const styles = PagedPage.styles.cssText;

		expect(styles).toContain("counter-increment: page;");
		expect(styles).toContain("height: 100%;");
		expect(styles).not.toContain("heigth");
		expect(styles).not.toContain("//");
		expect(styles).not.toMatch(/\bbody\s*\{/);
		expect(styles).not.toContain("@media print");
	});
});

import { test, expect } from "./browser-fixture.js";

test.describe("PagedPage", () => {
	test("mirrors --paged- annotations from the fragmentainer onto the host", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("/src/components/PagedPage/PagedPage.js");
			await import("/src/components/PagedMargins/PagedMargins.js");
			async function settle(page) {
				await page.updateComplete;
				await page.updateComplete;
			}
			async function pageWithFragment(properties = {}) {
				const page = document.createElement("paged-page");
				const container = document.createElement("fragment-container");
				for (const [name, value] of Object.entries(properties)) {
					container.style.setProperty(name, value);
				}
				page.appendChild(container);
				document.body.appendChild(page);
				await settle(page);
				return { page, container };
			}
			try {
				const { page } = await pageWithFragment({
					"--paged-page": "4",
					"--paged-string-first-title": "\"Chapter\"",
				});
				__results.push({ actual: page.style.getPropertyValue("--paged-page"), args: ["4"], label: undefined });
				__results.push({ actual: page.style.getPropertyValue("--paged-string-first-title"), args: ["\"Chapter\""], label: undefined });
			} finally {
				document.body.replaceChildren();
				document.head.querySelectorAll("style[data-test]").forEach((style) => {
					style.remove();
				});
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("copies nothing outside the --paged- namespace", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("/src/components/PagedPage/PagedPage.js");
			await import("/src/components/PagedMargins/PagedMargins.js");
			async function settle(page) {
				await page.updateComplete;
				await page.updateComplete;
			}
			async function pageWithFragment(properties = {}) {
				const page = document.createElement("paged-page");
				const container = document.createElement("fragment-container");
				for (const [name, value] of Object.entries(properties)) {
					container.style.setProperty(name, value);
				}
				page.appendChild(container);
				document.body.appendChild(page);
				await settle(page);
				return { page, container };
			}
			try {
				const { page } = await pageWithFragment({ "--theme-accent": "red", color: "blue" });
				__results.push({ actual: page.style.getPropertyValue("--theme-accent"), args: [""], label: undefined });
				__results.push({ actual: page.style.getPropertyValue("color"), args: [""], label: undefined });
			} finally {
				document.body.replaceChildren();
				document.head.querySelectorAll("style[data-test]").forEach((style) => {
					style.remove();
				});
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("hands the engine's page value to the cascade", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { PagedPage } = await import("/src/components/PagedPage/PagedPage.js");
			await import("/src/components/PagedMargins/PagedMargins.js");
			try {
				__results.push({ actual: PagedPage.styles.cssText, args: ["counter-set: page var(--paged-page);"], label: undefined });
				__results.push({ actual: PagedPage.styles.cssText, args: ["counter-increment: page;"], label: undefined });
			} finally {
				document.body.replaceChildren();
				document.head.querySelectorAll("style[data-test]").forEach((style) => {
					style.remove();
				});
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toContain(...results[0].args);
		expect(results[1].actual, results[1].label).toContain(...results[1].args);
	});

	test("leaves a standalone page to its own counter increment", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("/src/components/PagedPage/PagedPage.js");
			await import("/src/components/PagedMargins/PagedMargins.js");
			async function settle(page) {
				await page.updateComplete;
				await page.updateComplete;
			}
			try {
				const page = document.createElement("paged-page");
				document.body.appendChild(page);
				await settle(page);
				__results.push({ actual: page.style.getPropertyValue("--paged-page"), args: [""], label: undefined });
			} finally {
				document.body.replaceChildren();
				document.head.querySelectorAll("style[data-test]").forEach((style) => {
					style.remove();
				});
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("places nothing in a box that asked for no running element", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { MARGIN_BOXES } = await import("/src/components/PagedPage/PagedPage.js");
			await import("/src/components/PagedMargins/PagedMargins.js");
			async function settle(page) {
				await page.updateComplete;
				await page.updateComplete;
			}
			async function pageWithFragment(properties = {}) {
				const page = document.createElement("paged-page");
				const container = document.createElement("fragment-container");
				for (const [name, value] of Object.entries(properties)) {
					container.style.setProperty(name, value);
				}
				page.appendChild(container);
				document.body.appendChild(page);
				await settle(page);
				return { page, container };
			}
			try {
				const { page, container } = await pageWithFragment();
				container.runningElements = { header: { first: document.createElement("h1") } };
				page.appendChild(container);
				await settle(page);
				for (const name of MARGIN_BOXES) {
					__results.push({ actual: page.querySelector(`[slot="${name}"]`), args: [null], label: undefined });
				}
			} finally {
				document.body.replaceChildren();
				document.head.querySelectorAll("style[data-test]").forEach((style) => {
					style.remove();
				});
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("forwards every page-margin box slot to its box", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { MARGIN_BOXES } = await import("/src/components/PagedPage/PagedPage.js");
			await import("/src/components/PagedMargins/PagedMargins.js");
			async function settle(page) {
				await page.updateComplete;
				await page.updateComplete;
			}
			function boxContent(page, name) {
				const box = page.marginBox(name);
				const slot = box?.querySelector("slot") ?? box?.shadowRoot?.querySelector("slot");
				return slot?.assignedElements({ flatten: true }) ?? [];
			}
			try {
				const page = document.createElement("paged-page");
				document.body.appendChild(page);
				await settle(page);
				for (const name of MARGIN_BOXES) {
					const content = document.createElement("span");
					content.textContent = name;
					page.setMarginContent(name, content);
				}
				await settle(page);
				for (const name of MARGIN_BOXES) {
					__results.push({ actual: boxContent(page, name).map((node) => node.textContent), args: [[name]], label: undefined });
				}
			} finally {
				document.body.replaceChildren();
				document.head.querySelectorAll("style[data-test]").forEach((style) => {
					style.remove();
				});
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toEqual(...results[0].args);
	});

	test("settles its margins and their boxes within a single update", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("/src/components/PagedPage/PagedPage.js");
			await import("/src/components/PagedMargins/PagedMargins.js");
			try {
				const page = document.createElement("paged-page");
				document.body.appendChild(page);
				await page.updateComplete;
				__results.push({ actual: page.marginBox("top-center")?.id, args: ["top-center"], label: undefined });
				__results.push({ actual: page.marginBox("top-center").slottedElements, args: [[]], label: undefined });
			} finally {
				document.body.replaceChildren();
				document.head.querySelectorAll("style[data-test]").forEach((style) => {
					style.remove();
				});
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toEqual(...results[1].args);
	});

	test("settles a margins element supplied through the slot too", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("/src/components/PagedPage/PagedPage.js");
			await import("/src/components/PagedMargins/PagedMargins.js");
			try {
				const page = document.createElement("paged-page");
				const margins = document.createElement("paged-margins");
				margins.setAttribute("slot", "margins");
				page.appendChild(margins);
				document.body.appendChild(page);
				await page.updateComplete;
				__results.push({ actual: page.marginBox("bottom-center")?.id, args: ["bottom-center"], label: undefined });
			} finally {
				document.body.replaceChildren();
				document.head.querySelectorAll("style[data-test]").forEach((style) => {
					style.remove();
				});
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("reaches the boxes of the default margins element the slot falls back to", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("/src/components/PagedPage/PagedPage.js");
			await import("/src/components/PagedMargins/PagedMargins.js");
			async function settle(page) {
				await page.updateComplete;
				await page.updateComplete;
			}
			try {
				const page = document.createElement("paged-page");
				document.body.appendChild(page);
				await settle(page);
				__results.push({ actual: page.marginsArea?.localName, args: ["paged-margins"], label: undefined });
				__results.push({ actual: page.marginBox("top-center")?.id, args: ["top-center"], label: undefined });
			} finally {
				document.body.replaceChildren();
				document.head.querySelectorAll("style[data-test]").forEach((style) => {
					style.remove();
				});
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("reaches the boxes of a margins element supplied through the slot", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("/src/components/PagedPage/PagedPage.js");
			await import("/src/components/PagedMargins/PagedMargins.js");
			async function settle(page) {
				await page.updateComplete;
				await page.updateComplete;
			}
			try {
				const page = document.createElement("paged-page");
				const margins = document.createElement("paged-margins");
				margins.setAttribute("slot", "margins");
				page.appendChild(margins);
				document.body.appendChild(page);
				await settle(page);
				__results.push({ actual: page.marginsArea, args: [margins], label: undefined });
				__results.push({ actual: page.marginBox("bottom-center")?.id, args: ["bottom-center"], label: undefined });
			} finally {
				document.body.replaceChildren();
				document.head.querySelectorAll("style[data-test]").forEach((style) => {
					style.remove();
				});
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("replaces what a box already held", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("/src/components/PagedPage/PagedPage.js");
			await import("/src/components/PagedMargins/PagedMargins.js");
			async function settle(page) {
				await page.updateComplete;
				await page.updateComplete;
			}
			function boxContent(page, name) {
				const box = page.marginBox(name);
				const slot = box?.querySelector("slot") ?? box?.shadowRoot?.querySelector("slot");
				return slot?.assignedElements({ flatten: true }) ?? [];
			}
			try {
				const page = document.createElement("paged-page");
				document.body.appendChild(page);
				await settle(page);
				const first = document.createElement("span");
				first.textContent = "first";
				const second = document.createElement("span");
				second.textContent = "second";
				page.setMarginContent("top-center", first);
				page.setMarginContent("top-center", second);
				await settle(page);
				__results.push({ actual: boxContent(page, "top-center").map((node) => node.textContent), args: [[
					"second",
				]], label: undefined });
			} finally {
				document.body.replaceChildren();
				document.head.querySelectorAll("style[data-test]").forEach((style) => {
					style.remove();
				});
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toEqual(...results[0].args);
	});

	test("clears a box", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("/src/components/PagedPage/PagedPage.js");
			await import("/src/components/PagedMargins/PagedMargins.js");
			async function settle(page) {
				await page.updateComplete;
				await page.updateComplete;
			}
			function boxContent(page, name) {
				const box = page.marginBox(name);
				const slot = box?.querySelector("slot") ?? box?.shadowRoot?.querySelector("slot");
				return slot?.assignedElements({ flatten: true }) ?? [];
			}
			try {
				const page = document.createElement("paged-page");
				document.body.appendChild(page);
				await settle(page);
				const content = document.createElement("span");
				page.setMarginContent("top-left", content);
				page.clearMarginContent("top-left");
				await settle(page);
				__results.push({ actual: boxContent(page, "top-left"), args: [[]], label: undefined });
				__results.push({ actual: page.querySelector("[slot='top-left']"), args: [null], label: undefined });
			} finally {
				document.body.replaceChildren();
				document.head.querySelectorAll("style[data-test]").forEach((style) => {
					style.remove();
				});
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toEqual(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("refuses a name that is not a page-margin box", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("/src/components/PagedPage/PagedPage.js");
			await import("/src/components/PagedMargins/PagedMargins.js");
			async function settle(page) {
				await page.updateComplete;
				await page.updateComplete;
			}
			try {
				const page = document.createElement("paged-page");
				document.body.appendChild(page);
				await settle(page);
				__results.push({ actual: (() => { try { (() => page.setMarginContent("middle", document.createElement("span")))(); return ""; } catch (error) { return String(error?.message ?? error); } })(), args: [/not a page-margin box/], label: undefined });
				__results.push({ actual: (() => { try { (() => page.clearMarginContent("middle"))(); return ""; } catch (error) { return String(error?.message ?? error); } })(), args: [/not a page-margin box/], label: undefined });
				__results.push({ actual: page.marginBox("middle"), args: [null], label: undefined });
			} finally {
				document.body.replaceChildren();
				document.head.querySelectorAll("style[data-test]").forEach((style) => {
					style.remove();
				});
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toMatch(...results[0].args);
		expect(results[1].actual, results[1].label).toMatch(...results[1].args);
		expect(results[2].actual, results[2].label).toBe(...results[2].args);
	});

	test("renders marks from the cascaded marks and bleed custom properties", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("/src/components/PagedPage/PagedPage.js");
			await import("/src/components/PagedMargins/PagedMargins.js");
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
			try {
				addPageStyle(`
							paged-page {
								--paged-marks: crop cross;
								--paged-bleed: 3mm;
							}
						`);
				const page = document.createElement("paged-page");
				document.body.appendChild(page);
				await settle(page);
				__results.push({ actual: (page.shadowRoot.querySelectorAll(".paged-crop")).length, args: [4], label: undefined });
				__results.push({ actual: (page.shadowRoot.querySelectorAll(".paged-cross")).length, args: [4], label: undefined });
			} finally {
				document.body.replaceChildren();
				document.head.querySelectorAll("style[data-test]").forEach((style) => {
					style.remove();
				});
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("resolves marks after page identity and state attributes are reflected", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("/src/components/PagedPage/PagedPage.js");
			await import("/src/components/PagedMargins/PagedMargins.js");
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
			try {
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
				__results.push({ actual: (page.shadowRoot.querySelectorAll(".paged-crop")).length, args: [4], label: undefined });
			} finally {
				document.body.replaceChildren();
				document.head.querySelectorAll("style[data-test]").forEach((style) => {
					style.remove();
				});
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("does not render marks when the cascaded bleed is zero", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("/src/components/PagedPage/PagedPage.js");
			await import("/src/components/PagedMargins/PagedMargins.js");
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
			try {
				addPageStyle(`
							paged-page {
								--paged-marks: crop cross;
								--paged-bleed: 0px;
							}
						`);
				const page = document.createElement("paged-page");
				document.body.appendChild(page);
				await settle(page);
				__results.push({ actual: page.shadowRoot.querySelector(".paged-crop"), args: [], label: undefined });
				__results.push({ actual: page.shadowRoot.querySelector(".paged-cross"), args: [], label: undefined });
			} finally {
				document.body.replaceChildren();
				document.head.querySelectorAll("style[data-test]").forEach((style) => {
					style.remove();
				});
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toBeNull(...results[0].args);
		expect(results[1].actual, results[1].label).toBeNull(...results[1].args);
	});

	test("retains direct marks and bleed property configuration", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("/src/components/PagedPage/PagedPage.js");
			await import("/src/components/PagedMargins/PagedMargins.js");
			async function settle(page) {
				await page.updateComplete;
				await page.updateComplete;
			}
			try {
				const page = document.createElement("paged-page");
				page.marks = "crop";
				page.bleed = "3mm";
				document.body.appendChild(page);
				await settle(page);
				__results.push({ actual: (page.shadowRoot.querySelectorAll(".paged-crop")).length, args: [4], label: undefined });
				__results.push({ actual: page.shadowRoot.querySelector(".paged-cross"), args: [], label: undefined });
			} finally {
				document.body.replaceChildren();
				document.head.querySelectorAll("style[data-test]").forEach((style) => {
					style.remove();
				});
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBeNull(...results[1].args);
	});

	test("exposes the composed footnote area separately from the content area", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("/src/components/PagedPage/PagedPage.js");
			await import("/src/components/PagedMargins/PagedMargins.js");
			async function settle(page) {
				await page.updateComplete;
				await page.updateComplete;
			}
			try {
				const page = document.createElement("paged-page");
				const content = document.createElement("fragment-container");
				const footnotes = document.createElement("div");
				footnotes.setAttribute("data-footnote-area", "");
				content.appendChild(footnotes);
				page.appendChild(content);
				document.body.appendChild(page);
				await settle(page);
				__results.push({ actual: page.contentArea, args: [content], label: undefined });
				__results.push({ actual: page.footnotesArea, args: [footnotes], label: undefined });
			} finally {
				document.body.replaceChildren();
				document.head.querySelectorAll("style[data-test]").forEach((style) => {
					style.remove();
				});
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("injects only its page-specific sheet when self-configuration is enabled", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			await import("/src/components/PagedPage/PagedPage.js");
			await import("/src/components/PagedMargins/PagedMargins.js");
			try {
				const originalSheets = [...document.adoptedStyleSheets];
				const page = document.createElement("paged-page");
				page.name = "standalone";
				page.width = "210mm";
				page.height = "297mm";
				page.inject = true;
				document.body.appendChild(page);
				const injected = document.adoptedStyleSheets.find(
					(sheet) => !originalSheets.includes(sheet),
				);
				const cssText = [...injected.cssRules].map((rule) => rule.cssText).join("\n");
				__results.push({ actual: (document.adoptedStyleSheets).length, args: [originalSheets.length + 1], label: undefined });
				__results.push({ actual: cssText, args: ["@page standalone"], label: undefined });
				__results.push({ actual: cssText, args: ["@media print"], label: undefined });
			} finally {
				document.body.replaceChildren();
				document.head.querySelectorAll("style[data-test]").forEach((style) => {
					style.remove();
				});
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toContain(...results[1].args);
		expect(results[2].actual, results[2].label).not.toContain(...results[2].args);
	});

	test("contains valid page styles and owns only the page counter increment", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { PagedPage } = await import("/src/components/PagedPage/PagedPage.js");
			await import("/src/components/PagedMargins/PagedMargins.js");
			try {
				const styles = PagedPage.styles.cssText;
				__results.push({ actual: styles, args: ["counter-increment: page;"], label: undefined });
				__results.push({ actual: styles, args: ["height: 100%;"], label: undefined });
				__results.push({ actual: styles, args: ["heigth"], label: undefined });
				__results.push({ actual: styles, args: ["//"], label: undefined });
				__results.push({ actual: styles, args: [/\bbody\s*\{/], label: undefined });
				__results.push({ actual: styles, args: ["@media print"], label: undefined });
			} finally {
				document.body.replaceChildren();
				document.head.querySelectorAll("style[data-test]").forEach((style) => {
					style.remove();
				});
			}
			return __results;
		});
		expect(results[0].actual, results[0].label).toContain(...results[0].args);
		expect(results[1].actual, results[1].label).toContain(...results[1].args);
		expect(results[2].actual, results[2].label).not.toContain(...results[2].args);
		expect(results[3].actual, results[3].label).not.toContain(...results[3].args);
		expect(results[4].actual, results[4].label).not.toMatch(...results[4].args);
		expect(results[5].actual, results[5].label).not.toContain(...results[5].args);
	});
});

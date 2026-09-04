import { test, expect } from "./browser-fixture.js";

test.describe("running elements", () => {
	test("renames position: running() into a custom property", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { RunningElements } = await import("/src/handlers/running-elements.js");
			async function rewrite(css) {
				const transformer = new CssTransformer({ rules: RunningElements.rules });
				return transformer.generate(transformer.apply(await transformer.prepare(css)));
			}
			__results.push({ actual: await rewrite(".header { position: running(head) }"), args: [".header{--page-position:running(head)}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("does not hide the running element in CSS", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { RunningElements } = await import("/src/handlers/running-elements.js");
			async function rewrite(css) {
				const transformer = new CssTransformer({ rules: RunningElements.rules });
				return transformer.generate(transformer.apply(await transformer.prepare(css)));
			}
			__results.push({ actual: await rewrite(".header { position: running(head) }"), args: ["display"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).not.toContain(...results[0].args);
	});

	test("splits element() into empty content and a named request", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { RunningElements } = await import("/src/handlers/running-elements.js");
			async function rewrite(css) {
				const transformer = new CssTransformer({ rules: RunningElements.rules });
				return transformer.generate(transformer.apply(await transformer.prepare(css)));
			}
			__results.push({ actual: await rewrite(".box::before { content: element(head) }"), args: [".box::before{content:\"\";--paged-running-element:head first}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("keeps the requested selection mode", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { RunningElements } = await import("/src/handlers/running-elements.js");
			async function rewrite(css) {
				const transformer = new CssTransformer({ rules: RunningElements.rules });
				return transformer.generate(transformer.apply(await transformer.prepare(css)));
			}
			__results.push({ actual: await rewrite(".box::before { content: element(head, last) }"), args: ["--paged-running-element:head last"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toContain(...results[0].args);
	});

	test("falls back to first for a mode that is not a selection mode", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { RunningElements } = await import("/src/handlers/running-elements.js");
			async function rewrite(css) {
				const transformer = new CssTransformer({ rules: RunningElements.rules });
				return transformer.generate(transformer.apply(await transformer.prepare(css)));
			}
			__results.push({ actual: await rewrite(".box::before { content: element(head, sideways) }"), args: ["--paged-running-element:head first"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toContain(...results[0].args);
	});

	test("leaves a reference that is not a valid name alone", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { RunningElements } = await import("/src/handlers/running-elements.js");
			async function rewrite(css) {
				const transformer = new CssTransformer({ rules: RunningElements.rules });
				return transformer.generate(transformer.apply(await transformer.prepare(css)));
			}
			__results.push({ actual: await rewrite(".box::before { content: element(page title) }"), args: [".box::before{content:element(page title)}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("takes the element out of the flow and leaves a box of no size", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { RunningElements } = await import("/src/handlers/running-elements.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createElement("div");
				content.innerHTML = html;
				document.body.replaceChildren(content);

				const handler = new RunningElements();
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content };
			}
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { content } = setup(
				".header { --page-position: running(head) }",
				"<p>one</p><div class=\"header\">Header</div><p>two</p>",
			);
			__results.push({ actual: content.querySelector(".header"), args: [null], label: undefined });
			const placeholder = content.querySelector("[data-paged-running]");
			__results.push({ actual: placeholder.localName, args: ["span"], label: undefined });
			__results.push({ actual: placeholder.style.height, args: ["0px"], label: undefined });
			__results.push({ actual: placeholder.style.display, args: ["block"], label: undefined });
			__results.push({ actual: placeholder.previousElementSibling.textContent, args: ["one"], label: undefined });
			__results.push({ actual: placeholder.nextElementSibling.textContent, args: ["two"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
		expect(results[2].actual, results[2].label).toBe(...results[2].args);
		expect(results[3].actual, results[3].label).toBe(...results[3].args);
		expect(results[4].actual, results[4].label).toBe(...results[4].args);
		expect(results[5].actual, results[5].label).toBe(...results[5].args);
	});

	test("swaps nothing more on a second preparation", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { RunningElements } = await import("/src/handlers/running-elements.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createElement("div");
				content.innerHTML = html;
				document.body.replaceChildren(content);

				const handler = new RunningElements();
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content };
			}
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, content } = setup(
				".header { --page-position: running(head) }",
				"<div class=\"header\">Header</div>",
			);
			handler.prepareContent(content);
			__results.push({ actual: (content.querySelectorAll("[data-paged-running]")).length, args: [1], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("publishes the retained element, not the placeholder", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { RunningElements } = await import("/src/handlers/running-elements.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createElement("div");
				content.innerHTML = html;
				document.body.replaceChildren(content);

				const handler = new RunningElements();
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content };
			}
			function compose(handler, index, ...nodes) {
				const container = document.createElement("fragment-container");
				container.fragmentIndex = index;
				for (const node of nodes) {
					container.appendChild(
						typeof node === "string" ? document.createTextNode(node) : node.cloneNode(true),
					);
				}
				handler.afterCompose(container);
				return container;
			}
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, content } = setup(
				".header { --page-position: running(head) }",
				"<div class=\"header\">Header</div>",
			);
			const page = compose(handler, 0, content.firstElementChild);
			__results.push({ actual: page.runningElements.head.first.textContent, args: ["Header"], label: undefined });
			__results.push({ actual: page.runningElements.head.first.className, args: ["header"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("resolves the four modes from one page's occurrences", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { RunningElements } = await import("/src/handlers/running-elements.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createElement("div");
				content.innerHTML = html;
				document.body.replaceChildren(content);

				const handler = new RunningElements();
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content };
			}
			function compose(handler, index, ...nodes) {
				const container = document.createElement("fragment-container");
				container.fragmentIndex = index;
				for (const node of nodes) {
					container.appendChild(
						typeof node === "string" ? document.createTextNode(node) : node.cloneNode(true),
					);
				}
				handler.afterCompose(container);
				return container;
			}
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, content } = setup(
				".header { --page-position: running(head) }",
				"<p>lead</p><div class=\"header\">A</div><div class=\"header\">B</div>",
			);
			const page = compose(handler, 0, ...content.children);
			const head = page.runningElements.head;
			__results.push({ actual: head.first.textContent, args: ["A"], label: undefined });
			__results.push({ actual: head.last.textContent, args: ["B"], label: undefined });
			__results.push({ actual: head.start, args: [null], label: undefined });
			__results.push({ actual: head["first-except"], args: [null], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
		expect(results[2].actual, results[2].label).toBe(...results[2].args);
		expect(results[3].actual, results[3].label).toBe(...results[3].args);
	});

	test("takes start from the occurrence that opens the page", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { RunningElements } = await import("/src/handlers/running-elements.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createElement("div");
				content.innerHTML = html;
				document.body.replaceChildren(content);

				const handler = new RunningElements();
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content };
			}
			function compose(handler, index, ...nodes) {
				const container = document.createElement("fragment-container");
				container.fragmentIndex = index;
				for (const node of nodes) {
					container.appendChild(
						typeof node === "string" ? document.createTextNode(node) : node.cloneNode(true),
					);
				}
				handler.afterCompose(container);
				return container;
			}
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, content } = setup(
				".header { --page-position: running(head) }",
				"<div class=\"header\">A</div><p>body</p>",
			);
			const page = compose(handler, 0, ...content.children);
			__results.push({ actual: page.runningElements.head.start.textContent, args: ["A"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("carries the element forward across a page with no occurrence", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { RunningElements } = await import("/src/handlers/running-elements.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createElement("div");
				content.innerHTML = html;
				document.body.replaceChildren(content);

				const handler = new RunningElements();
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content };
			}
			function compose(handler, index, ...nodes) {
				const container = document.createElement("fragment-container");
				container.fragmentIndex = index;
				for (const node of nodes) {
					container.appendChild(
						typeof node === "string" ? document.createTextNode(node) : node.cloneNode(true),
					);
				}
				handler.afterCompose(container);
				return container;
			}
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, content } = setup(
				".header { --page-position: running(head) }",
				"<div class=\"header\">A</div><p>one</p><p>two</p>",
			);
			const [placeholder, one, two] = content.children;
			compose(handler, 0, placeholder, one);
			const second = compose(handler, 1, two);
			const head = second.runningElements.head;
			__results.push({ actual: head.first.textContent, args: ["A"], label: undefined });
			__results.push({ actual: head.last.textContent, args: ["A"], label: undefined });
			__results.push({ actual: head.start.textContent, args: ["A"], label: undefined });
			__results.push({ actual: head["first-except"].textContent, args: ["A"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
		expect(results[2].actual, results[2].label).toBe(...results[2].args);
		expect(results[3].actual, results[3].label).toBe(...results[3].args);
	});

	test("leaves a page before the first occurrence with nothing to project", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { RunningElements } = await import("/src/handlers/running-elements.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createElement("div");
				content.innerHTML = html;
				document.body.replaceChildren(content);

				const handler = new RunningElements();
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content };
			}
			function compose(handler, index, ...nodes) {
				const container = document.createElement("fragment-container");
				container.fragmentIndex = index;
				for (const node of nodes) {
					container.appendChild(
						typeof node === "string" ? document.createTextNode(node) : node.cloneNode(true),
					);
				}
				handler.afterCompose(container);
				return container;
			}
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, content } = setup(
				".header { --page-position: running(head) }",
				"<p>front matter</p><div class=\"header\">A</div>",
			);
			const [front, placeholder] = content.children;
			const first = compose(handler, 0, front);
			const second = compose(handler, 1, placeholder);
			__results.push({ actual: first.runningElements.head.first, args: [null], label: undefined });
			__results.push({ actual: second.runningElements.head.first.textContent, args: ["A"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});
});

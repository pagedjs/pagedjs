import { test, expect } from "./browser-fixture.js";

test.describe("named strings", () => {
	test("renames string-set into a custom property the runtime can read back", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { NamedStrings } = await import("/src/handlers/named-strings.js");
			async function rewrite(css) {
				const transformer = new CssTransformer({ rules: NamedStrings.rules });
				return transformer.generate(transformer.apply(await transformer.prepare(css)));
			}
			__results.push({ actual: await rewrite("h1 { string-set: alphabet content(text) }"), args: ["h1{--string-set:alphabet content(text)}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("rewrites string() to the custom property for its mode", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { NamedStrings } = await import("/src/handlers/named-strings.js");
			async function rewrite(css) {
				const transformer = new CssTransformer({ rules: NamedStrings.rules });
				return transformer.generate(transformer.apply(await transformer.prepare(css)));
			}
			__results.push({ actual: await rewrite(".a::before { content: string(alphabet, last) }"), args: [".a::before{content:var(--paged-string-last-alphabet, \"\")}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("defaults a bare string() to first", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { NamedStrings } = await import("/src/handlers/named-strings.js");
			async function rewrite(css) {
				const transformer = new CssTransformer({ rules: NamedStrings.rules });
				return transformer.generate(transformer.apply(await transformer.prepare(css)));
			}
			__results.push({ actual: await rewrite(".a::before { content: string(alphabet) }"), args: [".a::before{content:var(--paged-string-first-alphabet, \"\")}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("falls back to first for a mode that is not a selection mode", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { NamedStrings } = await import("/src/handlers/named-strings.js");
			async function rewrite(css) {
				const transformer = new CssTransformer({ rules: NamedStrings.rules });
				return transformer.generate(transformer.apply(await transformer.prepare(css)));
			}
			__results.push({ actual: await rewrite(".a::before { content: string(alphabet, sideways) }"), args: [".a::before{content:var(--paged-string-first-alphabet, \"\")}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("rewrites every reference in one declaration", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { NamedStrings } = await import("/src/handlers/named-strings.js");
			async function rewrite(css) {
				const transformer = new CssTransformer({ rules: NamedStrings.rules });
				return transformer.generate(transformer.apply(await transformer.prepare(css)));
			}
			__results.push({ actual: await rewrite(".a::before { content: string(a) \" - \" string(b, last) }"), args: [".a::before{content:var(--paged-string-first-a, \"\")\" - \"var(--paged-string-last-b, \"\")}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("leaves a reference that is not a valid name alone", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { NamedStrings } = await import("/src/handlers/named-strings.js");
			async function rewrite(css) {
				const transformer = new CssTransformer({ rules: NamedStrings.rules });
				return transformer.generate(transformer.apply(await transformer.prepare(css)));
			}
			__results.push({ actual: await rewrite(".a::before { content: string(2 words) }"), args: [".a::before{content:string(2 words)}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("resolves the four modes from one page's assignments", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { NamedStrings } = await import("/src/handlers/named-strings.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createElement("div");
				content.innerHTML = html;
				document.body.replaceChildren(content);

				const handler = new NamedStrings();
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);
				handler.afterMeasurementSetup(content);

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
			const read = (container, mode, name) =>
				container.style.getPropertyValue(`--paged-string-${mode}-${name}`);
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, content } = setup(
				"h1 { --string-set: alphabet content(text) }",
				"<p>lead</p><h1>aaa</h1><p>body</p><h1>bbb</h1>",
			);
			const [lead, first, body, second] = content.children;
			const page = compose(handler, 0, lead, first, body, second);
			__results.push({ actual: read(page, "first", "alphabet"), args: ["\"aaa\""], label: undefined });
			__results.push({ actual: read(page, "last", "alphabet"), args: ["\"bbb\""], label: undefined });
			__results.push({ actual: read(page, "start", "alphabet"), args: ["\"\""], label: undefined });
			__results.push({ actual: read(page, "first-except", "alphabet"), args: ["\"\""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
		expect(results[2].actual, results[2].label).toBe(...results[2].args);
		expect(results[3].actual, results[3].label).toBe(...results[3].args);
	});

	test("takes start from the assignment that opens the page", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { NamedStrings } = await import("/src/handlers/named-strings.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createElement("div");
				content.innerHTML = html;
				document.body.replaceChildren(content);

				const handler = new NamedStrings();
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);
				handler.afterMeasurementSetup(content);

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
			const read = (container, mode, name) =>
				container.style.getPropertyValue(`--paged-string-${mode}-${name}`);
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, content } = setup(
				"h1 { --string-set: alphabet content(text) }",
				"<h1>aaa</h1><p>body</p>",
			);
			const [heading, body] = content.children;
			const page = compose(handler, 0, heading, body);
			__results.push({ actual: read(page, "start", "alphabet"), args: ["\"aaa\""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("carries every mode forward across a page that assigns nothing", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { NamedStrings } = await import("/src/handlers/named-strings.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createElement("div");
				content.innerHTML = html;
				document.body.replaceChildren(content);

				const handler = new NamedStrings();
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);
				handler.afterMeasurementSetup(content);

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
			const read = (container, mode, name) =>
				container.style.getPropertyValue(`--paged-string-${mode}-${name}`);
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, content } = setup(
				"h1 { --string-set: alphabet content(text) }",
				"<h1>aaa</h1><p>one</p><p>two</p>",
			);
			const [heading, one, two] = content.children;
			compose(handler, 0, heading, one);
			const second = compose(handler, 1, two);
			__results.push({ actual: read(second, "first", "alphabet"), args: ["\"aaa\""], label: undefined });
			__results.push({ actual: read(second, "last", "alphabet"), args: ["\"aaa\""], label: undefined });
			__results.push({ actual: read(second, "start", "alphabet"), args: ["\"aaa\""], label: undefined });
			__results.push({ actual: read(second, "first-except", "alphabet"), args: ["\"aaa\""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
		expect(results[2].actual, results[2].label).toBe(...results[2].args);
		expect(results[3].actual, results[3].label).toBe(...results[3].args);
	});

	test("leaves a page before the first assignment empty", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { NamedStrings } = await import("/src/handlers/named-strings.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createElement("div");
				content.innerHTML = html;
				document.body.replaceChildren(content);

				const handler = new NamedStrings();
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);
				handler.afterMeasurementSetup(content);

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
			const read = (container, mode, name) =>
				container.style.getPropertyValue(`--paged-string-${mode}-${name}`);
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, content } = setup(
				"h1 { --string-set: alphabet content(text) }",
				"<p>front matter</p><h1>aaa</h1>",
			);
			const [front, heading] = content.children;
			const first = compose(handler, 0, front);
			const second = compose(handler, 1, heading);
			__results.push({ actual: read(first, "first", "alphabet"), args: ["\"\""], label: undefined });
			__results.push({ actual: read(second, "first", "alphabet"), args: ["\"aaa\""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("concatenates literals with attr()", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { NamedStrings } = await import("/src/handlers/named-strings.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createElement("div");
				content.innerHTML = html;
				document.body.replaceChildren(content);

				const handler = new NamedStrings();
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);
				handler.afterMeasurementSetup(content);

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
			const read = (container, mode, name) =>
				container.style.getPropertyValue(`--paged-string-${mode}-${name}`);
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, content } = setup(
				"h1 { --string-set: chapter \"Ch. \" attr(data-n) }",
				"<h1 data-n=\"4\">aaa</h1>",
			);
			const page = compose(handler, 0, content.firstElementChild);
			__results.push({ actual: read(page, "first", "chapter"), args: ["\"Ch. 4\""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("sets every name a single declaration assigns", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { NamedStrings } = await import("/src/handlers/named-strings.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createElement("div");
				content.innerHTML = html;
				document.body.replaceChildren(content);

				const handler = new NamedStrings();
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);
				handler.afterMeasurementSetup(content);

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
			const read = (container, mode, name) =>
				container.style.getPropertyValue(`--paged-string-${mode}-${name}`);
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, content } = setup(
				"h1 { --string-set: title content(text), slug attr(data-slug) }",
				"<h1 data-slug=\"intro\">aaa</h1>",
			);
			const page = compose(handler, 0, content.firstElementChild);
			__results.push({ actual: read(page, "first", "title"), args: ["\"aaa\""], label: undefined });
			__results.push({ actual: read(page, "first", "slug"), args: ["\"intro\""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("keeps the value the source element holds when the element splits", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { NamedStrings } = await import("/src/handlers/named-strings.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createElement("div");
				content.innerHTML = html;
				document.body.replaceChildren(content);

				const handler = new NamedStrings();
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);
				handler.afterMeasurementSetup(content);

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
			const read = (container, mode, name) =>
				container.style.getPropertyValue(`--paged-string-${mode}-${name}`);
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, content } = setup(
				"h1 { --string-set: alphabet content(text) }",
				"<h1>aaa bbb</h1>",
			);
			const heading = content.firstElementChild;
			const first = compose(handler, 0, heading);
			const continuation = heading.cloneNode(true);
			continuation.textContent = "bbb";
			continuation.setAttribute("data-split-from", "");
			const second = compose(handler, 1, continuation);
			__results.push({ actual: read(first, "first", "alphabet"), args: ["\"aaa bbb\""], label: undefined });
			__results.push({ actual: read(second, "first-except", "alphabet"), args: ["\"aaa bbb\""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("collapses source whitespace and escapes quotes", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { NamedStrings } = await import("/src/handlers/named-strings.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createElement("div");
				content.innerHTML = html;
				document.body.replaceChildren(content);

				const handler = new NamedStrings();
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);
				handler.afterMeasurementSetup(content);

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
			const read = (container, mode, name) =>
				container.style.getPropertyValue(`--paged-string-${mode}-${name}`);
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, content } = setup(
				"h1 { --string-set: alphabet content(text) }",
				"<h1>\n\t\tsaid \"hello\"\n\t</h1>",
			);
			const page = compose(handler, 0, content.firstElementChild);
			__results.push({ actual: read(page, "first", "alphabet"), args: ["\"said \\\"hello\\\"\""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("reads the declaration the cascade resolved, not the first that matched", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { NamedStrings } = await import("/src/handlers/named-strings.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createElement("div");
				content.innerHTML = html;
				document.body.replaceChildren(content);

				const handler = new NamedStrings();
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);
				handler.afterMeasurementSetup(content);

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
			const read = (container, mode, name) =>
				container.style.getPropertyValue(`--paged-string-${mode}-${name}`);
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, content } = setup(
				"h1 { --string-set: alphabet content(text) }"
							+ "h1.override { --string-set: alphabet attr(data-n) }",
				"<h1 class=\"override\" data-n=\"9\">aaa</h1>",
			);
			const page = compose(handler, 0, content.firstElementChild);
			__results.push({ actual: read(page, "first", "alphabet"), args: ["\"9\""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("warns once for a content() argument that needs generated content", async ({ page }) => {
		const warnings = [];
		page.on("console", (message) => {
			if (message.type() === "warning") warnings.push(message.text());
		});
		const results = await page.evaluate(async () => {
			const __results = [];
			const { NamedStrings } = await import("/src/handlers/named-strings.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createElement("div");
				content.innerHTML = html;
				document.body.replaceChildren(content);

				const handler = new NamedStrings();
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);
				handler.afterMeasurementSetup(content);

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
			const read = (container, mode, name) =>
				container.style.getPropertyValue(`--paged-string-${mode}-${name}`);
			document.head.replaceChildren();
			document.body.replaceChildren();

			const { handler, content } = setup(
				"h1 { --string-set: alphabet content(before) }",
				"<h1>aaa</h1><h1>bbb</h1>",
			);
			const page = compose(handler, 0, ...content.children);
			__results.push({ actual: read(page, "first", "alphabet"), args: ["\"\""], label: undefined });


			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(warnings).toHaveLength(1);
	});
});

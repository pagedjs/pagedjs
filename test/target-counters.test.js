import { test, expect } from "./browser-fixture.js";

test.describe("target counters", () => {
	test("rewrites the singular form to a counter the browser formats", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { TargetCounters } = await import("/src/handlers/target-counters.js");
			async function rewrite(css, rules = TargetCounters.rules) {
				const transformer = new CssTransformer({ rules });
				return transformer.generate(transformer.apply(await transformer.prepare(css)));
			}
			__results.push({ actual: await rewrite("a::after { content: target-counter(attr(href), page) }"), args: ["a::after{content:counter(--paged-tc-0);"
							+ "--paged-generated-tc-0-source:\"target-counter(attr(href),page)\"}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("carries the counter style into the rewritten counter()", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { TargetCounters } = await import("/src/handlers/target-counters.js");
			async function rewrite(css, rules = TargetCounters.rules) {
				const transformer = new CssTransformer({ rules });
				return transformer.generate(transformer.apply(await transformer.prepare(css)));
			}
			__results.push({ actual: await rewrite("a::after { content: target-counter(attr(href), page, lower-roman) }"), args: ["content:counter(--paged-tc-0,lower-roman)"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toContain(...results[0].args);
	});

	test("rewrites the plural form to a variable JavaScript fills in", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { TargetCounters } = await import("/src/handlers/target-counters.js");
			async function rewrite(css, rules = TargetCounters.rules) {
				const transformer = new CssTransformer({ rules });
				return transformer.generate(transformer.apply(await transformer.prepare(css)));
			}
			__results.push({ actual: await rewrite("a::after { content: target-counters(attr(href), sub, \".\") }"), args: ["a::after{content:var(--paged-generated-tcs-0, \"\");"
							+ "--paged-generated-tcs-0-source:\"target-counters(attr(href),sub,\\\".\\\")\"}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("numbers the two forms in separate id spaces", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { TargetCounters } = await import("/src/handlers/target-counters.js");
			async function rewrite(css, rules = TargetCounters.rules) {
				const transformer = new CssTransformer({ rules });
				return transformer.generate(transformer.apply(await transformer.prepare(css)));
			}
			const out = await rewrite(
				"a::after { content: target-counter(attr(href), page) }"
							+ "b::after { content: target-counters(attr(href), sub, \".\") }"
							+ "i::after { content: target-counter(attr(href), sub) }",
			);
			__results.push({ actual: out, args: ["--paged-generated-tc-0-source"], label: undefined });
			__results.push({ actual: out, args: ["--paged-generated-tcs-0-source"], label: undefined });
			__results.push({ actual: out, args: ["--paged-generated-tc-1-source"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toContain(...results[0].args);
		expect(results[1].actual, results[1].label).toContain(...results[1].args);
		expect(results[2].actual, results[2].label).toContain(...results[2].args);
	});

	test("restarts occurrence ids for every stylesheet build", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { TargetCounters } = await import("/src/handlers/target-counters.js");
			async function rewrite(css, rules = TargetCounters.rules) {
				const transformer = new CssTransformer({ rules });
				return transformer.generate(transformer.apply(await transformer.prepare(css)));
			}
			const css = "a::after { content: target-counter(attr(href), page) }";
			__results.push({ actual: await rewrite(css, TargetCounters.rules), args: [await rewrite(css, TargetCounters.rules)], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("keeps a typed attr source readable through browser CSSOM", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { TargetCounters } = await import("/src/handlers/target-counters.js");
			async function rewrite(css, rules = TargetCounters.rules) {
				const transformer = new CssTransformer({ rules });
				return transformer.generate(transformer.apply(await transformer.prepare(css)));
			}
			const style = document.createElement("style");
			style.textContent = await rewrite(
				"a::after { content: target-counter(attr(href url), page) }",
			);
			document.head.appendChild(style);
			__results.push({ actual: document.styleSheets[0].cssRules[0].style.getPropertyValue(
				"--paged-generated-tc-0-source",
			), args: ["\"target-counter(attr(href url),page)\""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("leaves target-counter outside a content declaration alone", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { TargetCounters } = await import("/src/handlers/target-counters.js");
			async function rewrite(css, rules = TargetCounters.rules) {
				const transformer = new CssTransformer({ rules });
				return transformer.generate(transformer.apply(await transformer.prepare(css)));
			}
			__results.push({ actual: await rewrite("a::after { width: target-counter(attr(href), page) }"), args: ["a::after{width:target-counter(attr(href),page)}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("resets the generated counter to the target's page", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetCounters } = await import("/src/handlers/target-counters.js");
			function setup(css, html, { pages = [] } = {}) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetCounters();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				// Counter directives are read from computed style, which needs the content
				// connected the way the measurer connects it.
				const host = document.createElement("div");
				host.appendChild(content);
				document.body.replaceChildren(host);
				handler.afterMeasurementSetup(host);

				// `page` resolves through the pass context; every other name does not use it.
				const locate = (element) => {
					const match = pages.find((entry) => entry.element === element.id);
					return match ? [{ index: 0, fragment: { page: match.page } }] : [];
				};

				return { handler, host, budget, locate };
			}
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, host, locate } = setup(
				"a::after { --paged-generated-tc-0-source: \"target-counter(attr(href), page)\" }",
				"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">Chapter</h1>",
				{ pages: [{ element: "chap", page: 4 }] },
			);
			handler.afterLayoutPass({ locate });
			__results.push({ actual: host.querySelector("#ref").style.counterReset, args: ["--paged-tc-0 4"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("reads a url() target and a bare string target", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetCounters } = await import("/src/handlers/target-counters.js");
			function setup(css, html, { pages = [] } = {}) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetCounters();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				// Counter directives are read from computed style, which needs the content
				// connected the way the measurer connects it.
				const host = document.createElement("div");
				host.appendChild(content);
				document.body.replaceChildren(host);
				handler.afterMeasurementSetup(host);

				// `page` resolves through the pass context; every other name does not use it.
				const locate = (element) => {
					const match = pages.find((entry) => entry.element === element.id);
					return match ? [{ index: 0, fragment: { page: match.page } }] : [];
				};

				return { handler, host, budget, locate };
			}
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, host, locate } = setup(
				"#one::after { --paged-generated-tc-0-source: \"target-counter(url(#chap), page)\" }"
							+ "#two::after { --paged-generated-tc-1-source: \"target-counter('#chap', page)\" }",
				"<a id=\"one\">1</a><a id=\"two\">2</a><h1 id=\"chap\">Chapter</h1>",
				{ pages: [{ element: "chap", page: 7 }] },
			);
			handler.afterLayoutPass({ locate });
			__results.push({ actual: host.querySelector("#one").style.counterReset, args: ["--paged-tc-0 7"], label: undefined });
			__results.push({ actual: host.querySelector("#two").style.counterReset, args: ["--paged-tc-1 7"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("reads a non-page counter from the source tree, needing no page context", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetCounters } = await import("/src/handlers/target-counters.js");
			function setup(css, html, { pages = [] } = {}) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetCounters();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				// Counter directives are read from computed style, which needs the content
				// connected the way the measurer connects it.
				const host = document.createElement("div");
				host.appendChild(content);
				document.body.replaceChildren(host);
				handler.afterMeasurementSetup(host);

				// `page` resolves through the pass context; every other name does not use it.
				const locate = (element) => {
					const match = pages.find((entry) => entry.element === element.id);
					return match ? [{ index: 0, fragment: { page: match.page } }] : [];
				};

				return { handler, host, budget, locate };
			}
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, host } = setup(
				"h2 { counter-increment: sub }"
							+ "a::after { --paged-generated-tc-0-source: \"target-counter(attr(href), sub)\" }",
				"<a id=\"ref\" href=\"#third\">go</a>"
							+ "<h2>one</h2><h2>two</h2><h2 id=\"third\">three</h2><h2>four</h2>",
			);
			handler.afterLayoutPass();
			__results.push({ actual: host.querySelector("#ref").style.counterReset, args: ["--paged-tc-0 3"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("counts the target's own increment, not the value before it", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetCounters } = await import("/src/handlers/target-counters.js");
			function setup(css, html, { pages = [] } = {}) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetCounters();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				// Counter directives are read from computed style, which needs the content
				// connected the way the measurer connects it.
				const host = document.createElement("div");
				host.appendChild(content);
				document.body.replaceChildren(host);
				handler.afterMeasurementSetup(host);

				// `page` resolves through the pass context; every other name does not use it.
				const locate = (element) => {
					const match = pages.find((entry) => entry.element === element.id);
					return match ? [{ index: 0, fragment: { page: match.page } }] : [];
				};

				return { handler, host, budget, locate };
			}
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, host } = setup(
				"h2 { counter-increment: sub }"
							+ "a::after { --paged-generated-tc-0-source: \"target-counter(attr(href), sub)\" }",
				"<a id=\"ref\" href=\"#first\">go</a><h2 id=\"first\">one</h2>",
			);
			handler.afterLayoutPass();
			__results.push({ actual: host.querySelector("#ref").style.counterReset, args: ["--paged-tc-0 1"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("joins a nested counter stack for the plural form", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetCounters } = await import("/src/handlers/target-counters.js");
			function setup(css, html, { pages = [] } = {}) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetCounters();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				// Counter directives are read from computed style, which needs the content
				// connected the way the measurer connects it.
				const host = document.createElement("div");
				host.appendChild(content);
				document.body.replaceChildren(host);
				handler.afterMeasurementSetup(host);

				// `page` resolves through the pass context; every other name does not use it.
				const locate = (element) => {
					const match = pages.find((entry) => entry.element === element.id);
					return match ? [{ index: 0, fragment: { page: match.page } }] : [];
				};

				return { handler, host, budget, locate };
			}
			const generated = (element, id) =>
				element.style.getPropertyValue(`--paged-generated-${id}`);
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, host } = setup(
				"section { counter-reset: sub } h2 { counter-increment: sub }"
							+ "a::after { --paged-generated-tcs-0-source: \"target-counters(attr(href), sub, '.')\" }",
				"<a id=\"ref\" href=\"#deep\">go</a>"
							+ "<section><h2>1</h2><section><h2>1.1</h2><h2 id=\"deep\">1.2</h2></section></section>",
			);
			handler.afterLayoutPass();
			__results.push({ actual: generated(host.querySelector("#ref"), "tcs-0"), args: ["\"1.2\""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("joins the page of a target for the plural form", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetCounters } = await import("/src/handlers/target-counters.js");
			function setup(css, html, { pages = [] } = {}) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetCounters();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				// Counter directives are read from computed style, which needs the content
				// connected the way the measurer connects it.
				const host = document.createElement("div");
				host.appendChild(content);
				document.body.replaceChildren(host);
				handler.afterMeasurementSetup(host);

				// `page` resolves through the pass context; every other name does not use it.
				const locate = (element) => {
					const match = pages.find((entry) => entry.element === element.id);
					return match ? [{ index: 0, fragment: { page: match.page } }] : [];
				};

				return { handler, host, budget, locate };
			}
			const generated = (element, id) =>
				element.style.getPropertyValue(`--paged-generated-${id}`);
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, host, locate } = setup(
				"a::after { --paged-generated-tcs-0-source: \"target-counters(attr(href), page, '.')\" }",
				"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">Chapter</h1>",
				{ pages: [{ element: "chap", page: 9 }] },
			);
			handler.afterLayoutPass({ locate });
			__results.push({ actual: generated(host.querySelector("#ref"), "tcs-0"), args: ["\"9\""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("replaces a sibling's counter instance rather than nesting inside it", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetCounters } = await import("/src/handlers/target-counters.js");
			function setup(css, html, { pages = [] } = {}) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetCounters();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				// Counter directives are read from computed style, which needs the content
				// connected the way the measurer connects it.
				const host = document.createElement("div");
				host.appendChild(content);
				document.body.replaceChildren(host);
				handler.afterMeasurementSetup(host);

				// `page` resolves through the pass context; every other name does not use it.
				const locate = (element) => {
					const match = pages.find((entry) => entry.element === element.id);
					return match ? [{ index: 0, fragment: { page: match.page } }] : [];
				};

				return { handler, host, budget, locate };
			}
			const generated = (element, id) =>
				element.style.getPropertyValue(`--paged-generated-${id}`);
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, host } = setup(
				"section { counter-reset: sub } p { counter-increment: sub }"
							+ "a::after { --paged-generated-tcs-0-source: \"target-counters(attr(href), sub, '.')\" }",
				"<a id=\"ref\" href=\"#t\">go</a>"
							+ "<section><p>1</p><p>2</p></section><section><p id=\"t\">1</p></section>",
			);
			handler.afterLayoutPass();
			__results.push({ actual: generated(host.querySelector("#ref"), "tcs-0"), args: ["\"1\""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("formats a joined stack with a predefined counter style", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetCounters } = await import("/src/handlers/target-counters.js");
			function setup(css, html, { pages = [] } = {}) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetCounters();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				// Counter directives are read from computed style, which needs the content
				// connected the way the measurer connects it.
				const host = document.createElement("div");
				host.appendChild(content);
				document.body.replaceChildren(host);
				handler.afterMeasurementSetup(host);

				// `page` resolves through the pass context; every other name does not use it.
				const locate = (element) => {
					const match = pages.find((entry) => entry.element === element.id);
					return match ? [{ index: 0, fragment: { page: match.page } }] : [];
				};

				return { handler, host, budget, locate };
			}
			const generated = (element, id) =>
				element.style.getPropertyValue(`--paged-generated-${id}`);
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, host } = setup(
				"section { counter-reset: sub } h2 { counter-increment: sub }"
							+ "a::after { --paged-generated-tcs-0-source: \"target-counters(attr(href), sub, '-', upper-alpha)\" }",
				"<a id=\"ref\" href=\"#deep\">go</a>"
							+ "<section><h2>1</h2><section><h2>1.1</h2><h2 id=\"deep\">1.2</h2></section></section>",
			);
			handler.afterLayoutPass();
			__results.push({ actual: generated(host.querySelector("#ref"), "tcs-0"), args: ["\"A-B\""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("keeps the element's own counter-reset alongside the generated one", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetCounters } = await import("/src/handlers/target-counters.js");
			function setup(css, html, { pages = [] } = {}) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetCounters();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				// Counter directives are read from computed style, which needs the content
				// connected the way the measurer connects it.
				const host = document.createElement("div");
				host.appendChild(content);
				document.body.replaceChildren(host);
				handler.afterMeasurementSetup(host);

				// `page` resolves through the pass context; every other name does not use it.
				const locate = (element) => {
					const match = pages.find((entry) => entry.element === element.id);
					return match ? [{ index: 0, fragment: { page: match.page } }] : [];
				};

				return { handler, host, budget, locate };
			}
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, host, locate } = setup(
				"a { counter-reset: chapter 2 }"
							+ "a::after { --paged-generated-tc-0-source: \"target-counter(attr(href), page)\" }",
				"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">Chapter</h1>",
				{ pages: [{ element: "chap", page: 3 }] },
			);
			handler.afterLayoutPass({ locate });
			__results.push({ actual: host.querySelector("#ref").style.counterReset, args: ["chapter 2 --paged-tc-0 3"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("merges several occurrences on one element into a single reset", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetCounters } = await import("/src/handlers/target-counters.js");
			function setup(css, html, { pages = [] } = {}) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetCounters();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				// Counter directives are read from computed style, which needs the content
				// connected the way the measurer connects it.
				const host = document.createElement("div");
				host.appendChild(content);
				document.body.replaceChildren(host);
				handler.afterMeasurementSetup(host);

				// `page` resolves through the pass context; every other name does not use it.
				const locate = (element) => {
					const match = pages.find((entry) => entry.element === element.id);
					return match ? [{ index: 0, fragment: { page: match.page } }] : [];
				};

				return { handler, host, budget, locate };
			}
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, host, locate } = setup(
				"a::after { --paged-generated-tc-0-source: \"target-counter(attr(href), page)\";"
							+ " --paged-generated-tc-1-source: \"target-counter(attr(data-other), page)\" }",
				"<a id=\"ref\" href=\"#a\" data-other=\"#b\">go</a>"
							+ "<h1 id=\"a\">A</h1><h1 id=\"b\">B</h1>",
				{ pages: [{ element: "a", page: 2 }, { element: "b", page: 5 }] },
			);
			handler.afterLayoutPass({ locate });
			__results.push({ actual: host.querySelector("#ref").style.counterReset, args: ["--paged-tc-0 2 --paged-tc-1 5"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("ignores an element that generates no box", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetCounters } = await import("/src/handlers/target-counters.js");
			function setup(css, html, { pages = [] } = {}) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetCounters();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				// Counter directives are read from computed style, which needs the content
				// connected the way the measurer connects it.
				const host = document.createElement("div");
				host.appendChild(content);
				document.body.replaceChildren(host);
				handler.afterMeasurementSetup(host);

				// `page` resolves through the pass context; every other name does not use it.
				const locate = (element) => {
					const match = pages.find((entry) => entry.element === element.id);
					return match ? [{ index: 0, fragment: { page: match.page } }] : [];
				};

				return { handler, host, budget, locate };
			}
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, host } = setup(
				"h2 { counter-increment: sub } .gone { display: none }"
							+ "a::after { --paged-generated-tc-0-source: \"target-counter(attr(href), sub)\" }",
				"<a id=\"ref\" href=\"#last\">go</a>"
							+ "<h2>one</h2><h2 class=\"gone\">skipped</h2><h2 id=\"last\">two</h2>",
			);
			handler.afterLayoutPass();
			__results.push({ actual: host.querySelector("#ref").style.counterReset, args: ["--paged-tc-0 2"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("invalidates only on the pass that changes a value, then settles", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetCounters } = await import("/src/handlers/target-counters.js");
			function setup(css, html, { pages = [] } = {}) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetCounters();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				// Counter directives are read from computed style, which needs the content
				// connected the way the measurer connects it.
				const host = document.createElement("div");
				host.appendChild(content);
				document.body.replaceChildren(host);
				handler.afterMeasurementSetup(host);

				// `page` resolves through the pass context; every other name does not use it.
				const locate = (element) => {
					const match = pages.find((entry) => entry.element === element.id);
					return match ? [{ index: 0, fragment: { page: match.page } }] : [];
				};

				return { handler, host, budget, locate };
			}
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, host, locate } = setup(
				"a::after { --paged-generated-tc-0-source: \"target-counter(attr(href), page)\" }",
				"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">Chapter</h1>",
				{ pages: [{ element: "chap", page: 4 }] },
			);
			const reference = host.querySelector("#ref");
			__results.push({ actual: handler.afterLayoutPass({ locate }).invalidate, args: [[reference]], label: undefined });
			__results.push({ actual: handler.afterLayoutPass({ locate }), args: [null], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toEqual(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("registers one layout pass budget however many occurrences there are", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetCounters } = await import("/src/handlers/target-counters.js");
			function setup(css, html, { pages = [] } = {}) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetCounters();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				// Counter directives are read from computed style, which needs the content
				// connected the way the measurer connects it.
				const host = document.createElement("div");
				host.appendChild(content);
				document.body.replaceChildren(host);
				handler.afterMeasurementSetup(host);

				// `page` resolves through the pass context; every other name does not use it.
				const locate = (element) => {
					const match = pages.find((entry) => entry.element === element.id);
					return match ? [{ index: 0, fragment: { page: match.page } }] : [];
				};

				return { handler, host, budget, locate };
			}
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { budget } = setup(
				"a::after { --paged-generated-tc-0-source: \"target-counter(attr(href), page)\" }"
							+ "b::after { --paged-generated-tc-1-source: \"target-counter(attr(href), page)\" }",
				"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">Chapter</h1>",
			);
			__results.push({ actual: budget, args: [3], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("resolves a page target that never paginated to zero", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetCounters } = await import("/src/handlers/target-counters.js");
			function setup(css, html, { pages = [] } = {}) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetCounters();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				// Counter directives are read from computed style, which needs the content
				// connected the way the measurer connects it.
				const host = document.createElement("div");
				host.appendChild(content);
				document.body.replaceChildren(host);
				handler.afterMeasurementSetup(host);

				// `page` resolves through the pass context; every other name does not use it.
				const locate = (element) => {
					const match = pages.find((entry) => entry.element === element.id);
					return match ? [{ index: 0, fragment: { page: match.page } }] : [];
				};

				return { handler, host, budget, locate };
			}
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, host } = setup(
				"a::after { --paged-generated-tc-0-source: \"target-counter(attr(href), page)\" }",
				"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">Chapter</h1>",
			);
			handler.afterLayoutPass({ locate: () => [] });
			__results.push({ actual: host.querySelector("#ref").style.counterReset, args: ["--paged-tc-0 0"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("resolves a missing target to zero, warning once", async ({ page }) => {
		const warnings = [];
		page.on("console", (message) => {
			if (message.type() === "warning") warnings.push(message.text());
		});
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetCounters } = await import("/src/handlers/target-counters.js");
			function setup(css, html, { pages = [] } = {}) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetCounters();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				// Counter directives are read from computed style, which needs the content
				// connected the way the measurer connects it.
				const host = document.createElement("div");
				host.appendChild(content);
				document.body.replaceChildren(host);
				handler.afterMeasurementSetup(host);

				// `page` resolves through the pass context; every other name does not use it.
				const locate = (element) => {
					const match = pages.find((entry) => entry.element === element.id);
					return match ? [{ index: 0, fragment: { page: match.page } }] : [];
				};

				return { handler, host, budget, locate };
			}
			document.head.replaceChildren();
			document.body.replaceChildren();

			const { handler, host, locate } = setup(
				"a::after { --paged-generated-tc-0-source: \"target-counter(attr(href), page)\" }",
				"<a id=\"one\" href=\"#gone\">1</a><a id=\"two\" href=\"#gone\">2</a>",
			);
			handler.afterLayoutPass({ locate });
			__results.push({ actual: host.querySelector("#one").style.counterReset, args: ["--paged-tc-0 0"], label: undefined });


			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(warnings).toHaveLength(1);
	});

	test("resolves a target in another document to zero, warning once", async ({ page }) => {
		const warnings = [];
		page.on("console", (message) => {
			if (message.type() === "warning") warnings.push(message.text());
		});
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetCounters } = await import("/src/handlers/target-counters.js");
			function setup(css, html, { pages = [] } = {}) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetCounters();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				// Counter directives are read from computed style, which needs the content
				// connected the way the measurer connects it.
				const host = document.createElement("div");
				host.appendChild(content);
				document.body.replaceChildren(host);
				handler.afterMeasurementSetup(host);

				// `page` resolves through the pass context; every other name does not use it.
				const locate = (element) => {
					const match = pages.find((entry) => entry.element === element.id);
					return match ? [{ index: 0, fragment: { page: match.page } }] : [];
				};

				return { handler, host, budget, locate };
			}
			document.head.replaceChildren();
			document.body.replaceChildren();

			const { handler, host, locate } = setup(
				"a::after { --paged-generated-tc-0-source: \"target-counter(attr(href), page)\" }",
				"<a id=\"ref\" href=\"other.html#chap\">go</a>",
			);
			handler.afterLayoutPass({ locate });
			__results.push({ actual: host.querySelector("#ref").style.counterReset, args: ["--paged-tc-0 0"], label: undefined });


			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(warnings[0]).toContain("outside this document");
	});

	test("warns once for a malformed source and records no occurrence", async ({ page }) => {
		const warnings = [];
		page.on("console", (message) => {
			if (message.type() === "warning") warnings.push(message.text());
		});
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetCounters } = await import("/src/handlers/target-counters.js");
			function setup(css, html, { pages = [] } = {}) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetCounters();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				// Counter directives are read from computed style, which needs the content
				// connected the way the measurer connects it.
				const host = document.createElement("div");
				host.appendChild(content);
				document.body.replaceChildren(host);
				handler.afterMeasurementSetup(host);

				// `page` resolves through the pass context; every other name does not use it.
				const locate = (element) => {
					const match = pages.find((entry) => entry.element === element.id);
					return match ? [{ index: 0, fragment: { page: match.page } }] : [];
				};

				return { handler, host, budget, locate };
			}
			document.head.replaceChildren();
			document.body.replaceChildren();

			const { handler, host, locate } = setup(
				"a::after { --paged-generated-tc-0-source: \"target-counter(attr(href))\" }",
				"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">Chapter</h1>",
			);
			__results.push({ actual: handler.afterLayoutPass({ locate }), args: [null], label: undefined });
			__results.push({ actual: host.querySelector("#ref").style.counterReset, args: [""], label: undefined });


			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
		expect(warnings).toHaveLength(1);
	});
});

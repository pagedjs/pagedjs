import { test, expect } from "./browser-fixture.js";

test.describe("target text", () => {
	test("rewrites the function and keeps its source alongside", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { TargetText } = await import("/src/handlers/target-text.js");
			async function rewrite(css, rules = TargetText.rules) {
				const transformer = new CssTransformer({ rules });
				return transformer.generate(transformer.apply(await transformer.prepare(css)));
			}
			__results.push({ actual: await rewrite("a::after { content: target-text(attr(href url)) }"), args: ["a::after{content:var(--paged-generated-text-0, \"\");"
							+ "--paged-generated-text-0-source:\"target-text(attr(href url))\"}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("keeps a typed attr source readable through browser CSSOM", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { TargetText } = await import("/src/handlers/target-text.js");
			async function rewrite(css, rules = TargetText.rules) {
				const transformer = new CssTransformer({ rules });
				return transformer.generate(transformer.apply(await transformer.prepare(css)));
			}
			const style = document.createElement("style");
			style.textContent = await rewrite(
				"a::after { content: target-text(attr(href url)) }",
			);
			document.head.appendChild(style);
			__results.push({ actual: document.styleSheets[0].cssRules[0].style.getPropertyValue(
				"--paged-generated-text-0-source",
			), args: ["\"target-text(attr(href url))\""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("gives each occurrence its own id", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { TargetText } = await import("/src/handlers/target-text.js");
			async function rewrite(css, rules = TargetText.rules) {
				const transformer = new CssTransformer({ rules });
				return transformer.generate(transformer.apply(await transformer.prepare(css)));
			}
			const out = await rewrite(
				"a::after { content: target-text(attr(href)) } b::after { content: target-text(attr(href), before) }",
			);
			__results.push({ actual: out, args: ["--paged-generated-text-0-source"], label: undefined });
			__results.push({ actual: out, args: ["--paged-generated-text-1-source"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toContain(...results[0].args);
		expect(results[1].actual, results[1].label).toContain(...results[1].args);
	});

	test("restarts occurrence ids for every stylesheet build", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { TargetText } = await import("/src/handlers/target-text.js");
			async function rewrite(css, rules = TargetText.rules) {
				const transformer = new CssTransformer({ rules });
				return transformer.generate(transformer.apply(await transformer.prepare(css)));
			}
			const css = "a::after { content: target-text(attr(href)) }";
			__results.push({ actual: await rewrite(css, TargetText.rules), args: [await rewrite(css, TargetText.rules)], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("leaves target-text outside a content declaration alone", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { CssTransformer } = await import("@pagedjs/css-transformer");
			const { TargetText } = await import("/src/handlers/target-text.js");
			async function rewrite(css, rules = TargetText.rules) {
				const transformer = new CssTransformer({ rules });
				return transformer.generate(transformer.apply(await transformer.prepare(css)));
			}
			__results.push({ actual: await rewrite("a::after { width: target-text(attr(href)) }"), args: ["a::after{width:target-text(attr(href))}"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("stamps the target's text on the referencing element", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetText } = await import("/src/handlers/target-text.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetText();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content, budget };
			}
			const generated = (element, id = "text-0") =>
				element.style.getPropertyValue(`--paged-generated-${id}`);
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { content } = setup(
				"a::after { --paged-generated-text-0-source: \"target-text(attr(href url))\" }",
				"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">Chapter One</h1>",
			);
			__results.push({ actual: generated(content.getElementById("ref")), args: ["\"Chapter One\""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("collapses whitespace and escapes quotes in the target's text", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetText } = await import("/src/handlers/target-text.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetText();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content, budget };
			}
			const generated = (element, id = "text-0") =>
				element.style.getPropertyValue(`--paged-generated-${id}`);
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { content } = setup(
				"a::after { --paged-generated-text-0-source: \"target-text(attr(href))\" }",
				"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">\n\t'Lorem \"ipsum\" dolor'\n</h1>",
			);
			__results.push({ actual: generated(content.getElementById("ref")), args: ["\"'Lorem \\\"ipsum\\\" dolor'\""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("takes only the first letter in first-letter mode", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetText } = await import("/src/handlers/target-text.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetText();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content, budget };
			}
			const generated = (element, id = "text-0") =>
				element.style.getPropertyValue(`--paged-generated-${id}`);
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { content } = setup(
				"a::after { --paged-generated-text-0-source: \"target-text(attr(href), first-letter)\" }",
				"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\"> Praesent placerat</h1>",
			);
			__results.push({ actual: generated(content.getElementById("ref")), args: ["\"P\""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("resolves an id that would need escaping as a selector", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetText } = await import("/src/handlers/target-text.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetText();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content, budget };
			}
			const generated = (element, id = "text-0") =>
				element.style.getPropertyValue(`--paged-generated-${id}`);
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { content } = setup(
				"a::after { --paged-generated-text-0-source: \"target-text(attr(href))\" }",
				"<a id=\"ref\" href=\"#chap.two\">go</a><h1 id=\"chap.two\">Dotted</h1>",
			);
			__results.push({ actual: generated(content.getElementById("ref")), args: ["\"Dotted\""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("resolves a percent-encoded fragment", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetText } = await import("/src/handlers/target-text.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetText();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content, budget };
			}
			const generated = (element, id = "text-0") =>
				element.style.getPropertyValue(`--paged-generated-${id}`);
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { content } = setup(
				"a::after { --paged-generated-text-0-source: \"target-text(attr(href))\" }",
				"<a id=\"ref\" href=\"#chap%20two\">go</a><h1 id=\"chap two\">Encoded</h1>",
			);
			__results.push({ actual: generated(content.getElementById("ref")), args: ["\"Encoded\""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("resolves a fragment that is not valid percent-encoding", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetText } = await import("/src/handlers/target-text.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetText();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content, budget };
			}
			const generated = (element, id = "text-0") =>
				element.style.getPropertyValue(`--paged-generated-${id}`);
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { content } = setup(
				"a::after { --paged-generated-text-0-source: \"target-text(attr(href))\" }",
				"<a id=\"ref\" href=\"#50%\">go</a><h1 id=\"50%\">Literal</h1>",
			);
			__results.push({ actual: generated(content.getElementById("ref")), args: ["\"Literal\""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("stamps every element the rule matches with its own target", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetText } = await import("/src/handlers/target-text.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetText();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content, budget };
			}
			const generated = (element, id = "text-0") =>
				element.style.getPropertyValue(`--paged-generated-${id}`);
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { content } = setup(
				"nav a::after { --paged-generated-text-0-source: \"target-text(attr(href))\" }",
				"<nav><a id=\"one\" href=\"#a\">1</a><a id=\"two\" href=\"#b\">2</a></nav>"
							+ "<h1 id=\"a\">First</h1><h1 id=\"b\">Second</h1>",
			);
			__results.push({ actual: generated(content.getElementById("one")), args: ["\"First\""], label: undefined });
			__results.push({ actual: generated(content.getElementById("two")), args: ["\"Second\""], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("reads the declaration off the element a pseudo-element belongs to", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetText } = await import("/src/handlers/target-text.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetText();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content, budget };
			}
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler } = setup(
				"nav li#first a[href]::after { --paged-generated-text-0-source: \"target-text(attr(href))\" }",
				"<nav><li id=\"first\"><a href=\"#c\">go</a></li></nav><h1 id=\"c\">Title</h1>",
			);
			__results.push({ actual: handler, args: [], label: undefined });
			__results.push({ actual: document.styleSheets[0].cssRules[0].selectorText, args: ["::after"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBeDefined(...results[0].args);
		expect(results[1].actual, results[1].label).toContain(...results[1].args);
	});

	test("registers no layout pass when nothing needs one", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetText } = await import("/src/handlers/target-text.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetText();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content, budget };
			}
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { budget } = setup(
				"a::after { --paged-generated-text-0-source: \"target-text(attr(href))\" }",
				"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">Chapter</h1>",
			);
			__results.push({ actual: budget, args: [0], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("registers a layout pass for a mode that reads generated content", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetText } = await import("/src/handlers/target-text.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetText();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content, budget };
			}
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { budget } = setup(
				"a::after { --paged-generated-text-0-source: \"target-text(attr(href), before)\" }",
				"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">Chapter</h1>",
			);
			__results.push({ actual: budget, args: [3], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("stamps a deferred mode only in the pass loop, and settles after it", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetText } = await import("/src/handlers/target-text.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetText();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content, budget };
			}
			const generated = (element, id = "text-0") =>
				element.style.getPropertyValue(`--paged-generated-${id}`);
			document.head.replaceChildren();
			document.body.replaceChildren();
			const { handler, content } = setup(
				"a::after { --paged-generated-text-0-source: \"target-text(attr(href), before)\" }",
				"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">Chapter</h1>",
			);
			const reference = content.getElementById("ref");
			__results.push({ actual: generated(reference), args: [""], label: undefined });
			const first = handler.afterLayoutPass();
			__results.push({ actual: first.invalidate, args: [[reference]], label: undefined });
			__results.push({ actual: generated(reference), args: ["\"\""], label: undefined });
			__results.push({ actual: handler.afterLayoutPass(), args: [null], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toEqual(...results[1].args);
		expect(results[2].actual, results[2].label).toBe(...results[2].args);
		expect(results[3].actual, results[3].label).toBe(...results[3].args);
	});

	test("resolves a missing target to nothing, warning once", async ({ page }) => {
		const warnings = [];
		page.on("console", (message) => {
			if (message.type() === "warning") warnings.push(message.text());
		});
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetText } = await import("/src/handlers/target-text.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetText();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content, budget };
			}
			const generated = (element, id = "text-0") =>
				element.style.getPropertyValue(`--paged-generated-${id}`);
			document.head.replaceChildren();
			document.body.replaceChildren();

			const { content } = setup(
				"a::after { --paged-generated-text-0-source: \"target-text(attr(href))\" }",
				"<a id=\"one\" href=\"#gone\">1</a><a id=\"two\" href=\"#gone\">2</a>",
			);
			__results.push({ actual: generated(content.getElementById("one")), args: ["\"\""], label: undefined });


			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(warnings).toHaveLength(1);
	});

	test("resolves a target in another document to nothing, warning once", async ({ page }) => {
		const warnings = [];
		page.on("console", (message) => {
			if (message.type() === "warning") warnings.push(message.text());
		});
		const results = await page.evaluate(async () => {
			const __results = [];
			const { TargetText } = await import("/src/handlers/target-text.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetText();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content, budget };
			}
			const generated = (element, id = "text-0") =>
				element.style.getPropertyValue(`--paged-generated-${id}`);
			document.head.replaceChildren();
			document.body.replaceChildren();

			const { content } = setup(
				"a::after { --paged-generated-text-0-source: \"target-text(attr(href))\" }",
				"<a id=\"ref\" href=\"other.html#chap\">go</a>",
			);
			__results.push({ actual: generated(content.getElementById("ref")), args: ["\"\""], label: undefined });


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
			const { TargetText } = await import("/src/handlers/target-text.js");
			function setup(css, html) {
				const style = document.createElement("style");
				style.textContent = css;
				document.head.replaceChildren(style);

				const content = document.createDocumentFragment();
				const holder = document.createElement("div");
				holder.innerHTML = html;
				while (holder.firstChild) content.appendChild(holder.firstChild);

				const handler = new TargetText();
				// The flow keeps the largest budget a handler asks for, so a repeated
				// request is the same request.
				let budget = 0;
				handler.init({}, {
					flow: { registerLayoutPass: (passes) => { budget = Math.max(budget, passes); } },
				});
				handler.resetRules();
				for (const rule of document.styleSheets[0].cssRules) handler.matchRule(rule);
				handler.prepareContent(content);

				return { handler, content, budget };
			}
			const generated = (element, id = "text-0") =>
				element.style.getPropertyValue(`--paged-generated-${id}`);
			document.head.replaceChildren();
			document.body.replaceChildren();

			const { content } = setup(
				"a::after { --paged-generated-text-0-source: \"target-text(attr(href), sideways)\" }",
				"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">Chapter</h1>",
			);
			__results.push({ actual: generated(content.getElementById("ref")), args: [""], label: undefined });


			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(warnings).toHaveLength(1);
	});
});

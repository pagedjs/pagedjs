import { describe, it, expect, beforeEach, vi } from "../browser-suite.js";
import * as csstree from "css-tree";
import { CssTransformer } from "/src/css-transformer/CssTransformer.js";
import { TargetCounters } from "/src/handlers/target-counters.js";

async function rewrite(css, rules = TargetCounters.rules) {
	const transformer = new CssTransformer({ rules });
	return csstree.generate(transformer.apply(await transformer.prepare(css)));
}

/**
 * Run the handler's hooks the way a flow does. The stylesheet is written as
 * the transformer leaves it, so the two halves stay independent.
 */
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

describe("target counters CSS", () => {
	it("rewrites the singular form to a counter the browser formats", async () => {
		expect(await rewrite("a::after { content: target-counter(attr(href), page) }")).toBe(
			"a::after{content:counter(--paged-tc-0);"
				+ "--paged-generated-tc-0-source:\"target-counter(attr(href),page)\"}",
		);
	});

	it("carries the counter style into the rewritten counter()", async () => {
		expect(
			await rewrite("a::after { content: target-counter(attr(href), page, lower-roman) }"),
		).toContain("content:counter(--paged-tc-0,lower-roman)");
	});

	it("rewrites the plural form to a variable JavaScript fills in", async () => {
		expect(
			await rewrite("a::after { content: target-counters(attr(href), sub, \".\") }"),
		).toBe(
			"a::after{content:var(--paged-generated-tcs-0, \"\");"
				+ "--paged-generated-tcs-0-source:\"target-counters(attr(href),sub,\\\".\\\")\"}",
		);
	});

	it("numbers the two forms in separate id spaces", async () => {
		const out = await rewrite(
			"a::after { content: target-counter(attr(href), page) }"
				+ "b::after { content: target-counters(attr(href), sub, \".\") }"
				+ "i::after { content: target-counter(attr(href), sub) }",
		);
		expect(out).toContain("--paged-generated-tc-0-source");
		expect(out).toContain("--paged-generated-tcs-0-source");
		expect(out).toContain("--paged-generated-tc-1-source");
	});

	// Two builds must not interleave, so each access to the rules allocates
	// from zero rather than from a counter shared across the module.
	it("restarts occurrence ids for every stylesheet build", async () => {
		const css = "a::after { content: target-counter(attr(href), page) }";
		expect(await rewrite(css, TargetCounters.rules)).toBe(
			await rewrite(css, TargetCounters.rules),
		);
	});

	it("keeps a typed attr source readable through browser CSSOM", async () => {
		const style = document.createElement("style");
		style.textContent = await rewrite(
			"a::after { content: target-counter(attr(href url), page) }",
		);
		document.head.appendChild(style);

		expect(
			document.styleSheets[0].cssRules[0].style.getPropertyValue(
				"--paged-generated-tc-0-source",
			),
		).toBe("\"target-counter(attr(href url),page)\"");
	});

	it("leaves target-counter outside a content declaration alone", async () => {
		expect(await rewrite("a::after { width: target-counter(attr(href), page) }")).toBe(
			"a::after{width:target-counter(attr(href),page)}",
		);
	});
});

describe("target counters runtime", () => {
	beforeEach(() => {
		document.head.replaceChildren();
		document.body.replaceChildren();
	});

	it("resets the generated counter to the target's page", () => {
		const { handler, host, locate } = setup(
			"a::after { --paged-generated-tc-0-source: \"target-counter(attr(href), page)\" }",
			"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">Chapter</h1>",
			{ pages: [{ element: "chap", page: 4 }] },
		);

		handler.afterLayoutPass({ locate });
		expect(host.querySelector("#ref").style.counterReset).toBe("--paged-tc-0 4");
	});

	it("reads a url() target and a bare string target", () => {
		const { handler, host, locate } = setup(
			"#one::after { --paged-generated-tc-0-source: \"target-counter(url(#chap), page)\" }"
				+ "#two::after { --paged-generated-tc-1-source: \"target-counter('#chap', page)\" }",
			"<a id=\"one\">1</a><a id=\"two\">2</a><h1 id=\"chap\">Chapter</h1>",
			{ pages: [{ element: "chap", page: 7 }] },
		);

		handler.afterLayoutPass({ locate });
		expect(host.querySelector("#one").style.counterReset).toBe("--paged-tc-0 7");
		expect(host.querySelector("#two").style.counterReset).toBe("--paged-tc-1 7");
	});

	it("reads a non-page counter from the source tree, needing no page context", () => {
		const { handler, host } = setup(
			"h2 { counter-increment: sub }"
				+ "a::after { --paged-generated-tc-0-source: \"target-counter(attr(href), sub)\" }",
			"<a id=\"ref\" href=\"#third\">go</a>"
				+ "<h2>one</h2><h2>two</h2><h2 id=\"third\">three</h2><h2>four</h2>",
		);

		handler.afterLayoutPass();
		expect(host.querySelector("#ref").style.counterReset).toBe("--paged-tc-0 3");
	});

	it("counts the target's own increment, not the value before it", () => {
		const { handler, host } = setup(
			"h2 { counter-increment: sub }"
				+ "a::after { --paged-generated-tc-0-source: \"target-counter(attr(href), sub)\" }",
			"<a id=\"ref\" href=\"#first\">go</a><h2 id=\"first\">one</h2>",
		);

		handler.afterLayoutPass();
		expect(host.querySelector("#ref").style.counterReset).toBe("--paged-tc-0 1");
	});

	it("joins a nested counter stack for the plural form", () => {
		const { handler, host } = setup(
			"section { counter-reset: sub } h2 { counter-increment: sub }"
				+ "a::after { --paged-generated-tcs-0-source: \"target-counters(attr(href), sub, '.')\" }",
			"<a id=\"ref\" href=\"#deep\">go</a>"
				+ "<section><h2>1</h2><section><h2>1.1</h2><h2 id=\"deep\">1.2</h2></section></section>",
		);

		handler.afterLayoutPass();
		expect(generated(host.querySelector("#ref"), "tcs-0")).toBe("\"1.2\"");
	});

	it("joins the page of a target for the plural form", () => {
		const { handler, host, locate } = setup(
			"a::after { --paged-generated-tcs-0-source: \"target-counters(attr(href), page, '.')\" }",
			"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">Chapter</h1>",
			{ pages: [{ element: "chap", page: 9 }] },
		);

		// A page is a single value, so the separator never appears.
		handler.afterLayoutPass({ locate });
		expect(generated(host.querySelector("#ref"), "tcs-0")).toBe("\"9\"");
	});

	// The plural form is what tells the two apart: replacing leaves one frame,
	// nesting would leave the first section's value under the second's.
	it("replaces a sibling's counter instance rather than nesting inside it", () => {
		const { handler, host } = setup(
			"section { counter-reset: sub } p { counter-increment: sub }"
				+ "a::after { --paged-generated-tcs-0-source: \"target-counters(attr(href), sub, '.')\" }",
			"<a id=\"ref\" href=\"#t\">go</a>"
				+ "<section><p>1</p><p>2</p></section><section><p id=\"t\">1</p></section>",
		);

		handler.afterLayoutPass();
		expect(generated(host.querySelector("#ref"), "tcs-0")).toBe("\"1\"");
	});

	it("formats a joined stack with a predefined counter style", () => {
		const { handler, host } = setup(
			"section { counter-reset: sub } h2 { counter-increment: sub }"
				+ "a::after { --paged-generated-tcs-0-source: \"target-counters(attr(href), sub, '-', upper-alpha)\" }",
			"<a id=\"ref\" href=\"#deep\">go</a>"
				+ "<section><h2>1</h2><section><h2>1.1</h2><h2 id=\"deep\">1.2</h2></section></section>",
		);

		handler.afterLayoutPass();
		expect(generated(host.querySelector("#ref"), "tcs-0")).toBe("\"A-B\"");
	});

	it("keeps the element's own counter-reset alongside the generated one", () => {
		const { handler, host, locate } = setup(
			"a { counter-reset: chapter 2 }"
				+ "a::after { --paged-generated-tc-0-source: \"target-counter(attr(href), page)\" }",
			"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">Chapter</h1>",
			{ pages: [{ element: "chap", page: 3 }] },
		);

		handler.afterLayoutPass({ locate });
		expect(host.querySelector("#ref").style.counterReset).toBe("chapter 2 --paged-tc-0 3");
	});

	it("merges several occurrences on one element into a single reset", () => {
		const { handler, host, locate } = setup(
			"a::after { --paged-generated-tc-0-source: \"target-counter(attr(href), page)\";"
				+ " --paged-generated-tc-1-source: \"target-counter(attr(data-other), page)\" }",
			"<a id=\"ref\" href=\"#a\" data-other=\"#b\">go</a>"
				+ "<h1 id=\"a\">A</h1><h1 id=\"b\">B</h1>",
			{ pages: [{ element: "a", page: 2 }, { element: "b", page: 5 }] },
		);

		handler.afterLayoutPass({ locate });
		expect(host.querySelector("#ref").style.counterReset).toBe(
			"--paged-tc-0 2 --paged-tc-1 5",
		);
	});

	it("ignores an element that generates no box", () => {
		const { handler, host } = setup(
			"h2 { counter-increment: sub } .gone { display: none }"
				+ "a::after { --paged-generated-tc-0-source: \"target-counter(attr(href), sub)\" }",
			"<a id=\"ref\" href=\"#last\">go</a>"
				+ "<h2>one</h2><h2 class=\"gone\">skipped</h2><h2 id=\"last\">two</h2>",
		);

		handler.afterLayoutPass();
		expect(host.querySelector("#ref").style.counterReset).toBe("--paged-tc-0 2");
	});

	it("invalidates only on the pass that changes a value, then settles", () => {
		const { handler, host, locate } = setup(
			"a::after { --paged-generated-tc-0-source: \"target-counter(attr(href), page)\" }",
			"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">Chapter</h1>",
			{ pages: [{ element: "chap", page: 4 }] },
		);
		const reference = host.querySelector("#ref");

		expect(handler.afterLayoutPass({ locate }).invalidate).toEqual([reference]);
		expect(handler.afterLayoutPass({ locate })).toBe(null);
	});

	it("registers one layout pass budget however many occurrences there are", () => {
		const { budget } = setup(
			"a::after { --paged-generated-tc-0-source: \"target-counter(attr(href), page)\" }"
				+ "b::after { --paged-generated-tc-1-source: \"target-counter(attr(href), page)\" }",
			"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">Chapter</h1>",
		);

		expect(budget).toBe(3);
	});

	it("resolves a page target that never paginated to zero", () => {
		const { handler, host } = setup(
			"a::after { --paged-generated-tc-0-source: \"target-counter(attr(href), page)\" }",
			"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">Chapter</h1>",
		);

		handler.afterLayoutPass({ locate: () => [] });
		expect(host.querySelector("#ref").style.counterReset).toBe("--paged-tc-0 0");
	});

	it("resolves a missing target to zero, warning once", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const { handler, host, locate } = setup(
			"a::after { --paged-generated-tc-0-source: \"target-counter(attr(href), page)\" }",
			"<a id=\"one\" href=\"#gone\">1</a><a id=\"two\" href=\"#gone\">2</a>",
		);

		handler.afterLayoutPass({ locate });
		expect(host.querySelector("#one").style.counterReset).toBe("--paged-tc-0 0");
		expect(warn).toHaveBeenCalledTimes(1);
		warn.mockRestore();
	});

	it("resolves a target in another document to zero, warning once", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const { handler, host, locate } = setup(
			"a::after { --paged-generated-tc-0-source: \"target-counter(attr(href), page)\" }",
			"<a id=\"ref\" href=\"other.html#chap\">go</a>",
		);

		handler.afterLayoutPass({ locate });
		expect(host.querySelector("#ref").style.counterReset).toBe("--paged-tc-0 0");
		expect(warn.mock.calls[0][0]).toContain("outside this document");
		warn.mockRestore();
	});

	it("warns once for a malformed source and records no occurrence", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const { handler, host, locate } = setup(
			"a::after { --paged-generated-tc-0-source: \"target-counter(attr(href))\" }",
			"<a id=\"ref\" href=\"#chap\">go</a><h1 id=\"chap\">Chapter</h1>",
		);

		expect(handler.afterLayoutPass({ locate })).toBe(null);
		expect(host.querySelector("#ref").style.counterReset).toBe("");
		expect(warn).toHaveBeenCalledTimes(1);
		warn.mockRestore();
	});
});

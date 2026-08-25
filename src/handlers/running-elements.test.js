import { describe, it, expect, beforeEach } from "vitest";
import * as csstree from "css-tree";
import { CssTransformer } from "../css-transformer/CssTransformer.js";
import { RunningElements } from "./running-elements.js";

async function rewrite(css) {
	const transformer = new CssTransformer({ rules: RunningElements.rules });
	return csstree.generate(transformer.apply(await transformer.prepare(css)));
}

/** Run the handler's rule walk and content preparation over a document. */
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

/** Compose one fragmentainer holding clones of the given source nodes. */
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

describe("running elements CSS", () => {
	it("renames position: running() into a custom property", async () => {
		expect(await rewrite(".header { position: running(head) }")).toBe(
			".header{--page-position:running(head)}",
		);
	});

	// The element is removed from the flow instead, so that the clone projected
	// into a margin box does not inherit the rule that hid the original.
	it("does not hide the running element in CSS", async () => {
		expect(await rewrite(".header { position: running(head) }")).not.toContain("display");
	});

	it("splits element() into empty content and a named request", async () => {
		expect(await rewrite(".box::before { content: element(head) }")).toBe(
			".box::before{content:\"\";--paged-running-element:head first}",
		);
	});

	it("keeps the requested selection mode", async () => {
		expect(await rewrite(".box::before { content: element(head, last) }")).toContain(
			"--paged-running-element:head last",
		);
	});

	it("falls back to first for a mode that is not a selection mode", async () => {
		expect(await rewrite(".box::before { content: element(head, sideways) }")).toContain(
			"--paged-running-element:head first",
		);
	});

	it("leaves a reference that is not a valid name alone", async () => {
		expect(await rewrite(".box::before { content: element(page title) }")).toBe(
			".box::before{content:element(page title)}",
		);
	});
});

describe("running elements runtime", () => {
	beforeEach(() => {
		document.head.replaceChildren();
		document.body.replaceChildren();
	});

	it("takes the element out of the flow and leaves a box of no size", () => {
		const { content } = setup(
			".header { --page-position: running(head) }",
			"<p>one</p><div class=\"header\">Header</div><p>two</p>",
		);

		expect(content.querySelector(".header")).toBe(null);
		const placeholder = content.querySelector("[data-paged-running]");
		expect(placeholder.localName).toBe("span");
		expect(placeholder.style.height).toBe("0px");
		expect(placeholder.style.display).toBe("block");
		// The placeholder stands exactly where the element stood.
		expect(placeholder.previousElementSibling.textContent).toBe("one");
		expect(placeholder.nextElementSibling.textContent).toBe("two");
	});

	it("swaps nothing more on a second preparation", () => {
		const { handler, content } = setup(
			".header { --page-position: running(head) }",
			"<div class=\"header\">Header</div>",
		);

		handler.prepareContent(content);

		expect(content.querySelectorAll("[data-paged-running]")).toHaveLength(1);
	});

	it("publishes the retained element, not the placeholder", () => {
		const { handler, content } = setup(
			".header { --page-position: running(head) }",
			"<div class=\"header\">Header</div>",
		);

		const page = compose(handler, 0, content.firstElementChild);

		expect(page.runningElements.head.first.textContent).toBe("Header");
		expect(page.runningElements.head.first.className).toBe("header");
	});

	it("resolves the four modes from one page's occurrences", () => {
		const { handler, content } = setup(
			".header { --page-position: running(head) }",
			"<p>lead</p><div class=\"header\">A</div><div class=\"header\">B</div>",
		);

		const page = compose(handler, 0, ...content.children);
		const head = page.runningElements.head;

		expect(head.first.textContent).toBe("A");
		expect(head.last.textContent).toBe("B");
		// Text renders ahead of the first placeholder, so the page did not open
		// with it and there is no earlier value to fall back to.
		expect(head.start).toBe(null);
		expect(head["first-except"]).toBe(null);
	});

	it("takes start from the occurrence that opens the page", () => {
		const { handler, content } = setup(
			".header { --page-position: running(head) }",
			"<div class=\"header\">A</div><p>body</p>",
		);

		const page = compose(handler, 0, ...content.children);

		expect(page.runningElements.head.start.textContent).toBe("A");
	});

	it("carries the element forward across a page with no occurrence", () => {
		const { handler, content } = setup(
			".header { --page-position: running(head) }",
			"<div class=\"header\">A</div><p>one</p><p>two</p>",
		);
		const [placeholder, one, two] = content.children;

		compose(handler, 0, placeholder, one);
		const second = compose(handler, 1, two);
		const head = second.runningElements.head;

		expect(head.first.textContent).toBe("A");
		expect(head.last.textContent).toBe("A");
		expect(head.start.textContent).toBe("A");
		expect(head["first-except"].textContent).toBe("A");
	});

	it("leaves a page before the first occurrence with nothing to project", () => {
		const { handler, content } = setup(
			".header { --page-position: running(head) }",
			"<p>front matter</p><div class=\"header\">A</div>",
		);
		const [front, placeholder] = content.children;

		const first = compose(handler, 0, front);
		const second = compose(handler, 1, placeholder);

		expect(first.runningElements.head.first).toBe(null);
		expect(second.runningElements.head.first.textContent).toBe("A");
	});
});

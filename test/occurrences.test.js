import { test, expect } from "./browser-fixture.js";

test.describe("occurrences", () => {
	test("carries the entry value through a page with no occurrence", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { selectPerMode } = await import("/src/handlers/occurrences.js");
			__results.push({ actual: selectPerMode([], "carried", false, ""), args: [{
				first: "carried",
				start: "carried",
				last: "carried",
				"first-except": "carried",
			}], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toEqual(...results[0].args);
	});

	test("takes the ends of the page's own occurrences", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { selectPerMode } = await import("/src/handlers/occurrences.js");
			const selected = selectPerMode(["a", "b", "c"], "carried", false, "");
			__results.push({ actual: selected.first, args: ["a"], label: undefined });
			__results.push({ actual: selected.last, args: ["c"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("keeps start on the entry value unless the page opens with the assignment", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { selectPerMode } = await import("/src/handlers/occurrences.js");
			__results.push({ actual: selectPerMode(["a"], "carried", false, "").start, args: ["carried"], label: undefined });
			__results.push({ actual: selectPerMode(["a"], "carried", true, "").start, args: ["a"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("empties first-except on a page that assigns", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { selectPerMode } = await import("/src/handlers/occurrences.js");
			__results.push({ actual: selectPerMode(["a"], "carried", false, "")["first-except"], args: [""], label: undefined });
			__results.push({ actual: selectPerMode(["a"], "carried", false, null)["first-except"], args: [null], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
		expect(results[1].actual, results[1].label).toBe(...results[1].args);
	});

	test("resolves every documented mode", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { MODES, selectPerMode } = await import("/src/handlers/occurrences.js");
			const selected = selectPerMode(["a"], "carried", true, "");
			__results.push({ actual: Object.keys(selected).sort(), args: [[...MODES].sort()], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toEqual(...results[0].args);
	});

	test("hands the last occurrence to the next page", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { exitValue } = await import("/src/handlers/occurrences.js");
			__results.push({ actual: exitValue(["a", "b"], "carried"), args: ["b"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("hands the entry value on when the page has none", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { exitValue } = await import("/src/handlers/occurrences.js");
			__results.push({ actual: exitValue([], "carried"), args: ["carried"], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("is true for the first element, indentation and all", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { opensFragment } = await import("/src/handlers/occurrences.js");
			let root;
			const target = (html) => {
				root.innerHTML = html;
				return root.querySelector("#target");
			};
			root = document.createElement("div");
			document.body.replaceChildren(root);
			const element = target("\n\t<h1 id=\"target\">aaa</h1>\n\t<p>body</p>");
			__results.push({ actual: opensFragment(root, element), args: [true], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("is false when text renders ahead of it", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { opensFragment } = await import("/src/handlers/occurrences.js");
			let root;
			const target = (html) => {
				root.innerHTML = html;
				return root.querySelector("#target");
			};
			root = document.createElement("div");
			document.body.replaceChildren(root);
			const element = target("<b>Title</b><h1 id=\"target\">aaa</h1>");
			__results.push({ actual: opensFragment(root, element), args: [false], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("is false when a replaced box renders ahead of it", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { opensFragment } = await import("/src/handlers/occurrences.js");
			let root;
			const target = (html) => {
				root.innerHTML = html;
				return root.querySelector("#target");
			};
			root = document.createElement("div");
			document.body.replaceChildren(root);
			const element = target("<img src=\"x.png\"><h1 id=\"target\">aaa</h1>");
			__results.push({ actual: opensFragment(root, element), args: [false], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("looks past the ancestors that contain it", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { opensFragment } = await import("/src/handlers/occurrences.js");
			let root;
			const target = (html) => {
				root.innerHTML = html;
				return root.querySelector("#target");
			};
			root = document.createElement("div");
			document.body.replaceChildren(root);
			const element = target("<section><div><h1 id=\"target\">aaa</h1></div></section>");
			__results.push({ actual: opensFragment(root, element), args: [true], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});

	test("is false for an element the fragment does not hold", async ({ page }) => {
		const results = await page.evaluate(async () => {
			const __results = [];
			const { opensFragment } = await import("/src/handlers/occurrences.js");
			let root;
			const target = (html) => {
				root.innerHTML = html;
				return root.querySelector("#target");
			};
			root = document.createElement("div");
			document.body.replaceChildren(root);
			target("<h1 id=\"target\">aaa</h1>");
			__results.push({ actual: opensFragment(root, document.createElement("h1")), args: [false], label: undefined });
			return __results;
		});
		expect(results[0].actual, results[0].label).toBe(...results[0].args);
	});
});

import { test, expect } from "./harness-fixture.js";

test("projects resolved first, blank, left, and right states onto paged pages", async ({
	page,
}) => {
	const result = await page.evaluate(async () => {
		const { PagedPreview } = window.Paged;
		const css = `
			@page { size: 300px 200px; margin: 0; }
			p { margin: 0; }
			.force-right { break-before: right; }
		`;
		const previewer = new PagedPreview();
		await previewer.preview(
			"<p>first page</p><p class=\"force-right\">third page</p>",
			[{ css }],
			document.body,
		);

		const pages = previewer.pages;
		await Promise.all(pages.map((pagedPage) => pagedPage.updateComplete));
		const states = pages.map((pagedPage) => {
			const fragment = pagedPage.querySelector("fragment-container");
			return {
				constraints: {
					first: fragment.constraints.isFirst,
					blank: fragment.constraints.isBlank,
					verso: fragment.constraints.isVerso,
					recto: fragment.constraints.isRecto,
				},
				properties: {
					first: pagedPage.first,
					blank: pagedPage.blank,
					verso: pagedPage.verso,
					recto: pagedPage.recto,
				},
				attributes: {
					first: pagedPage.hasAttribute("first"),
					blank: pagedPage.hasAttribute("blank"),
					verso: pagedPage.hasAttribute("verso"),
					recto: pagedPage.hasAttribute("recto"),
				},
				customStates: {
					first: pagedPage.matches(":state(first)"),
					blank: pagedPage.matches(":state(blank)"),
					left: pagedPage.matches(":state(left)"),
					right: pagedPage.matches(":state(right)"),
				},
			};
		});
		previewer.destroy();
		return states;
	});

	expect(result).toEqual([
		{
			constraints: { first: true, blank: false, verso: false, recto: true },
			properties: { first: true, blank: false, verso: false, recto: true },
			attributes: { first: true, blank: false, verso: false, recto: true },
			customStates: { first: true, blank: false, left: false, right: true },
		},
		{
			constraints: { first: false, blank: true, verso: true, recto: false },
			properties: { first: false, blank: true, verso: true, recto: false },
			attributes: { first: false, blank: true, verso: true, recto: false },
			customStates: { first: false, blank: true, left: true, right: false },
		},
		{
			constraints: { first: false, blank: false, verso: false, recto: true },
			properties: { first: false, blank: false, verso: false, recto: true },
			attributes: { first: false, blank: false, verso: false, recto: true },
			customStates: { first: false, blank: false, left: false, right: true },
		},
	]);
});

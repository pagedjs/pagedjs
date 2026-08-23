import { test, expect } from "./harness-fixture.js";

const CSS =
	"@page { size: 300px 200px; margin: 0; } p { margin: 0; frame-color: rgb(0, 0, 255); }";

test("extra rules apply to the previewer that declares them and to no other", async ({
	page,
}) => {
	const result = await page.evaluate(async (css) => {
		const { PagedPreview } = window.Paged;
		const rules = [
			{
				type: "declaration",
				match: ({ property }) => property === "frame-color",
				transform: () => ({ property: "background-color" }),
			},
		];

		const read = async (previewer) => {
			await previewer.preview("<p>hello</p>", [{ css }], document.body);
			const background = getComputedStyle(
				previewer.querySelector("p"),
			).backgroundColor;
			previewer.destroy();
			return background;
		};

		return {
			withRules: await read(new PagedPreview({ rules })),
			withoutRules: await read(new PagedPreview()),
		};
	}, CSS);

	expect(result.withRules).toBe("rgb(0, 0, 255)");
	expect(result.withoutRules).toBe("rgba(0, 0, 0, 0)");
});

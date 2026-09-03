import { test, expect } from "./browser-fixture.js";

const ALIGNMENT_TOLERANCE = 0.5;

test("aligns generated and slotted margin content on the physical vertical axis", async ({ page }) => {
	const results = await page.evaluate(async () => {
		await import("/src/components/PagedMargins/PagedMargins.js");

		const style = document.createElement("style");
		style.textContent = `
			.vertical::part(margin-box) { writing-mode: vertical-rl; }
			paged-margins::part(top-left) {
				--paged-margin-content: "TOP";
				--paged-margin-vertical-position: 0%;
			}
			paged-margins::part(top-center) {
				--paged-margin-content: "MIDDLE";
				--paged-margin-vertical-position: 50%;
			}
			paged-margins::part(top-right) {
				--paged-margin-content: "BOTTOM";
				--paged-margin-vertical-position: 100%;
			}
		`;
		document.head.append(style);

		const cases = [
			{ box: "top-left", content: "generated", alignment: "top" },
			{ box: "top-center", content: "generated", alignment: "middle" },
			{ box: "top-right", content: "generated", alignment: "bottom" },
			{ box: "right-top", content: "slotted", alignment: "top" },
			{ box: "right-middle", content: "slotted", alignment: "middle" },
			{ box: "right-bottom", content: "slotted", alignment: "bottom" },
		];
		const results = [];

		for (const mode of ["horizontal-tb", "vertical-rl"]) {
			const margins = document.createElement("paged-margins");
			margins.className = mode === "vertical-rl" ? "vertical" : "horizontal";
			margins.style.cssText = `
				width: 400px;
				height: 400px;
				--paged-margin-top: 100px;
				--paged-margin-right: 100px;
				--paged-margin-bottom: 100px;
				--paged-margin-left: 100px;
			`;

			for (const name of ["right-top", "right-middle", "right-bottom"]) {
				const content = document.createElement("span");
				content.slot = name;
				content.textContent = name;
				margins.append(content);
			}

			document.body.append(margins);
			await margins.updateComplete;

			for (const entry of cases) {
				const box = margins.shadowRoot.querySelector(`#${entry.box}`);
				const content = entry.content === "generated"
					? box.shadowRoot.querySelector(".generated")
					: margins.querySelector(`[slot="${entry.box}"]`);
				const boxRect = box.getBoundingClientRect();
				const contentRect = content.getBoundingClientRect();
				let delta;
				if (entry.alignment === "top") {
					delta = contentRect.top - boxRect.top;
				} else if (entry.alignment === "bottom") {
					delta = contentRect.bottom - boxRect.bottom;
				} else {
					delta = (contentRect.top + contentRect.height / 2) -
						(boxRect.top + boxRect.height / 2);
				}
				let horizontalDelta = null;
				if (mode === "horizontal-tb" && entry.box === "top-left") {
					horizontalDelta = contentRect.left - boxRect.left;
				} else if (mode === "horizontal-tb" && entry.box === "top-center") {
					horizontalDelta = (contentRect.left + contentRect.width / 2) -
						(boxRect.left + boxRect.width / 2);
				} else if (mode === "horizontal-tb" && entry.box === "top-right") {
					horizontalDelta = contentRect.right - boxRect.right;
				}
				results.push({ ...entry, mode, delta, horizontalDelta });
			}

			margins.remove();
		}

		return results;
	});

	for (const result of results) {
		expect(Math.abs(result.delta), `${result.mode} ${result.box} ${result.alignment}`).toBeLessThanOrEqual(
			ALIGNMENT_TOLERANCE,
		);
		if (result.horizontalDelta !== null) {
			expect(Math.abs(result.horizontalDelta), `horizontal placement of ${result.box}`).toBeLessThanOrEqual(
				ALIGNMENT_TOLERANCE,
			);
		}
	}
});

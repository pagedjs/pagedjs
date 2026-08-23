import { LayoutHandler } from "fragmentainers/handlers";

const runningElementRules = [
	{
		type: "declaration",
		match: ({ property, value }) =>
			property === "position" && /^\s*running\(/i.test(value),
		transform: ({ value }) => ({
			declarations: [
				{ property: "--page-position", value: value.trim() },
				{ property: "display", value: "none" },
			],
		}),
	},
	{
		type: "function",
		match: ({ name, args, declaration }) =>
			declaration.property === "content" &&
			name.toLowerCase() === "element" &&
			args.length === 1,
		transform: ({ args }) => ({ value: `var(--element_${slug(args[0])})` }),
	},
];

/**
 * Running elements (css-gcpm-3 §3): `position: running(name)` takes an
 * element out of the flow and `content: element(name)` projects it into a
 * margin box.
 *
 * The rewrites are complete but the capture and projection they depend on
 * are not, so this class is deliberately absent from `pagedHandlers` —
 * pushing it would hide the running elements with nothing to render them.
 */
export class RunningElements extends LayoutHandler {
	static rules = runningElementRules;
}

function slug(name) {
	return name.replace(/^["']|["']$/g, "").replace(/\s+/g, "_");
}

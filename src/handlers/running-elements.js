import { LayoutHandler } from "fragmentainers/handlers";

const runningElementRules = [
	{
		type: "declaration",
		match: ({ property, valueString }) =>
			property === "position" && /^\s*running\(/i.test(valueString),
		transform: ({ valueString }) => ({
			declarations: [
				{ property: "--page-position", value: valueString.trim() },
				{ property: "display", value: "none" },
			],
		}),
	},
	{
		type: "declaration",
		match: ({ property, valueAST }) =>
			property === "content" && readElementName(valueAST) !== null,
		transform: ({ valueAST }) => {
			const name = readElementName(valueAST);
			if (name === null) return null;
			return { value: `var(--element_${name})` };
		},
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

function readElementName(valueAST) {
	const nodes = childrenToArray(valueAST);
	if (nodes.length !== 1) return null;

	const node = nodes[0];
	if (node.type !== "Function" || node.name.toLowerCase() !== "element") {
		return null;
	}

	const args = childrenToArray(node);
	if (args.length !== 1) return null;

	const name = readName(args[0]);
	return name ? name.replace(/\s+/g, "_") : null;
}

function readName(node) {
	if (node.type === "Identifier") return node.name;
	if (node.type === "String") return node.value;
	return null;
}

function childrenToArray(node) {
	const children = [];
	node?.children?.forEach((child) => children.push(child));
	return children;
}

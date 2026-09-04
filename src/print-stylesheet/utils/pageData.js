import { resolveBleed } from "./bleed.js";

export const MARGIN_BOX_NAMES = new Set([
	"top-left-corner",
	"top-left",
	"top-center",
	"top-right",
	"top-right-corner",
	"right-top",
	"right-middle",
	"right-bottom",
	"bottom-left-corner",
	"bottom-left",
	"bottom-center",
	"bottom-right",
	"bottom-right-corner",
	"left-top",
	"left-middle",
	"left-bottom",
]);

const PAGE_SIDES = ["top", "right", "bottom", "left"];
const PAGE_BOX_DECLARATION_RE = /^(?:padding(?:-(?:top|right|bottom|left))?|border(?:-(?:width|style|color|(?:top|right|bottom|left)(?:-(?:width|style|color))?))?)$/;

/**
 * Read original page declarations from the prepared AST, before transforms.
 * @param {import("css-tree").CssNode} ast Prepared stylesheet AST.
 * @param {(node: import("css-tree").CssNode) => string} generate AST serializer.
 * @returns {PageRule[]} Page rules in source order.
 */
export function collectAllPageData(ast, generate) {
	const out = [];
	function visit(node) {
		if (node.type === "Atrule") {
			if (node.name === "page") {
				out.push(extractPageData(node, generate));
				return;
			}
		}
		node.children?.forEach(visit);
		if (node.block) visit(node.block);
	}
	visit(ast);
	return out;
}
/**
 * Declarations inside a single page-margin box, keyed by CSS property name.
 * @typedef {Object<string, string>} MarginBoxDeclarations
 */

/**
 * Per-direction page margin values. Fields are `null` when the corresponding
 * direction has not been set by either `margin` shorthand or `margin-<dir>`.
 * @typedef {Object} PageMargin
 * @property {string|null} top
 * @property {string|null} right
 * @property {string|null} bottom
 * @property {string|null} left
 */

/**
 * Coefficients for a `:nth(An+B)` pseudo-class. `odd`/`even` are normalized
 * to `{a: 2, b: 1}` and `{a: 2, b: 0}` respectively.
 * @typedef {Object} PageNth
 * @property {number} a
 * @property {number} b
 */

/**
 * Structured form of a single `@page` at-rule.
 * @typedef {Object} PageRule
 * @property {string|null} name - Named page type ('chapter', 'cover'), or null for the universal `@page`.
 * @property {string[]} pseudo - Subset of 'first', 'left', 'right', 'blank'.
 * @property {PageNth|null} nth - `:nth(An+B)` coefficients, or null if no `:nth` pseudo is present.
 * @property {string|null} size - CSS `size` value ("A4", "210mm 297mm", ...), or null.
 * @property {PageMargin|null} margin - Per-direction margins, or null when no margin declaration appears.
 * @property {PageMargin|null} padding - Per-direction padding, or null when no padding declaration appears.
 * @property {Object<string, {width: string|null, style: string|null, color: string|null}>|null} border - Per-side border declarations, or null.
 * @property {string|null} pageOrientation - CSS `page-orientation` value ('rotate-left', 'rotate-right', 'upright'), or null.
 * @property {string|null} bleed - Used `bleed` length (see `resolveBleed`), or null.
 * @property {boolean} bleedAuto - Whether `bleed` was explicitly declared as `auto`.
 * @property {string|null} marks - CSS `marks` value, or null.
 * @property {Object<string, MarginBoxDeclarations>|null} marginBoxes - Map of margin-box name to its declarations, or null.
 */

/**
 * Extract a page rule without parsing or changing the supplied nodes.
 * @param {import("css-tree").Atrule} atruleNode
 * @param {(node: import("css-tree").CssNode) => string} generate AST serializer.
 * @returns {PageRule}
 */
export function extractPageData(atruleNode, generate) {
	const { name, pseudo, nth } = extractPagePrelude(atruleNode.prelude);
	/** @type {PageRule} */
	const out = {
		name,
		pseudo,
		nth,
		size: null,
		margin: null,
		padding: null,
		border: null,
		pageOrientation: null,
		bleed: null,
		bleedAuto: false,
		marks: null,
		marginBoxes: null,
	};

	const block = atruleNode.block;
	if (!block || !block.children) return out;

	const pageBoxDeclarations = [];
	block.children.forEach((c) => {
		if (!c) return;

		if (c.type === "Atrule" && MARGIN_BOX_NAMES.has(c.name)) {
			if (!out.marginBoxes) out.marginBoxes = {};
			const decls = {};
			if (c.block && c.block.children) {
				c.block.children.forEach((dc) => {
					if (!dc || dc.type !== "Declaration") return;
					decls[dc.property] = generate(dc.value).trim();
				});
			}
			out.marginBoxes[c.name] = decls;
			return;
		}

		if (c.type !== "Declaration") return;
		const value = generate(c.value).trim();
		if (PAGE_BOX_DECLARATION_RE.test(c.property)) {
			pageBoxDeclarations.push(
				`${c.property}:${value}${c.important ? "!important" : ""};`,
			);
		}
		switch (c.property) {
			case "size":
				out.size = value;
				break;
			case "bleed":
				out.bleed = value;
				out.bleedAuto = value.trim().toLowerCase() === "auto";
				break;
			case "marks":
				out.marks = value;
				break;
			case "page-orientation":
				out.pageOrientation = value;
				break;
			case "margin": {
				const m = parseMarginShorthand(value);
				out.margin = { top: m.top, right: m.right, bottom: m.bottom, left: m.left };
				break;
			}
			case "margin-top":
				if (!out.margin) out.margin = emptyMargin();
				out.margin.top = value;
				break;
			case "margin-right":
				if (!out.margin) out.margin = emptyMargin();
				out.margin.right = value;
				break;
			case "margin-bottom":
				if (!out.margin) out.margin = emptyMargin();
				out.margin.bottom = value;
				break;
			case "margin-left":
				if (!out.margin) out.margin = emptyMargin();
				out.margin.left = value;
				break;
		}
	});

	const pageBox = normalizePageBoxDeclarations(pageBoxDeclarations);
	out.padding = pageBox.padding;
	out.border = pageBox.border;

	out.bleed = resolveBleed(out.bleed, out.marks);

	return out;
}

function normalizePageBoxDeclarations(declarations) {
	if (declarations.length === 0) return { padding: null, border: null };
	const style = document.createElement("div").style;
	style.cssText = declarations.join("");

	const padding = {};
	let hasPadding = false;
	for (const side of PAGE_SIDES) {
		const value = style.getPropertyValue(`padding-${side}`).trim() || null;
		padding[side] = value;
		if (value != null) hasPadding = true;
	}

	const border = {};
	let hasBorder = false;
	for (const side of PAGE_SIDES) {
		const edge = {};
		for (const field of ["width", "style", "color"]) {
			const value = style.getPropertyValue(`border-${side}-${field}`).trim() || null;
			edge[field] = value;
			if (value != null) hasBorder = true;
		}
		border[side] = edge;
	}

	return {
		padding: hasPadding ? padding : null,
		border: hasBorder ? border : null,
	};
}

/**
 * Read a page selector's name, pseudo-classes, and raw nth argument.
 * @param {import("css-tree").AtrulePrelude|null} prelude
 * @returns {{ name: string|null, pseudo: string[], nth: PageNth|null }}
 */
export function extractPagePrelude(prelude) {
	if (!prelude) return { name: null, pseudo: [], nth: null };
	let name = null;
	const pseudo = [];
	let nth = null;
	function visit(node) {
		if (node.type === "TypeSelector" && node.name) name = node.name;
		if (node.type === "Identifier" && name == null) name = node.name;
		if (node.type === "PseudoClassSelector") {
			if (node.name === "nth") {
				nth = parseNth(node.children?.first?.value ?? null);
			} else {
				pseudo.push(node.name);
			}
			return;
		}
		node.children?.forEach(visit);
	}
	visit(prelude);
	return { name, pseudo, nth };
}

/**
 * Parse an `An+B` microsyntax expression (plus the `odd`/`even` keywords)
 * into `{a, b}` coefficients. Returns null for unparseable input.
 * @param {string|null} arg
 * @returns {PageNth|null}
 */
export function parseNth(arg) {
	if (arg == null) return null;
	const s = arg.trim().toLowerCase();
	if (s === "") return null;
	if (s === "odd") return { a: 2, b: 1 };
	if (s === "even") return { a: 2, b: 0 };

	const anb = s.match(/^([+-]?\d*)n(?:\s*([+-])\s*(\d+))?$/);
	if (anb) {
		const rawA = anb[1];
		let a;
		if (rawA === "" || rawA === "+") a = 1;
		else if (rawA === "-") a = -1;
		else a = parseInt(rawA, 10);
		const b = anb[2] ? parseInt(anb[2] + anb[3], 10) : 0;
		return { a, b };
	}

	if (/^[+-]?\d+$/.test(s)) return { a: 0, b: parseInt(s, 10) };
	return null;
}

function emptyMargin() {
	return { top: null, right: null, bottom: null, left: null };
}

/**
 * Expand a page margin shorthand into physical sides.
 * @param {string} m Margin shorthand.
 * @returns {Object<string, string>} Values for top, right, bottom, and left.
 */
export function parseMarginShorthand(m) {
	const parts = (m || "0").trim().split(/\s+/);
	switch (parts.length) {
		case 4:
			return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
		case 3:
			return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
		case 2:
			return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
		default:
			return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
	}
}

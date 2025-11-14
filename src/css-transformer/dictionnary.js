import { renameAtRule, renameProperty, renameValue } from "./renamer.js";

/**
 * @fileoverview
 * Provides a utility to rename CSS properties, at-rules, and values
 * in a CSS Abstract Syntax Tree (AST) to make them compatible with Paged.js.
 *
 * This includes transforming properties like `bleed` → `--paged-bleed`,
 * at-rules like `@page` → `@paged-page`, and specific property values.
 */

/**
 * List of CSS properties to rename.
 * Each entry maps an original property name to its replacement.
 * @type {Array<[string, string]>}
 */
const properties = [
  ["bleed", "--paged-bleed"],
  ["string-set", "--string-set"],
  ["marks", "--paged-marks"],
];

/**
 * List of CSS at-rules to rename.
 * Each entry maps an original at-rule name to its replacement.
 * @type {Array<[string, string]>}
 */
const atRules = [
  //@page
  ["page", "paged-page"],

  //@footnotes
  ["footnotes", ".paged-footnotes"],

  // @top margins
  ["top-left-corner", "& .top-left-corner"],
  ["top-left", "& .top-left"],
  ["top-center", "& .top-center"],
  ["top-right", "& .top-right"],
  ["top-right-corner", "& .top-right-corner"],

  // @bottom margins
  ["bottom-left-corner", "& .bottom-left-corner"],
  ["bottom-left", "& .bottom-left"],
  ["bottom-center", "& .bottom-center"],
  ["bottom-right", "& .bottom-right"],
  ["bottom-right-corner", "& .bottom-right-corner"],

  // @left margins
  ["left-top", "& .left-top"],
  ["left-middle", "& .left-middle"],
  ["left-bottom", "& .left-bottom"],

  // @right margins
  ["right-top", "& .right-top"],
  ["right-middle", "& .right-middle"],
  ["right-bottom", "& .right-bottom"],
];

/**
 * List of CSS values to rename, scoped to specific properties.
 * Each entry is structured as:
 * [originalValue, replacementValue, propertyToMatch]
 * @type {Array<[string, string, string]>}
 */
const values = [["bottom", "var(--paged-bottom)", "float"]];

/**
 * Renames CSS properties, at-rules, and values within a CSS AST
 * for Paged.js compatibility.
 *
 * @function pagedjsRenamer
 * @param {object} ast - The CSS Abstract Syntax Tree to be modified.
 * @returns {object} The modified AST with all required renames applied.
 *
 * @example
 * import { pagedjsRenamer } from "./pagedjsRenamer.js";
 * const transformedAst = pagedjsRenamer(ast);
 */
export function pagedjsRenamer(ast) {
  // Rename all targeted CSS properties
  for (const [property, replacement] of properties) {
    renameProperty({ property, replacement, ast });
  }

  // Rename all targeted at-rules (e.g., @page → @paged-page)
  for (const [name, replacement] of atRules) {
    renameAtRule({ name, replacement, ast });
  }

  // Rename specific CSS values inside certain properties
  for (const [value, replacement, property] of values) {
    renameValue({ value, replacement, property, ast });
  }

  return ast;
}

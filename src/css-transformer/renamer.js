import * as csstree from "css-tree";

/**
 * Renames specific CSS values within a given AST.
 *
 * Searches through declaration nodes for a matching property/value pair
 * and replaces the value with a new one.
 *
 * @function renameValue
 * @param {Object} params - Function parameters.
 * @param {string} params.value - The CSS value to search for.
 * @param {string} [params.property] - The CSS property name to filter by (optional).
 * @param {string} params.replacement - The new CSS value to replace with.
 * @param {Object} params.ast - The CSS AST to modify.
 * @returns {Array<Object>} An array of replaced declaration nodes.
 */
export function renameValue({ value, property, replacement, ast }) {
  if (!value) return [];

  const replacements = [];

  csstree.walk(ast, {
    visit: "Declaration",
    enter: (node, item, list) => {
      if (!property || node.property === property) {
        const valueString = csstree.generate(node.value);
        if (valueString === value) {
          replacements.push({ node, item, list });
        }
      }
    },
  });

  for (const { node, item, list } of replacements) {
    const newDeclaration = {
      type: "Declaration",
      loc: node.loc,
      important: node.important,
      property: node.property,
      value: csstree.parse(replacement, { context: "value" }),
    };

    const newItem = list.createItem(newDeclaration);
    list.replace(item, newItem);
  }

  return replacements;
}

/**
 * Renames CSS property names within a given AST.
 *
 * Walks the AST and replaces all occurrences of a property name with a new one.
 *
 * @function renameProperty
 * @param {Object} params - Function parameters.
 * @param {string} params.property - The CSS property name to search for.
 * @param {string} params.replacement - The new property name to use.
 * @param {Object} params.ast - The CSS AST to modify.
 * @returns {void}
 */
export function renameProperty({ property, replacement, ast }) {
  const replacements = [];

  csstree.walk(ast, {
    visit: "Declaration",
    enter: (node, item, list) => {
      if (node.property === property) {
        replacements.push({ node, item, list, replacement });
      }
    },
  });

  console.log(replacements);

  for (const { node, item, list, replacement } of replacements) {
    const newDeclaration = {
      type: "Declaration",
      loc: node.loc,
      important: node.important,
      property: replacement,
      value: node.value,
    };

    const newItem = list.createItem(newDeclaration);
    list.replace(item, newItem);
  }
}

/**
 * Renames CSS at-rules (e.g., @page, @media) in a given AST by transforming them into
 * standard rules with renamed selectors.
 *
 * For example, `@page:left` could become `.paged-page.paged-name-left`.
 *
 * @function renameAtRule
 * @param {Object} params - Function parameters.
 * @param {string} params.name - The name of the at-rule to replace (e.g., "page").
 * @param {string} [params.replacement] - The new selector prefix to use (defaults to `.paged-${name}`).
 * @param {Object} params.ast - The CSS AST to modify.
 * @returns {void}
 */
export function renameAtRule({ name, replacement, ast }) {
  const replacements = [];

  csstree.walk(ast, {
    visit: "Atrule",
    enter: (node, item, list) => {
      if (node.name === name) {
        replacements.push({ node, item, list });
      }
    },
  });

  for (const { node, item, list } of replacements) {
    let prelude = {};
    if (node.prelude) {
      console.log(node.prelude);
      prelude.name = csstree.generate(node.prelude).split(":")[0];
      prelude.pseudo = csstree
        .generate(node.prelude)
        .replace(/\(/g, "_")
        .replace(/\)/g, "")
        .split(":")[1];
    }

    const newRule = {
      type: "Rule",
      prelude: csstree.parse(
        `${replacement ? replacement : `.paged-${name}`}${prelude.name ? `.paged-name-${prelude.name}` : ``}${prelude.pseudo ? `.paged-pseudo-${prelude.pseudo}` : ``}`,
        { context: "selectorList" },
      ),
      loc: node.loc,
      block: csstree.clone(node.block),
    };

    const newItem = list.createItem(newRule);
    list.replace(item, newItem);
  }
}

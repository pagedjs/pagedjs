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
 *
 * replacement can be a functoin
 *
 * renameValue({
 * property: "content",
 * value: '"hello"',
 * replacement: ({ valueString }) => {
 *   const inner = valueString.replace(/^["']|["']$/g, ""); // remove quotes
 *   return `"${inner.toUpperCase()}"`;
 * },
 * ast
 *  });
 *
 *  or
 *
 *  renameValue({
 *   property: "color",
 *   value: "red",
 *   replacement: ({ node }) => {
 *     if (node.important) return "blue !important";
 *     return "blue";
 *   },
 *   ast
 * });
 */
export function renameValue({ value, property, replacement, ast }) {
  if (!value) return [];

  const matches = [];

  csstree.walk(ast, {
    visit: "Declaration",
    enter: (node, item, list) => {
      if (!property || node.property === property) {
        const valueString = csstree.generate(node.value);
        if (valueString === value) {
          matches.push({ node, item, list, valueString, valueAST: node.value });
        }
      }
    },
  });

  for (const match of matches) {
    const { node, item, list, valueString, valueAST } = match;

    let replacementValueString;

    if (typeof replacement === "function") {
      // Call user function
      replacementValueString = replacement({
        node,
        valueAST,
        valueString,
      });

      if (typeof replacementValueString !== "string") {
        throw new Error("replacement function must return a string");
      }
    } else {
      // Static string replacement
      replacementValueString = replacement;
    }

    const newDeclaration = {
      type: "Declaration",
      loc: node.loc,
      important: node.important,
      property: node.property,
      value: csstree.parse(replacementValueString, { context: "value" }),
    };

    const newItem = list.createItem(newDeclaration);
    list.replace(item, newItem);
  }

  return matches;
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
 *
 * replacement can also be a fuction: use like this:
 * renameProperty({ property: "margin-left", replacement: "inset-inline-start", ast });

 */
export function renameProperty({ property, replacement, ast }) {
  const matches = [];

  csstree.walk(ast, {
    visit: "Declaration",
    enter: (node, item, list) => {
      if (node.property === property) {
        matches.push({
          node,
          item,
          list,
          valueAST: node.value,
        });
      }
    },
  });

  for (const { node, item, list, valueAST } of matches) {
    let newProperty;

    if (typeof replacement === "function") {
      newProperty = replacement({
        node,
        property: node.property,
        valueAST,
      });

      if (typeof newProperty !== "string") {
        throw new Error("replacement function must return a string");
      }
    } else {
      newProperty = replacement;
    }

    const newDeclaration = {
      type: "Declaration",
      loc: node.loc,
      important: node.important,
      property: newProperty,
      value: node.value,
    };

    const newItem = list.createItem(newDeclaration);
    list.replace(item, newItem);
  }

  return matches;
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
  if (!name) return;
  if (!replacement) return;

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
      prelude.name = csstree.generate(node.prelude).trim().split(":")[0].trim();

      if (csstree.generate(node.prelude).trim().split(":")[1]) {
        prelude.pseudo = csstree
          .generate(node.prelude)
          .replace(/\(/g, "_")
          .replace(/\)/g, "")
          .split(":")[1]
          .trim();
      }
    }

    console.log(prelude);

    const newRule = {
      type: "Rule",
      prelude: csstree.parse(
        `${replacement ? replacement : `.paged-${name}`}${prelude.name ? `.paged-name-${prelude.name}` : ``}${prelude.pseudo ? `.paged-pseudo-${prelude.pseudo.trim()}` : ``}`,
        { context: "selectorList" },
      ),
      loc: node.loc,
      block: csstree.clone(node.block),
    };

    const newItem = list.createItem(newRule);
    list.replace(item, newItem);
  }
}

/**
 * Rename the value of `content:` declarations when they match a specific search expression.
 *
 * Supports both static string replacement and dynamic function-based replacement.
 *
 * @param {Object} options
 * @param {string} options.search
 *   The exact generated CSS value to match (including quotes), e.g. `"hello"`.
 *
 * @param {string | function(Object): string} options.replacement
 *   Either:
 *   - A string specifying the new `content` value (must be valid CSS value syntax), or
 *   - A function that receives context about the matched declaration and returns a replacement string.
 *
 *   Replacement function signature:
 *   ```js
 *   ({ node, valueString, valueAST }) => string
 *   ```
 *   - `node`        → the current Declaration AST node
 *   - `valueString` → the generated value string (e.g. `"hello"`)
 *   - `valueAST`    → the AST node of the declaration's value
 *
 * @param {Object} options.ast
 *   A CSSTree AST to operate on.
 *
 * @returns {Array<Object>}
 *   List of matches containing `{ node, item, list, valueString, valueAST }`.
 *
 * @example
 * // Simple direct replacement
 * renameContentValue({
 *   search: '"hello"',
 *   replacement: '"world"',
 *   ast
 * });
 *
 * @example
 * // Dynamic replacement using a function
 * renameContentValue({
 *   search: '"hello"',
 *   replacement: ({ valueString }) => {
 *     const inner = valueString.slice(1, -1); // strip quotes
 *     return `"${inner.toUpperCase()}"`;
 *   },
 *   ast
 * });
 */
export function renameContentValue({ search, replacement, ast }) {
  if (!search) return [];

  const matches = [];

  csstree.walk(ast, {
    visit: "Declaration",
    enter: (node, item, list) => {
      if (node.property === "content") {
        const valueString = csstree.generate(node.value);
        if (valueString === search || valueString.includes(search)) {
          matches.push({
            node,
            item,
            list,
            valueString,
            valueAST: node.value,
          });
        }
      }
    },
  });

  for (const { node, item, list, valueString, valueAST } of matches) {
    let newValueString;

    if (typeof replacement === "function") {
      newValueString = replacement({
        node,
        valueString,
        valueAST,
      });

      if (typeof newValueString !== "string") {
        throw new Error("replacement function must return a string");
      }
    } else {
      newValueString = replacement;
    }

    const newDeclaration = {
      type: "Declaration",
      loc: node.loc,
      important: node.important,
      property: "content",
      value: csstree.parse(newValueString, { context: "value" }),
    };

    const newItem = list.createItem(newDeclaration);
    list.replace(item, newItem);
  }

  return matches;
}

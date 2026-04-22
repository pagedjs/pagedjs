import * as csstree from "css-tree";

/**
 * Unified transformer for all @rules, including @page.
 *
 * Each rule is:
 * {
 *   match: (node) => boolean,
 *   transform: (node) => void
 * }
 */
export function transformAtRules(ast, rules = []) {
  csstree.walk(ast, {
    visit: "Atrule",
    enter(node, item, list) {
      for (const rule of rules) {
        if (rule.match(node, item, list)) {
          rule.transform(node, item, list);
        }
      }
    },
  });

  return ast;
}

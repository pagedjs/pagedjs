import * as csstree from "css-tree";

/**
 * Transform pseudo selectors (pseudo-classes and pseudo-elements)
 * using the same match/transform API as declarations and at-rules.
 */
export function transformPseudos(ast, rules = []) {
  csstree.walk(ast, {
    visit: "Selector",
    enter(node) {
      const selectorString = csstree.generate(node);

      for (const rule of rules) {
        if (!rule.match(selectorString, node)) continue;

        const newSelector = rule.transform(selectorString, node);
        if (!newSelector || newSelector === selectorString) continue;

        // Update the selector AST
        const newAst = csstree.parse(newSelector, {
          context: "selector",
        });

        node.children = newAst.children;
      }
    },
  });

  return ast;
}

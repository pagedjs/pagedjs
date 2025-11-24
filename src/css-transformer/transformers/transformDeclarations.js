import * as csstree from "css-tree";

/**
 * Runs unified transformation rules on all CSS declarations.
 *
 * Each rule defines:
 * match({ property, valueString, valueAST, node })
 * transform({ property, valueString, valueAST, node }) => { property?, value? }
 */
export function transformDeclarations(ast, rules = []) {
  csstree.walk(ast, {
    visit: "Declaration",
    enter(node) {
      const property = node.property;
      const valueString = csstree.generate(node.value);
      const valueAST = node.value;

      for (const rule of rules) {
        if (!rule.match({ property, valueString, valueAST, node })) {
          continue;
        }

        const result = rule.transform({
          property,
          valueString,
          valueAST,
          node,
        });

        if (!result) continue;

        if (result.property) {
          node.property = result.property;
        }

        if (result.value) {
          node.value = csstree.parse(result.value, { context: "value" });
        }
      }
    },
  });

  return ast;
}

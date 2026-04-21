import * as csstree from "css-tree";

/**
 * Runs transformation rules **only on `content` declarations**.
 *
 * Each rule defines:
 * match({ valueString, valueAST, node })
 * transform({ valueString, valueAST, node }) => { value? }
 */
export function transformContentDeclarations(ast, rules = []) {
  csstree.walk(ast, {
    visit: "Declaration",
    enter(node) {
      // Only target the 'content' property
      if (node.property !== "content") return;

      const valueString = csstree.generate(node.value);
      const valueAST = node.value;

      for (const rule of rules) {
        if (!rule.match({ valueString, valueAST, node })) continue;

        const result = rule.transform({ valueString, valueAST, node });
        if (!result) continue;

        if (result.value) {
          node.value = csstree.parse(result.value, { context: "value" });
        }
      }
    },
  });

  return ast;
}

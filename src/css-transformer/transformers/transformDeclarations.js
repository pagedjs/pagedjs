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
    enter(node, item, list) {
      const args = {
        property: node.property,
        valueString: csstree.generate(node.value),
        valueAST: node.value,
        node,
        item,
        list,
      };

      for (const rule of rules) {
        if (!rule.match(args)) continue;

        const result = rule.transform(args);
        if (!result) continue;

        if (Array.isArray(result.declarations)) {
          if (!item || !list) continue;
          for (const decl of result.declarations) {
            const declNode = buildDeclaration(decl);
            list.insert(list.createItem(declNode), item);
          }
          list.remove(item);
          return;
        }

        if (result.property) node.property = result.property;
        if (result.value) {
          node.value = csstree.parse(result.value, { context: "value" });
        }

        args.property = node.property;
        args.valueAST = node.value;
        args.valueString = csstree.generate(node.value);
      }
    },
  });

  return ast;
}

function buildDeclaration({ property, value, important = false }) {
  return {
    type: "Declaration",
    important,
    property,
    value:
      typeof value === "string"
        ? csstree.parse(value, { context: "value" })
        : value,
  };
}

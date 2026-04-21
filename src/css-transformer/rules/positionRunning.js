import * as csstree from "css-tree";

export default [
  {
    match: ({ property, valueAST }) => {
      if (property !== "content") return false;
      let found = false;
      csstree.walk(valueAST, {
        visit: "Function",
        enter(node) {
          console.log(node.name);
          if (node.name === "element") {
            found = true;
          }
        },
      });
      return found;
    },

    transform: ({ valueAST, node }) => {
      csstree.walk(valueAST, {
        visit: "Function",
        enter(fnNode) {
          if (fnNode.name === "element") {
            const args = fnNode.children;
            if (args && args.head) {
              const firstArg = args.head.data;
              let name;
              if (firstArg.type === "Identifier") {
                name = firstArg.name;
              } else if (firstArg.type === "String") {
                name = firstArg.value.slice(1, -1);
              }

              if (name) {
                const varAst = csstree.parse(`var(--paged-element_${name})`, {
                  context: "value",
                });
                fnNode.type = varAst.type;
                Object.assign(fnNode, varAst);
              }
            }
          }
        },
      });

      node.value = valueAST;
      return { value: csstree.generate(valueAST) };
    },
  },
];

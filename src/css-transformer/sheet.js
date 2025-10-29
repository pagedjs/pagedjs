import * as csstree from "css-tree";
import Hook from "../utils/hook.js";

export class Sheet {
  constructor(url, hooks) {
    if (hooks) {
      this.hooks = hooks;
    } else {
      this.hooks = {};
      this.hooks.onAtPage = new Hook(this);
      this.hooks.onAtMedia = new Hook(this);
      this.hooks.onRule = new Hook(this);
      this.hooks.onDeclaration = new Hook(this);
      this.hooks.onSelector = new Hook(this);
      this.hooks.onPseudoSelector = new Hook(this);

      this.hooks.onContent = new Hook(this);
      this.hooks.onImport = new Hook(this);

      this.hooks.beforeTreeParse = new Hook(this);
      this.hooks.beforeTreeWalk = new Hook(this);

      this.hooks.afterTreeWalk = new Hook(this);
    }
  }

  async parse(text) {
    this.text = text;
  }

  // generate the css
  toString(ast) {
    return csstree.generate(ast || this.ast);
  }

  urls(ast) {
    csstree.walk(ast, {
      visit: "Url",
      enter: (node, item, list) => {
        this.hooks.onUrl.trigger(node, item, list);
      },
    });
  }

  /**
   * Processes all at-rules and triggers relevant hooks.
   * @param {Object} ast - CSS AST.
   */
  atrules(ast) {
    csstree.walk(ast, {
      visit: "Atrule",
      enter: (node, item, list) => {
        const basename = csstree.keyword(node.name).basename;

        if (basename === "page") {
          this.hooks.onAtPage.trigger(node, item, list);
          this.declarations(node, item, list);
        }

        if (basename === "media") {
          this.hooks.onAtMedia.trigger(node, item, list);
          this.declarations(node, item, list);
        }

        if (basename === "import") {
          this.hooks.onImport.trigger(node, item, list);
          this.imports(node, item, list);
        }
      },
    });
  }

  /**
   * Processes rule nodes and triggers related hooks.
   * @param {Object} ast - CSS AST.
   */
  rules(ast) {
    csstree.walk(ast, {
      visit: "Rule",
      enter: (ruleNode, ruleItem, rulelist) => {
        this.hooks.onRule.trigger(ruleNode, ruleItem, rulelist);
        this.declarations(ruleNode, ruleItem, rulelist);
        this.onSelector(ruleNode, ruleItem, rulelist);
      },
    });
  }

  /**
   * Triggers onDeclaration and onContent hooks for declarations.
   * @param {Object} ruleNode
   * @param {*} ruleItem
   * @param {*} rulelist
   */
  declarations(ruleNode, ruleItem, rulelist) {
    csstree.walk(ruleNode, {
      visit: "Declaration",
      enter: (declarationNode, dItem, dList) => {
        this.hooks.onDeclaration.trigger(declarationNode, dItem, dList, {
          ruleNode,
          ruleItem,
          rulelist,
        });

        if (declarationNode.property === "content") {
          csstree.walk(declarationNode, {
            visit: "Function",
            enter: (funcNode, fItem, fList) => {
              this.hooks.onContent.trigger(
                funcNode,
                fItem,
                fList,
                { declarationNode, dItem, dList },
                { ruleNode, ruleItem, rulelist },
              );
            },
          });
        }
      },
    });
  }

  /**
   * Handles selector and pseudo-selector hooks.
   * @param {Object} ruleNode
   * @param {*} ruleItem
   * @param {*} rulelist
   */
  onSelector(ruleNode, ruleItem, rulelist) {
    csstree.walk(ruleNode, {
      visit: "Selector",
      enter: (selectNode, selectItem, selectList) => {
        this.hooks.onSelector.trigger(selectNode, selectItem, selectList, {
          ruleNode,
          ruleItem,
          rulelist,
        });

        selectNode.children.forEach((node) => {
          if (node.type === "PseudoElementSelector") {
            csstree.walk(node, {
              visit: "PseudoElementSelector",
              enter: (pseudoNode, pItem, pList) => {
                this.hooks.onPseudoSelector.trigger(
                  pseudoNode,
                  pItem,
                  pList,
                  { selectNode, selectItem, selectList },
                  { ruleNode, ruleItem, rulelist },
                );
              },
            });
          }
        });
      },
    });
  }

  /**
   * Converts ID selectors to [data-id="..."] format.
   * @param {Object} ast - CSS AST.
   */
  replaceIds(ast) {
    csstree.walk(ast, {
      visit: "Rule",
      enter: (node) => {
        csstree.walk(node, {
          visit: "IdSelector",
          enter: (idNode) => {
            let name = idNode.name;
            idNode.flags = null;
            idNode.matcher = "=";
            idNode.name = { type: "Identifier", loc: null, name: "data-id" };
            idNode.type = "AttributeSelector";
            idNode.value = { type: "String", loc: null, value: `"${name}"` };
          },
        });
      },
    });
  }
}

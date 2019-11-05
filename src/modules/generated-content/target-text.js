import Handler from "../handler";
import { UUID, attr, querySelectorEscape } from "../../utils/utils";
import csstree from "css-tree";
import { nodeAfter } from "../../utils/dom";

class TargetText extends Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);

    this.styleSheet = polisher.styleSheet;
    this.textTargets = {};
    this.beforeContent = "";
    this.afterContent = "";
    this.selector = {};
  }

  onContent(funcNode, fItem, fList, declaration, rule) {
    if (funcNode.name === "target-text") {
      this.selector = csstree.generate(rule.ruleNode.prelude);
      let first = funcNode.children.first();
      let last = funcNode.children.last();
      let func = first.name;

      let value = csstree.generate(funcNode);

      let args = [];

      first.children.forEach(child => {
        if (child.type === "Identifier") {
          args.push(child.name);
        }
      });

      let style;
      if (last !== first) {
        style = last.name;
      }

      let variable = "--pagedjs-" + UUID();

      this.selector.split(",").forEach(s => {
        this.textTargets[s] = {
          func: func,
          args: args,
          value: value,
          style: style || "content",
          selector: s,
          fullSelector: this.selector,
          variable: variable
        };
      });

      // Replace with variable
      funcNode.name = "var";
      funcNode.children = new csstree.List();
      funcNode.children.appendData({
        type: "Identifier",
        loc: 0,
        name: variable
      });
    }
  }

  //   parse this on the ONCONTENT : get all before and after and replace the value with a variable
  onPseudoSelector(pseudoNode, pItem, pList, selector, rule) {
    // console.log(pseudoNode);
    // console.log(rule);

    rule.ruleNode.block.children.forEach(properties => {
      if (pseudoNode.name === "before" && properties.property === "content") {
        let beforeVariable = "--pagedjs-" + UUID();

        let contenu = properties.value.children;
        console.log(contenu);
        contenu.forEach(prop => {
          if (prop.type === "String") {
            this.beforeContent = prop.value;
          }
        });
      } else if (pseudoNode.name === "after" && properties.property === "content") {
        let content = properties.value.children.forEach(prop => {
          if (prop.type === "String") {
            this.afterContent = prop.value;
          }
        });
      }
    });
  }

  afterParsed(fragment) {
    Object.keys(this.textTargets).forEach(name => {
      let target = this.textTargets[name];
      let split = target.selector.split("::");
      let query = split[0];
      let queried = fragment.querySelectorAll(query);
      queried.forEach((selected, index) => {
        let val = attr(selected, target.args);
        let element = fragment.querySelector(querySelectorEscape(val));
        if (element) {
          if (target.style === "content") {
            this.selector = UUID();
            selected.setAttribute("data-target-text", this.selector);

            let psuedo = "";
            if (split.length > 1) {
              psuedo += "::" + split[1];
            }

            let textContent = element.textContent
              .trim()
              .replace(/["']/g, match => {
                return "\\" + match;
              })
              .replace(/[\n]/g, match => {
                return "\\00000A";
              });

            // this.styleSheet.insertRule(`[data-target-text="${selector}"]${psuedo} { content: "${element.textContent}" }`, this.styleSheet.cssRules.length);

            this.styleSheet.insertRule(`[data-target-text="${this.selector}"]${psuedo} { ${target.variable}: "${textContent}" }`);
          }

          // first-letter
          else if (target.style === "first-letter") {
            this.selector = UUID();
            selected.setAttribute("data-target-text", this.selector);

            let psuedo = "";
            if (split.length > 1) {
              psuedo += "::" + split[1];
            }

            let textContent = element.textContent
              .trim()
              .replace(/["']/g, match => {
                return "\\" + match;
              })
              .replace(/[\n]/g, match => {
                return "\\00000A";
              });

            this.styleSheet.insertRule(`[data-target-text="${this.selector}"]${psuedo} { ${target.variable}: "${textContent.charAt(0)}" }`);
          }

          //  before
          else if (target.style === "before") {
            selected.setAttribute("data-target-text", this.selector);

            let psuedo = "";
            if (split.length > 1) {
              psuedo += "::" + split[1];
            }

            let textContent = this.beforeContent.trim().replace(/["']/g, "");

            this.styleSheet.insertRule(`[data-target-text="${this.selector}"]${psuedo} { ${target.variable}: "${textContent}" }`);
          }
          //  after
          else if (target.style === "after") {
            selected.setAttribute("data-target-text", this.selector);
            let psuedo = "";
            if (split.length > 1) {
              psuedo += "::" + split[1];
            }

            let textContent = this.afterContent.trim().replace(/["']/g, "");

            this.styleSheet.insertRule(`[data-target-text="${this.selector}"]${psuedo} { ${target.variable}: "${textContent}" }`);
          } else {
            console.warn("missed target", val);
          }
        }
      });
    });
  }
}

export default TargetText;

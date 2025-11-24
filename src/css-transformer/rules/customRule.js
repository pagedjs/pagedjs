import { CssTransformer } from "../CssTransformer.js";

export function registerCustomRules() {
  // Declaration rule
  CssTransformer.addDeclarationRule(
    ({ property, valueString }) =>
      property === "color" && valueString === "red",
    () => ({ value: "var(--my-red)" }),
  );

  // At-rule rule
  CssTransformer.addAtRuleRule(
    (n) => n.name === "my-rule",
    (n) => {
      n.name = "paged-my-rule";
    },
  );

  // Pseudo-class rule
  CssTransformer.addPseudoRule(
    (sel) => sel.includes(":my-pseudo"),
    (sel) => sel.replace(/:my-pseudo/g, ".my-pseudo-class"),
  );
}

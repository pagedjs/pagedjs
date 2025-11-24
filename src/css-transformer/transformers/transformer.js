import { CssTransformer } from "./CssTransformer.js";
import { propertyRules } from "./rules/propertyRules.js";
import { valueRules } from "./rules/valueRules.js";
import { atRuleRules } from "./rules/atRuleRules.js";
import { pseudoRules } from "./rules/pseudoRules.js";

export function pagedjsRenamer(ast, atpages = []) {
  const transformer = new CssTransformer();

  // register all rules
  propertyRules.forEach((r) =>
    transformer.addDeclarationRule(r.match, r.transform),
  );
  valueRules.forEach((r) =>
    transformer.addDeclarationRule(r.match, r.transform),
  );
  atRuleRules.forEach((r) => transformer.addAtRuleRule(r.match, r.transform));
  pseudoRules.forEach((r) => transformer.addPseudoRule(r.match, r.transform));

  // dynamic @page overrides from user
  atpages.forEach(([from, to]) => {
    transformer.addAtRuleRule(
      (n) => n.name === from,
      (n) => (n.name = to),
    );
  });

  // apply all rules
  return transformer.apply(ast);
}

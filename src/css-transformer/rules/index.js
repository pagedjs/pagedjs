import { CssTransformer } from "../CssTransformer.js";
import atRuleRules from "./atRuleRules.js";
import valueRules from "./valueRules.js";
import propertyRules from "./propertyRules.js";
import running from "./positionRunning.js";

running.forEach((rule) =>
  CssTransformer.addDeclarationRule(rule.match, rule.transform),
);

[...atRuleRules].forEach((rule) =>
  CssTransformer.addAtRuleRule(rule.match, rule.transform),
);

[...valueRules].forEach((rule) =>
  CssTransformer.addDeclarationRule(rule.match, rule.transform),
);

[...propertyRules].forEach((rule) =>
  CssTransformer.addDeclarationRule(rule.match, rule.transform),
);

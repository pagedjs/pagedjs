import { CssTransformer } from "../CssTransformer.js";

import atPageRules from "./atPageRules.js";
import atMediaRules from "./atMediaRules.js";
import propertyRules from "./propertyRules.js";
import valueRules from "./valueRules.js";
import pseudoRules from "./pseudoRules.js";
import {
	footnoteAtRules,
	footnoteDeclarationRules,
	footnotePseudoRules,
} from "./footnoteRules.js";
import positionRunning from "./positionRunning.js";
import urlRules from "./urlRules.js";

positionRunning.forEach((rule) =>
	CssTransformer.addDeclarationRule(rule.match, rule.transform),
);

[...atPageRules].forEach((rule) =>
	CssTransformer.addAtRuleRule(rule.match, rule.transform),
);

[...atMediaRules].forEach((rule) =>
	CssTransformer.addAtRuleRule(rule.match, rule.transform),
);

[...valueRules].forEach((rule) =>
	CssTransformer.addDeclarationRule(rule.match, rule.transform),
);

[...propertyRules].forEach((rule) =>
	CssTransformer.addDeclarationRule(rule.match, rule.transform),
);

[...footnoteDeclarationRules].forEach((rule) =>
	CssTransformer.addDeclarationRule(rule.match, rule.transform),
);

[...footnoteAtRules].forEach((rule) =>
	CssTransformer.addAtRuleRule(rule.match, rule.transform),
);

[...footnotePseudoRules].forEach((rule) =>
	CssTransformer.addPseudoRule(rule.match, rule.transform),
);

[...pseudoRules].forEach((rule) =>
	CssTransformer.addPseudoRule(rule.match, rule.transform),
);

[...urlRules].forEach((rule) =>
	CssTransformer.addUrlRule(rule.match, rule.transform),
);

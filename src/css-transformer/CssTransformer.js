import { transformDeclarations } from "./transformers/transformDeclarations.js";
import { transformAtRules } from "./transformers/transformAtRules.js";
import { transformPseudos } from "./transformers/transformPseudos.js";

class CssTransformerClass {
  constructor() {
    this.declarationRules = [];
    this.atRuleRules = [];
    this.pseudoRules = [];
  }

  addDeclarationRule(match, transform) {
    this.declarationRules.push({ match, transform });
  }

  addAtRuleRule(match, transform) {
    this.atRuleRules.push({ match, transform });
  }

  addPseudoRule(match, transform) {
    this.pseudoRules.push({ match, transform });
  }

  apply(ast) {
    transformDeclarations(ast, this.declarationRules);
    transformAtRules(ast, this.atRuleRules);
    transformPseudos(ast, this.pseudoRules);
    return ast;
  }
}

// Export a singleton instance
export const CssTransformer = new CssTransformerClass();

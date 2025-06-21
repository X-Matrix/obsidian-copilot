import { ReadabilityRule } from "./BaseReadabilityRule";

export interface RuleConfig {
  name: string;
  contentSelectors: string[];
  unwantedSelectors: string[];
  mathConfig: {
    preserveLatex: boolean;
    mathJaxSelectors: string[];
    scriptSelectors: string[];
  };
}

export class RuleExtractor {
  static ruleToConfig(rule: ReadabilityRule): RuleConfig {
    return {
      name: rule.name,
      contentSelectors: rule.contentSelectors,
      unwantedSelectors: rule.unwantedSelectors,
      mathConfig: rule.mathConfig,
    };
  }
}

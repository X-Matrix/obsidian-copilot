import { ReadabilityRule, BaseReadabilityRule } from "./BaseReadabilityRule";
import { GithubRule } from "./rules/GithubRule";
import { AcademicRule } from "./rules/AcademicRule";
import { NewsRule } from "./rules/NewsRule";
import { SpaceACRule } from "./rules/SpaceACRule";
import { RuleConfig, RuleExtractor } from "./RuleExtractor";
import { ArxivRule } from "./rules/ArxivRule"; // 引入ArxivRule以确保其被加载

export class ReadabilityRuleManager {
  private static instance: ReadabilityRuleManager;
  private rules: ReadabilityRule[] = [];
  private defaultRule: ReadabilityRule;

  private constructor() {
    this.defaultRule = new BaseReadabilityRule();
    this.loadBuiltinRules();
  }

  static getInstance(): ReadabilityRuleManager {
    if (!ReadabilityRuleManager.instance) {
      ReadabilityRuleManager.instance = new ReadabilityRuleManager();
    }
    return ReadabilityRuleManager.instance;
  }

  private loadBuiltinRules(): void {
    this.rules = [
      new SpaceACRule(), // 优先级最高，放在最前面
      new GithubRule(),
      new AcademicRule(),
      new NewsRule(),
      new ArxivRule(), // 确保ArxivRule被加载
      // 可以在这里添加更多内置规则
    ];
  }

  // 根据URL选择最合适的规则
  selectRule(url: string): ReadabilityRule {
    console.warn(`Selecting rule for URL: ${url}`);
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      console.warn(`Parsed hostname: ${hostname}`);

      for (const rule of this.rules) {
        console.warn(`Checking rule: ${rule.name}, patterns: ${rule.domainPatterns}`);
        if (rule.domainPatterns && rule.domainPatterns.length > 0) {
          for (const pattern of rule.domainPatterns) {
            console.warn(`Comparing ${hostname} with pattern: ${pattern}`);
            if (this.matchesDomainPattern(hostname, pattern)) {
              console.warn(`Selected rule: ${rule.name} for domain: ${hostname} (URL: ${url})`);
              return rule;
            }
          }
        }
      }
    } catch (error) {
      console.warn("Failed to parse URL for rule selection:", error);
    }

    console.warn(`No specific rule found, using default rule for: ${url}`);
    return this.defaultRule;
  }

  private matchesDomainPattern(hostname: string, pattern: string): boolean {
    // 支持通配符匹配
    if (pattern.startsWith("*.")) {
      const baseDomain = pattern.substring(2);
      return hostname === baseDomain || hostname.endsWith("." + baseDomain);
    }

    return hostname === pattern || hostname.endsWith("." + pattern);
  }

  // 注册自定义规则
  registerRule(rule: ReadabilityRule): void {
    this.rules.push(rule);
  }

  // 获取所有规则
  getAllRules(): ReadabilityRule[] {
    return [...this.rules, this.defaultRule];
  }

  getRuleConfig(url: string): RuleConfig {
    const rule = this.selectRule(url);
    return RuleExtractor.ruleToConfig(rule);
  }

  // 提供HTML转Markdown的功能
  convertHtmlToMarkdown(html: string, url: string): string {
    const rule = this.selectRule(url);
    return rule?.convertHtmlToMarkdown ? rule.convertHtmlToMarkdown(html, url) : "";
  }
}

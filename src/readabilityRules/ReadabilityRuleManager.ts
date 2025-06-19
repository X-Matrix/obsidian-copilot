import { ReadabilityRule, BaseReadabilityRule } from "./BaseReadabilityRule";
import { GithubRule } from "./rules/GithubRule";
import { AcademicRule } from "./rules/AcademicRule";
import { NewsRule } from "./rules/NewsRule";
import { SpaceACRule } from "./rules/SpaceACRule";
import { RuleExtractor, RuleConfig } from "./RuleExtractor";

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

  // 应用规则进行内容提取
  extractContent(
    document: Document,
    url: string
  ): { title: string; content: string; success: boolean } {
    const rule = this.selectRule(url);
    console.warn(`Using rule: ${rule.name} for content extraction`);
    console.warn("Rule details:", {
      name: rule.name,
      type: rule.constructor.name,
      isAcademic: rule instanceof AcademicRule,
    });

    try {
      // 寻找主要内容区域
      for (const selector of rule.contentSelectors) {
        console.warn(`Trying selector: ${selector}`);
        const element = document.querySelector(selector) as HTMLElement;
        console.warn(`Element found for selector ${selector}:`, element);
        if (element) {
          console.warn(
            `Found element with selector: ${selector}, attempting content processing...`
          );
          try {
            console.warn(`Rule processing content, rule type: ${rule.constructor.name}`);
            const content = rule.processContent(element, document);
            console.warn(`Content processed, length: ${content?.trim()?.length || 0}`);
            if (content && content.trim().length > 100) {
              console.warn(`Successfully extracted content with length: ${content.trim().length}`);
              return {
                title: document.title || "Unknown Title",
                content: content,
                success: true,
              };
            }
          } catch (processingError) {
            console.error(`Content processing failed for selector ${selector}:`, processingError);
            continue; // 尝试下一个选择器
          }
        }
      }

      console.warn("No main content found, falling back to body processing");
      // 如果没找到主要内容，使用body作为备选
      const bodyClone = document.body.cloneNode(true) as HTMLElement;

      // 移除不需要的元素
      rule.unwantedSelectors.forEach((selector) => {
        const elements = bodyClone.querySelectorAll(selector);
        elements.forEach((el) => el.remove());
      });

      // 处理数学公式
      if (rule.mathConfig.preserveLatex) {
        this.processMathInBody(bodyClone, document, rule);
      }

      const bodyContent = bodyClone.textContent || bodyClone.innerText || "";

      return {
        title: document.title || "Unknown Title",
        content: bodyContent,
        success: bodyContent.trim().length > 50,
      };
    } catch (error) {
      console.error("Content extraction failed:", error);
      return {
        title: document.title || "Unknown Title",
        content: "",
        success: false,
      };
    }
  }

  private processMathInBody(element: HTMLElement, document: Document, rule: ReadabilityRule): void {
    // 处理script标签中的LaTeX
    const scriptElements = element.querySelectorAll(rule.mathConfig.scriptSelectors.join(", "));
    scriptElements.forEach((scriptEl) => {
      if (scriptEl.textContent) {
        const latexCode = scriptEl.textContent.trim();
        const isDisplayMode = scriptEl.getAttribute("type")?.includes("mode=display");
        const replacement = document.createElement("span");
        replacement.textContent = isDisplayMode ? `$$${latexCode}$$` : `$${latexCode}$`;
        replacement.className = "extracted-latex";
        scriptEl.parentNode?.replaceChild(replacement, scriptEl);
      }
    });

    // 处理MathJax元素
    const mathElements = element.querySelectorAll(rule.mathConfig.mathJaxSelectors.join(", "));
    mathElements.forEach((mathEl) => {
      const htmlMathEl = mathEl as HTMLElement;

      if (htmlMathEl.querySelector(".extracted-latex")) {
        return;
      }

      const mathText = htmlMathEl.textContent || htmlMathEl.innerText || "";
      if (mathText.trim()) {
        const replacement = document.createElement("span");
        const isDisplayMode =
          mathText.includes("\\begin{") ||
          mathText.includes("\\end{") ||
          mathText.length > 20 ||
          htmlMathEl.classList.contains("MathJax_Display");
        replacement.textContent = isDisplayMode ? `$$${mathText}$$` : `$${mathText}$`;
        mathEl.parentNode?.replaceChild(replacement, mathEl);
      }
    });
  }

  /**
   * 获取用于浏览器环境的提取器代码和规则配置
   * @param url 网页URL，用于选择适合的提取器代码
   */
  getBrowserExtractorCode(url?: string): string {
    if (url) {
      const rule = this.selectRule(url);

      // 如果是SpaceACRule，且实现了特定的提取器生成方法
      if (
        rule instanceof SpaceACRule &&
        typeof (rule as any).generateSpecificBrowserExtractor === "function"
      ) {
        console.warn(`Using specific extractor code for rule: ${rule.name}`);
        return (rule as any).generateSpecificBrowserExtractor();
      }
    }

    // 默认使用通用提取器代码
    return RuleExtractor.generateBrowserExtractor();
  }

  /**
   * 将规则转换为浏览器可用的配置
   */
  getRuleConfig(url: string): RuleConfig {
    const rule = this.selectRule(url);
    return RuleExtractor.ruleToConfig(rule);
  }

  /**
   * 获取简化的回退策略配置
   */
  getFallbackConfig(): RuleConfig {
    return {
      name: "Fallback",
      contentSelectors: [
        "#PostContent",
        ".PostContent",
        ".Post",
        "article",
        "main",
        '[role="main"]',
        ".content",
        ".main-content",
        ".post-content",
        ".article-content",
        ".entry-content",
        ".markdown-body",
        "#readme",
        ".blob-wrapper",
      ],
      unwantedSelectors: [
        "script",
        "style",
        "nav",
        "header",
        "footer",
        ".navigation",
        ".sidebar",
        ".menu",
        ".ads",
        ".advertisement",
        ".social",
        ".share",
        ".comments",
        ".related",
        ".recommended",
        ".popup",
        ".modal",
        ".file-navigation",
        ".pagehead",
        ".footer",
        ".breadcrumb",
        ".tabnav",
        ".subnav",
        ".js-navigation-container",
        ".pagination",
      ],
      mathConfig: {
        preserveLatex: true,
        mathJaxSelectors: [
          ".MathJax",
          ".MathJax_Display",
          ".MathJax_Preview",
          ".notranslate",
          '[id^="MathJax-Element"]',
          '[class*="MathJax"]',
        ],
        scriptSelectors: ['script[type="math/tex"]', 'script[type="math/tex; mode=display"]'],
      },
    };
  }
}

import { logInfo } from "@/logger";
interface WebsiteRule {
  name: string;
  urlPattern: RegExp;
  contentSelectors: string[];
  unwantedSelectors: string[];
  // LaTeX相关配置
  latexConfig?: {
    inlineDelimiters?: string[][]; // 例如 [['$', '$'], ['\\(', '\\)']]
    blockDelimiters?: string[][]; // 例如 [['$$', '$$'], ['\\[', '\\]']]
    ignoreClasses?: string[]; // 包含LaTeX的容器类名
  };
}

export class WebContentRuleManager {
  private rules: WebsiteRule[] = [];
  private fallbackRule: WebsiteRule;

  constructor() {
    // 初始化默认规则
    this.fallbackRule = {
      name: "Default",
      urlPattern: /.*/,
      contentSelectors: [
        "article",
        "main",
        ".content",
        ".post",
        ".article",
        "#content",
        ".main-content",
      ],
      unwantedSelectors: [
        "nav",
        "header",
        "footer",
        ".nav",
        ".header",
        ".footer",
        ".sidebar",
        ".menu",
        ".ads",
        ".advertisement",
        "script",
        "style",
      ],
      latexConfig: {
        inlineDelimiters: [
          ["$", "$"],
          ["\\(", "\\)"],
        ],
        blockDelimiters: [
          ["$$", "$$"],
          ["\\[", "\\]"],
        ],
        ignoreClasses: ["MathJax", "MathJax_Display", "math", "LaTeX"],
      },
    };

    // 初始化特定网站规则
    this.initRules();
  }

  private initRules() {
    this.rules = [
      // 学术网站
      {
        name: "arXiv",
        urlPattern: /arxiv\.org/,
        contentSelectors: [".abstract", ".authors", ".dateline", ".title", "#abs"],
        unwantedSelectors: ["script", "style", ".endorsers", ".submission-history"],
        latexConfig: {
          inlineDelimiters: [
            ["$", "$"],
            ["\\(", "\\)"],
          ],
          blockDelimiters: [
            ["$$", "$$"],
            ["\\[", "\\]"],
          ],
          ignoreClasses: ["MathJax", "MathJax_Display"],
        },
      },
      // 维基百科
      {
        name: "Wikipedia",
        urlPattern: /wikipedia\.org/,
        contentSelectors: ["#mw-content-text", ".mw-parser-output"],
        unwantedSelectors: [
          ".mw-editsection",
          ".reference",
          ".noprint",
          ".mw-empty-elt",
          ".mw-headline-anchor",
        ],
        latexConfig: {
          inlineDelimiters: [
            ["$", "$"],
            ["\\(", "\\)"],
          ],
          blockDelimiters: [
            ["$$", "$$"],
            ["\\[", "\\]"],
          ],
          ignoreClasses: ["mwe-math-element", "MathJax"],
        },
      },
      // GitHub
      {
        name: "GitHub",
        urlPattern: /github\.com/,
        contentSelectors: [
          ".markdown-body",
          ".repository-content",
          ".repository-meta-content",
          ".readme",
        ],
        unwantedSelectors: [
          ".file-navigation",
          ".repository-topics-container",
          ".overall-summary",
          ".pagehead",
        ],
        latexConfig: {
          inlineDelimiters: [["$", "$"]],
          blockDelimiters: [["$$", "$$"]],
          ignoreClasses: ["tex-math"],
        },
      },
      // StackExchange网站（包括StackOverflow）
      {
        name: "StackExchange",
        urlPattern: /stackexchange\.com|stackoverflow\.com/,
        contentSelectors: [".question", ".answer", "#question", "#answers"],
        unwantedSelectors: [".comment-text", ".user-info", ".vote-buttons", ".js-voting-container"],
        latexConfig: {
          inlineDelimiters: [["$", "$"]],
          blockDelimiters: [["$$", "$$"]],
          ignoreClasses: ["mathjax-block", "mathjax-inline"],
        },
      },
    ];

    logInfo(`Initialized ${this.rules.length} website content extraction rules`);
  }

  getRuleConfig(url: string): WebsiteRule {
    const matchedRule = this.rules.find((rule) => rule.urlPattern.test(url));
    if (matchedRule) {
      logInfo(`Found matching rule "${matchedRule.name}" for URL: ${url}`);
      return matchedRule;
    }

    logInfo(`No specific rule found for URL: ${url}, using fallback rule`);
    return this.fallbackRule;
  }

  getFallbackConfig(): WebsiteRule {
    return this.fallbackRule;
  }

  // 检测HTML中是否包含LaTeX公式
  detectLatexContent(html: string): boolean {
    // 检查常见的LaTeX公式模式
    const inlineLatexPattern = /\$[^\$\n]+?\$/g;
    const displayLatexPattern = /\$\$[\s\S]+?\$\$/g;
    const latexEnvironmentPattern =
      /\\begin\{(equation|align|gather|eqnarray)[*]?\}[\s\S]+?\\end\{\1[*]?\}/g;

    return (
      inlineLatexPattern.test(html) ||
      displayLatexPattern.test(html) ||
      latexEnvironmentPattern.test(html)
    );
  }
}

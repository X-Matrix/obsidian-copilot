import TurndownService from "turndown";
import { removeLatexEscape, removeSpeciLatex } from "./utils/latexUtils";

export interface ReadabilityRule {
  // 规则名称
  name: string;

  // 适用的域名模式（如果为空则为公共规则）
  domainPatterns?: string[];

  // 内容选择器优先级列表
  contentSelectors: string[];

  // 需要移除的元素选择器
  unwantedSelectors: string[];

  // 数学公式处理配置
  mathConfig: {
    preserveLatex: boolean;
    mathJaxSelectors: string[];
    scriptSelectors: string[];
  };

  // html转markdown
  convertHtmlToMarkdown?: (html: string, url: string) => string;
}

export class BaseReadabilityRule implements ReadabilityRule {
  name = "BaseRule";
  domainPatterns: string[] = [];

  contentSelectors = [
    "#PostContent", // 学术网站主要内容
    ".PostContent",
    ".Post",
    "article",
    "main",
    '[role="main"]',
    ".post-content",
    ".article-content",
    ".entry-content",
    ".content",
    "#content",
    ".markdown-body",
    ".wiki-content",
    "#readme",
    ".blob-wrapper",
  ];

  unwantedSelectors: string[] = [
    // 使用更精确的脚本选择器，保留数学公式脚本
    'script[type="application/javascript"]',
    'script[type="text/javascript"]',
    "script[src]", // 外部脚本
    "script:not([type])", // 没有 type 的脚本
    'script[type=""]', // type 为空的脚本

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
    "#SideBar",
    "#sidebar",
    "#comments",
    ".comment",
    ".AllComments",
    ".ComListLi",
    "#respond",
    ".respond",
    ".tools",
    "#tools",
    ".entrynavigation",
    "#entrynavigation",
    "#similar",
    ".similar",
    "#pay",
    ".pay",
    "#share",
    ".share",
    ".cite_comment",
    ".title_button",
    "form",
    "#content_tips",
    "#PostComment",
    ".PostHead .submitted",
  ];

  mathConfig: {
    preserveLatex: boolean;
    mathJaxSelectors: string[];
    scriptSelectors: string[];
  } = {
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
  };

  // html转markdown
  turndownService: TurndownService;
  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: "atx",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
      emDelimiter: "*",
      strongDelimiter: "**",
    });
  }

  convertHtmlToMarkdown(html: string, url: string | null): string {
    // 定制解析Latex的规则
    // <script type="math/tex" id="MathJax-Element-1">\mathop{\text{msign}}</script>
    // 获取\mathop{\text{msign}}
    this.turndownService.addRule("latex", {
      filter: (node: Node): boolean => {
        return node.nodeName === "SCRIPT" && (node as HTMLScriptElement).type === "math/tex";
      },
      replacement: (content: string): string => {
        // 保留LaTeX代码，修正单个$符号的问题
        content = removeLatexEscape(content);
        // 如果内容以$开头和结尾，直接返回
        if (content.startsWith("$") && content.endsWith("$")) {
          return content.trim();
        }
        // 否则添加$符号
        content = content.replace(/^\$/, "").replace(/\$$/, ""); // 移除开头和结尾的$
        return `$${content.trim()}$`;
      },
    });

    this.turndownService.addRule("latex-display", {
      filter: (node: Node): boolean => {
        return (
          node.nodeName === "SCRIPT" &&
          (node as HTMLScriptElement).type === "math/tex; mode=display"
        );
      },
      replacement: (content: string): string => {
        // 保留LaTeX代码，修正单个$符号的问题
        content = removeLatexEscape(content);
        // 如果内容以$开头和结尾，直接返回
        if (content.startsWith("$") && content.endsWith("$")) {
          return content.trim();
        }
        // 否则添加$符号
        content = content.replace(/^\$/, "").replace(/\$$/, ""); // 移除开头和结尾的$
        return `$$\n${content.trim()}\n$$`;
      },
    });

    return this.turndownService.turndown(html);
  }
}

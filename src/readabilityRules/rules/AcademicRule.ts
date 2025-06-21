import { BaseReadabilityRule } from "../BaseReadabilityRule";

export class AcademicRule extends BaseReadabilityRule {
  name = "AcademicRule";
  domainPatterns: string[] = [
    "*.edu",
    "researchgate.net",
    "scholar.google.com",
    "pubmed.ncbi.nlm.nih.gov",
  ];

  contentSelectors = [
    "#PostContent",
    ".PostContent",
    ".Post",
    "article",
    ".abstract",
    ".full-text",
    ".paper-content",
    "main",
    '[role="main"]',
    ".content",
  ];

  unwantedSelectors: string[] = [
    ...this.unwantedSelectors,
    // 移除 spaces.ac.cn 特有的元素，因为现在专注于 #MainBody
    "#how_to_cite",
    ".comment_reply",
    ".AllComments",
    ".ComListLi",
    "#PostComment",
    ".PostHead .submitted",
    ".cite_comment",
    ".title_button",
    "#content_tips",
    "#pay",
    "#QR",
    "#share",
    "#share_position",
    "#breadcrumb",
    ".date-wrap",
    "#similar",
    "#tools",
    "#entrynavigation",
    // 通用学术网站移除元素
    ".author-bio",
    ".reference-list",
    ".citation-info",
    ".doi-info",
    ".journal-meta",
    ".article-metrics",
    ".related-content",
  ];

  mathConfig: {
    preserveLatex: boolean;
    mathJaxSelectors: string[];
    scriptSelectors: string[];
  } = {
    ...this.mathConfig,
    preserveLatex: true,
    mathJaxSelectors: [
      ...this.mathConfig.mathJaxSelectors,
      ".MathJax_CHTML",
      ".MathJax_SVG",
      ".MathJax",
      ".MathJax_Display",
      ".MathJax_Preview",
      'math[xmlns="http://www.w3.org/1998/Math/MathML"]', // 移除 MathML 渲染内容
    ],
    scriptSelectors: [
      ...this.mathConfig.scriptSelectors,
      'script[type="math/tex"]',
      'script[id^="MathJax-Element-"]',
    ],
  };

  convertHtmlToMarkdown(html: string, url: string | null): string {
    // 使用父类的转换方法
    return super.convertHtmlToMarkdown(html, url);
  }
}

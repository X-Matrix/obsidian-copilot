import { BaseReadabilityRule } from "../BaseReadabilityRule";

export class NewsRule extends BaseReadabilityRule {
  name = "NewsRule";
  domainPatterns: string[] = [
    "*.news.com",
    "cnn.com",
    "bbc.com",
    "reuters.com",
    "ap.org",
    "bloomberg.com",
    "wsj.com",
    "nytimes.com",
  ];

  contentSelectors = [
    "article",
    ".article-content",
    ".article-body",
    ".story-content",
    ".post-content",
    ".entry-content",
    ".news-content",
    "#article-body",
    ".ArticleBody-articleBody",
    "main",
    '[role="main"]',
  ];

  unwantedSelectors: string[] = [
    ...this.unwantedSelectors,
    ".advertisement",
    ".ad-container",
    ".sidebar",
    ".related-articles",
    ".newsletter-signup",
    ".social-share",
    ".author-bio",
    ".comments-section",
    ".trending",
    ".popular",
    ".recommended",
    ".subscription-banner",
    ".paywall",
    ".breaking-news-bar",
  ];

  mathConfig: {
    preserveLatex: boolean;
    mathJaxSelectors: string[];
    scriptSelectors: string[];
  } = {
    ...this.mathConfig,
    preserveLatex: false, // 新闻网站通常不需要数学公式
    mathJaxSelectors: [],
    scriptSelectors: [],
  };
}

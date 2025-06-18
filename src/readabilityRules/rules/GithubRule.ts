import { BaseReadabilityRule } from "../BaseReadabilityRule";

export class GithubRule extends BaseReadabilityRule {
  name = "GithubRule";
  domainPatterns: string[] = ["github.com", "*.github.com"];

  contentSelectors = [
    "#readme",
    ".markdown-body",
    ".blob-wrapper",
    ".file-content",
    ".Box-body",
    "article",
    "main",
  ];

  unwantedSelectors: string[] = [
    ...this.unwantedSelectors,
    ".file-navigation",
    ".pagehead",
    ".breadcrumb",
    ".tabnav",
    ".subnav",
    ".js-navigation-container",
    ".pagination",
    ".table-list-header-toggle",
    ".file-info",
  ];
}

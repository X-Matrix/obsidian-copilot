import { format } from "path";
import { BaseReadabilityRule } from "../BaseReadabilityRule";
import TurndownService from "turndown";
import { processMathBlock } from "../utils/latexUtils";

export class ArxivRule extends BaseReadabilityRule {
  name = "ArxivRule";
  domainPatterns: string[] = ["arxiv.org"];

  contentSelectors = [
    // <div class="ltx_page_content">
    ".ltx_page_content",
  ];

  unwantedSelectors: string[] = [
    // <math> xxxx <semantics>yyy </semantics> </math> 中的 semantics 去掉，保留 <math> xxxx </math>
    "math semantics",
    // <button class="sr-only button" style="display: none;">Report issue for preceding element</button>
    "button.sr-only.button",
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
  convertHtmlToMarkdown(html: string, url: string): string {
    console.info("Converting HTML to Markdown using ArxivRule");
    // 先用 DOM 处理 <math> 标签
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("math").forEach((node) => {
      let altText = node.getAttribute("alttext")?.trim() || "";
      const display = node.getAttribute("display") || "inline";
      let md = "";
      if (altText) {
        // 换行符替换成 <br>，以便在 Markdown 中保留换行
        altText = altText.replace(/\n/g, "<br>");
        if (display === "block") {
          // 保留换行，使用 <br> 让 turndown 还原为换行
          md = `$$<br>${altText}<br>$$`;
        } else {
          md = `$${altText}$`;
        }
      } else {
        md = "";
      }
      const span = doc.createElement("span");
      span.innerHTML = md;
      node.parentNode?.replaceChild(span, node);
    });
    const processedHtml = doc.body.innerHTML;

    const turndownService = new TurndownService({
      headingStyle: "atx",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
      emDelimiter: "*",
      strongDelimiter: "**",
    });

    turndownService.addRule("figure", {
      filter: (node: Node): boolean => {
        return node.nodeName === "FIGURE" && (node as HTMLElement).classList.contains("ltx_figure");
      },
      replacement: (content: string, node: Node): string => {
        const caption = (node as HTMLElement).innerHTML.match(
          /<figcaption[^>]*>(.*?)<\/figcaption>/
        );
        const imgMatch = (node as HTMLElement).innerHTML.match(/<img[^>]+src="([^"]+)"/);
        let fullImgSrc = "";
        let captionText = "";
        if (imgMatch) {
          const imgSrc = imgMatch[1];
          if (imgSrc.startsWith("http")) {
            fullImgSrc = imgSrc;
          } else {
            if (url.endsWith("/")) {
              fullImgSrc = url + imgSrc; // 完整的图片链接
            } else {
              fullImgSrc = url + "/" + imgSrc; // 完整的图片链接
            }
          }
        }
        if (caption) {
          captionText = caption[1].replace(/<[^>]+>/g, "").trim();
          content = `![${captionText}](${fullImgSrc})\n\n`;
        }
        return content;
      },
    });

    // table
    turndownService.addRule("table", {
      filter: (node: Node): boolean => {
        //<table class="ltx_tabular ltx_centering ltx_guessed_headers ltx_align_middle" id="S6.T2.14.14"> 仅处理class 为 ltx_tabular
        return node.nodeName === "TABLE" && (node as HTMLElement).classList.contains("ltx_tabular");
      },
      replacement: (content: string, node: Node): string => {
        const rows = Array.from((node as HTMLElement).querySelectorAll("tr"));
        if (rows.length === 0) return "";
        // 解析每一行的单元格内容
        const tableRows = rows.map((row) => {
          const cells = Array.from(row.querySelectorAll("th, td"));
          return cells.map((cell) => {
            const cellContent = cell.textContent?.trim() || "";
            return cellContent.replace(/\n/g, " ").replace(/\s+/g, " ");
          });
        });
        // 生成表头和分隔线
        const colCount = tableRows[0].length;
        const header = `| ${tableRows[0].join(" | ")} |`;
        const alignLine = `|${Array(colCount).fill("---").join("|")}|`;
        // 生成表体
        const body = tableRows
          .slice(1)
          .map((row) => `| ${row.join(" | ")} |`)
          .join("\n");
        return `\n\n${header}\n${alignLine}${body ? `\n${body}` : ""}\n\n`;
      },
    });

    let md = turndownService.turndown(processedHtml);
    // 只对公式区域内的多余反斜杠进行还原
    md = processMathBlock(md);
    return md;
  }
}

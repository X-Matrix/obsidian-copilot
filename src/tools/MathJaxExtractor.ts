import { Page } from "playwright";
import { logInfo } from "@/logger";

export interface ExtractedMath {
  type: "inline" | "display";
  original: string;
  latex: string;
}

export class MathJaxExtractor {
  /**
   * 在页面中注入脚本以提取MathJax公式
   */
  public async extractMathJaxFromPage(page: Page): Promise<ExtractedMath[]> {
    try {
      // 注入脚本以收集页面上的所有MathJax内容
      const formulas = await page.evaluate(() => {
        const result: {
          type: "inline" | "display";
          original: string;
          latex: string;
        }[] = [];

        // 提取script标签中的原始LaTeX
        const mathScripts = document.querySelectorAll('script[type^="math/tex"]');

        mathScripts.forEach((script) => {
          const isDisplay = script.getAttribute("type")?.includes("mode=display") || false;
          const latex = script.textContent || "";

          if (latex.trim()) {
            // 清理LaTeX内容，修复常见问题
            let cleanedLatex = latex
              .trim()
              // 修复双反斜杠问题
              .replace(/\\\\(\[|\]|,|\{|\})/g, "\\$1")
              // 修复常见的LaTeX命令转义问题
              .replace(/\\\\(subset|supset|in|mathbb|mathcal|sum|prod|int)/g, "\\$1")
              // 修复上下标问题
              .replace(/\\\\([_^])/g, "\\$1");

            // 修复混合显示问题（如"DnmD_{n}^{m}"）
            cleanedLatex = cleanedLatex.replace(
              /([A-Za-z]+)([A-Za-z][_^]\{[^}]+\})/g,
              (match, prefix, latex) => {
                // 如果前缀包含LaTeX的第一个字符，可能是混合显示
                if (prefix.includes(latex.charAt(0))) {
                  return latex;
                }
                return match;
              }
            );

            result.push({
              type: isDisplay ? "display" : "inline",
              original: script.outerHTML,
              latex: cleanedLatex,
            });
          }
        });

        // 尝试从MathJax对象中提取（如果可用）
        if (window.MathJax && typeof window.MathJax === "object") {
          try {
            const elements = document.querySelectorAll(".MathJax");
            elements.forEach((el) => {
              // 尝试获取关联的原始脚本元素
              const scriptId = el.getAttribute("id")?.replace("-Frame", "") || "";
              if (scriptId) {
                const scriptEl = document.getElementById(scriptId);
                if (scriptEl && scriptEl.tagName === "SCRIPT" && scriptEl.textContent) {
                  const isDisplay =
                    scriptEl.getAttribute("type")?.includes("mode=display") || false;
                  result.push({
                    type: isDisplay ? "display" : "inline",
                    original: el.outerHTML,
                    latex: scriptEl.textContent.trim(),
                  });
                }
              }
            });
          } catch (e) {
            console.error("Failed to extract from MathJax object:", e);
          }
        }

        return result;
      });

      logInfo(`Extracted ${formulas.length} MathJax formulas from page`);
      return formulas;
    } catch (error) {
      logInfo("Failed to extract MathJax content:", error.message);
      return [];
    }
  }

  /**
   * 在HTML内容中替换MathJax渲染的元素为原始LaTeX
   */
  public replaceMathJaxInHtml(html: string, formulas: ExtractedMath[]): string {
    let processedHtml = html;

    // 替换每个找到的公式
    formulas.forEach((formula) => {
      // 跳过空公式
      if (!formula.latex || !formula.original) return;

      try {
        const escapedOriginal = formula.original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escapedOriginal, "g");

        // 确保公式被正确地包围在$符号内，并清理公式内容
        const cleanLatex = formula.latex
          // 修复混合显示的问题
          .replace(/([A-Za-z]+)([A-Za-z][_^]\{[^}]+\})/g, (match, prefix, latex) => {
            if (prefix.includes(latex.charAt(0))) return latex;
            return match;
          })
          // 修复反斜杠问题
          .replace(/\\\\([_^])/g, "\\$1");

        if (formula.type === "display") {
          processedHtml = processedHtml.replace(regex, `\n\n$$${cleanLatex}$$\n\n`);
        } else {
          processedHtml = processedHtml.replace(regex, `$${cleanLatex}$`);
        }
      } catch (e) {
        logInfo("Failed to replace formula:", e.message);
      }
    });

    return processedHtml;
  }

  /**
   * 修复常见的混合LaTeX显示问题
   */
  public fixMixedLatexDisplays(content: string): string {
    return content.replace(/([A-Za-z]+)([A-ZaZ][_^]\{[^}]+\})/g, (match, prefix, latex) => {
      // 检测前缀是否包含LaTeX开头字符，如果是则可能是混合显示
      if (prefix.includes(latex.charAt(0))) {
        return `$${latex}$`; // 只保留实际的LaTeX部分并添加$
      }
      return match;
    });
  }
}

// 声明全局MathJax接口
declare global {
  interface Window {
    MathJax?: any;
  }
}

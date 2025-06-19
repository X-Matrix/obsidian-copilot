import { logInfo } from "../logger";

export class LatexCleaner {
  /**
   * 清理和标准化LaTeX公式
   */
  public cleanLatex(latex: string): string {
    try {
      return this.fixCommonLatexIssues(latex);
    } catch (error) {
      logInfo("Error cleaning LaTeX:", error.message);
      return latex;
    }
  }

  /**
   * 修复常见的LaTeX格式问题
   */
  private fixCommonLatexIssues(latex: string): string {
    if (!latex) return "";

    // 去除元素前的显示内容（例如 DnmD_{n}^{m} 只保留 D_{n}^{m}）
    let processed = latex.replace(/([A-Za-z]+)\\?_\{([^}]+)\}/, (match, prefix, content) => {
      // 检查是否为重复的前缀和下标公式
      if (
        match.includes(prefix + "\\_{" + content + "}") ||
        match.includes(prefix + "_{" + content + "}")
      ) {
        return prefix + "_{" + content + "}";
      }
      return match;
    });

    // 修复上标的类似问题
    processed = processed.replace(/([A-Za-z]+)\\?\^\{([^}]+)\}/, (match, prefix, content) => {
      if (
        match.includes(prefix + "\\^{" + content + "}") ||
        match.includes(prefix + "^{" + content + "}")
      ) {
        return prefix + "^{" + content + "}";
      }
      return match;
    });

    return (
      processed
        // 修复双反斜杠问题
        .replace(/\\\\(?=[[\],{}])/g, "\\")
        .replace(/\\\\([_^])/g, "\\$1")

        // 修复常见的LaTeX命令转义问题
        .replace(/\\\\(subset|supset|in|mathbb|mathcal|sum|prod|int)/g, "\\$1")
        .replace(/\\\\(left|right|frac|text|cite|ref)/g, "\\$1")
        .replace(/\\\\([A-Za-z]+)/g, "\\$1") // 确保所有命令只有一个反斜杠

        // 修复可能的空格问题
        .replace(/\s+(?=[.,])/g, "")

        // 标准化环境格式
        .replace(/\\begin\s*\{/g, "\\begin{")
        .replace(/\\end\s*\{/g, "\\end{")

        // 移除多余的空白
        .trim()
    );
  }

  /**
   * 在Markdown中确保LaTeX公式被正确包围
   */
  public ensureLatexDelimiters(markdown: string): string {
    // 检测和修复未被$包围的LaTeX表达式
    let processed = markdown;

    // 环境定义应在$$包围内
    processed = processed.replace(
      /([^$]|^)(\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\})([^$]|$)/g,
      (match, before, latex, after) => {
        if (!before.endsWith("$") && !after.startsWith("$")) {
          return `${before}$$${latex}$$${after}`;
        }
        return match;
      }
    );

    // 常见的上下标LaTeX表达式
    const subscriptSuperscriptRegex = /([^$]|^)([A-Za-z][_^]\{[^}]+\})([^$]|$)/g;
    processed = processed.replace(subscriptSuperscriptRegex, (match, before, math, after) => {
      if (!before.endsWith("$") && !after.startsWith("$")) {
        return `${before}$${math}$${after}`;
      }
      return match;
    });

    // 匹配常见数学命令
    const mathCommands = [
      "mathbb",
      "mathcal",
      "mathfrak",
      "mathrm",
      "mathsf",
      "mathtt",
      "frac",
      "sqrt",
      "sum",
      "prod",
      "lim",
      "int",
      "oint",
      "partial",
      "nabla",
      "infty",
      "approx",
      "sim",
      "cong",
      "equiv",
      "subset",
      "supset",
      "subseteq",
      "supseteq",
      "in",
      "notin",
    ];

    const commandPattern = new RegExp(
      `([^$]|^)(\\\\(${mathCommands.join("|")})(\\{[^}]*\\})+)([^$]|$)`,
      "g"
    );

    processed = processed.replace(
      commandPattern,
      (match, before, math, command, lastArg, after) => {
        if (!before.endsWith("$") && !after.startsWith("$")) {
          return `${before}$${math}$${after}`;
        }
        return match;
      }
    );

    return processed;
  }

  /**
   * 检测并修复混合展示的LaTeX问题（如"DnmD_{n}^{m}"）
   */
  public fixMixedLatexDisplay(content: string): string {
    return content.replace(
      /([A-Za-z]+)([A-Za-z])\\?[_^]\{([^}]+)\}/g,
      (match, prefix1, prefix2, subscript) => {
        // 检查是否是混合形式，如"DnmD_{n}^{m}"中的"DnmD_{n}"
        if (prefix1 && prefix2 && (prefix1.endsWith(prefix2) || prefix1.includes(prefix2))) {
          // 只保留有效的LaTeX部分
          return (
            prefix2 +
            (match.includes("\\") ? "\\" : "") +
            (match.includes("_") ? "_{" : "^{") +
            subscript +
            "}"
          );
        }
        return match;
      }
    );
  }
}

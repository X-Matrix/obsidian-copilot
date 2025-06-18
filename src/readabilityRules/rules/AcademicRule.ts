import { BaseReadabilityRule } from "../BaseReadabilityRule";

export class AcademicRule extends BaseReadabilityRule {
  name = "AcademicRule";
  domainPatterns: string[] = [
    "arxiv.org",
    "*.edu",
    "researchgate.net",
    "scholar.google.com",
    "pubmed.ncbi.nlm.nih.gov",
    // 移除 "spaces.ac.cn" - 现在有专门的 SpaceACRule
  ];

  contentSelectors = [
    "#MainBody", // 最高优先级 - 专门针对包含此结构的学术网站
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

  // 添加日志辅助方法，使用全局console对象并添加强制输出
  private debug(message: string, data?: any) {
    // 使用window.console确保在浏览器环境中能正常工作
    try {
      const prefix = `[AcademicRule Debug]`;
      // 直接使用console.warn以确保更高的可见性
      if (data) {
        console.warn(`${prefix} ${message}`, data);
      } else {
        console.warn(`${prefix} ${message}`);
      }

      // 尝试在DOM中添加日志元素，增加可见性
      if (typeof document !== "undefined") {
        const logDiv = document.createElement("div");
        logDiv.style.cssText =
          "position:fixed;top:0;left:0;background:red;color:white;z-index:9999;padding:5px;";
        logDiv.textContent = `${prefix} ${message}`;
        document.body.appendChild(logDiv);
        // 5秒后自动移除
        setTimeout(() => logDiv.remove(), 5000);
      }
    } catch (e) {
      // 出错时尝试其他方法
      console.error("[Debug Error]", e);
    }
  }

  // 覆盖父类方法以添加额外的日志
  processContent(element: HTMLElement, document: Document): string {
    console.error(">>>>>>> AcademicRule.processContent 被调用 <<<<<<<");
    // 记录调用堆栈以确定是否被正确调用
    console.trace("AcademicRule.processContent 调用堆栈");

    // 在页面上添加明显的Visual标记
    try {
      const debugElement = document.createElement("div");
      debugElement.textContent = "Academic Rule Processing...";
      debugElement.style.cssText =
        "position:fixed;top:0;left:0;background:red;color:white;z-index:9999;padding:10px;font-size:20px;";
      document.body.appendChild(debugElement);
    } catch (e) {
      console.error("无法添加调试元素", e);
    }

    return super.processContent(element, document);
  }

  // 重写内容提取方法以特别处理 MathJax 和图片
  protected extractTextContent(element: HTMLElement): string {
    // 创建对象保存提取到的公式，添加明确的类型声明
    const mathFormulas: string[] = [];

    try {
      const clone = element.cloneNode(true) as HTMLElement;

      // 1. 首先提取所有 MathJax-Element 脚本
      const mathJaxScripts = clone.querySelectorAll('script[id^="MathJax-Element-"]');
      console.error(`找到 ${mathJaxScripts.length} 个 MathJax-Element 脚本`);

      // 收集所有宏定义
      let macroDefinitions = "";
      mathJaxScripts.forEach((script) => {
        const content = script.textContent || "";
        if (content.includes("\\newcommand") || content.includes("\\def")) {
          macroDefinitions += content + "\n";
        }
      });

      // 处理每个脚本元素
      mathJaxScripts.forEach((script) => {
        const content = script.textContent || "";
        if (content.trim()) {
          // 特殊处理公式1: 如果是宏定义，只保留一次
          if (
            (content.includes("\\newcommand") || content.includes("\\def")) &&
            content !== macroDefinitions
          ) {
            // 此处不添加，已在宏定义中整体添加
          } else if (
            !content.includes("\\newcommand") &&
            !content.includes("\\def") &&
            macroDefinitions
          ) {
            // 特殊处理公式2: 如果使用了宏定义，但自身不包含宏定义，合并宏定义
            mathFormulas.push(`$$${macroDefinitions}\n${content}$$`);
          } else {
            // 普通处理：根据内容确定是行内还是块级公式
            const isBlock =
              content.length > 40 ||
              content.includes("\\\\") ||
              content.includes("\\begin") ||
              content.includes("\\end");
            mathFormulas.push(isBlock ? `$$${content}$$` : `$${content}$`);
          }
        }

        // 移除原脚本
        script.parentNode?.removeChild(script);
      });

      // 2. 查找并提取 math/tex 脚本
      const mathTexScripts = clone.querySelectorAll(
        'script[type="math/tex"], script[type="math/tex; mode=display"]'
      );
      console.error(`找到 ${mathTexScripts.length} 个 math/tex 脚本`);

      mathTexScripts.forEach((script) => {
        const content = script.textContent || "";
        if (content.trim()) {
          const isDisplay = script.getAttribute("type")?.includes("mode=display");
          mathFormulas.push(isDisplay ? `$$${content}$$` : `$${content}$`);
        }

        // 移除原脚本
        script.parentNode?.removeChild(script);
      });

      // 3. 移除所有 MathJax 渲染的元素
      const mathJaxElements = clone.querySelectorAll(
        '.MathJax, .MathJax_Display, .MathJax_Preview, [id^="MathJax-"]'
      );
      mathJaxElements.forEach((el) => el.parentNode?.removeChild(el));

      // 4. 获取清理后的文本内容
      let textContent = clone.innerText || clone.textContent || "";

      // 5. 将提取的公式添加到文本末尾
      if (mathFormulas.length > 0) {
        // 只添加宏定义一次
        if (macroDefinitions) {
          // 查找是否已经有宏定义被添加
          const hasDefinition = mathFormulas.some(
            (formula) => formula.includes("\\newcommand") || formula.includes("\\def")
          );

          if (!hasDefinition) {
            textContent += `\n\n$$${macroDefinitions}$$\n\n`;
          }
        }

        // 添加其他公式
        mathFormulas.forEach((formula) => {
          // 不重复添加宏定义
          if (macroDefinitions && formula.includes(macroDefinitions)) {
            const cleanFormula = formula.replace(macroDefinitions, "").trim();
            if (cleanFormula) {
              textContent += `\n\n${cleanFormula}\n\n`;
            }
          } else {
            textContent += `\n\n${formula}\n\n`;
          }
        });
      }

      console.error(`最终提取到 ${mathFormulas.length} 个公式`);
      if (mathFormulas.length > 0) {
        console.error(`第一个公式: ${mathFormulas[0].substring(0, 50)}...`);
      }

      return textContent;
    } catch (error) {
      console.error("公式提取出错:", error);
      // 失败时回退到基础实现
      return element.innerText || element.textContent || "";
    }
  }

  protected isDisplayModeFormula(mathText: string, element: HTMLElement): boolean {
    // 学术网站的数学公式判断更严格
    return (
      mathText.includes("\\begin{") ||
      mathText.includes("\\end{") ||
      mathText.includes("\\\\") ||
      mathText.includes("=") ||
      mathText.length > 40 ||
      element.classList.contains("MathJax_Display") ||
      element.closest(".MathJax_Display") !== null ||
      element.style.display === "block"
    );
  }
}

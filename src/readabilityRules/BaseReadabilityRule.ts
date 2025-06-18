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

  // 自定义内容处理函数
  customContentProcessor?: (element: HTMLElement, document: Document) => string;

  // 自定义数学公式处理函数
  customMathProcessor?: (element: HTMLElement, document: Document) => void;

  // 内容处理方法
  processContent(element: HTMLElement, document: Document): string;
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

  // 可选的自定义处理函数
  customContentProcessor?: (element: HTMLElement, document: Document) => string;
  customMathProcessor?: (element: HTMLElement, document: Document) => void;

  // 通用内容处理逻辑
  processContent(element: HTMLElement, document: Document): string {
    console.log("通用内容处理逻辑被调用");
    if (this.customContentProcessor) {
      return this.customContentProcessor(element, document);
    }

    const clone = element.cloneNode(true) as HTMLElement;

    // 移除不需要的元素
    this.removeUnwantedElements(clone);

    // 处理数学公式
    if (this.mathConfig.preserveLatex) {
      this.processMathFormulas(clone, document);
    }

    // 转换为结构化文本
    return this.convertToStructuredText(clone);
  }

  protected removeUnwantedElements(element: HTMLElement): void {
    this.unwantedSelectors.forEach((selector) => {
      const elements = element.querySelectorAll(selector);
      elements.forEach((el) => el.remove());
    });
  }

  protected processMathFormulas(element: HTMLElement, document: Document): void {
    if (this.customMathProcessor) {
      this.customMathProcessor(element, document);
      return;
    }

    // 处理script标签中的LaTeX
    const scriptElements = element.querySelectorAll(this.mathConfig.scriptSelectors.join(", "));
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
    const mathElements = element.querySelectorAll(this.mathConfig.mathJaxSelectors.join(", "));
    mathElements.forEach((mathEl) => {
      const htmlMathEl = mathEl as HTMLElement;

      if (htmlMathEl.querySelector(".extracted-latex")) {
        return;
      }

      const scriptEl = htmlMathEl.querySelector(this.mathConfig.scriptSelectors.join(", "));
      if (scriptEl && scriptEl.textContent) {
        const latexCode = scriptEl.textContent.trim();
        const isDisplayMode = scriptEl.getAttribute("type")?.includes("mode=display");
        const replacement = document.createElement("span");
        replacement.textContent = isDisplayMode ? `$$${latexCode}$$` : `$${latexCode}$`;
        mathEl.parentNode?.replaceChild(replacement, mathEl);
        return;
      }

      const mathText = htmlMathEl.textContent || htmlMathEl.innerText || "";
      if (mathText.trim()) {
        const replacement = document.createElement("span");
        const isDisplayMode = this.isDisplayModeFormula(mathText, htmlMathEl);
        replacement.textContent = isDisplayMode ? `$$${mathText}$$` : `$${mathText}$`;
        mathEl.parentNode?.replaceChild(replacement, mathEl);
      }
    });
  }

  protected isDisplayModeFormula(mathText: string, element: HTMLElement): boolean {
    return (
      mathText.includes("\\begin{") ||
      mathText.includes("\\end{") ||
      mathText.includes("\\\\") ||
      mathText.length > 50 ||
      element.classList.contains("MathJax_Display") ||
      element.closest(".MathJax_Display") !== null
    );
  }

  protected convertToStructuredText(element: HTMLElement): string {
    let result = "";

    const processNode = (node: Node): void => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        if (text.trim()) {
          result += text;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toLowerCase();

        if (/^h[1-6]$/.test(tagName)) {
          const level = parseInt(tagName[1]);
          result += "\n\n" + "#".repeat(level) + " ";
          for (const child of Array.from(el.childNodes)) {
            processNode(child);
          }
          result += "\n\n";
          return;
        }

        if (tagName === "p") {
          result += "\n\n";
          for (const child of Array.from(el.childNodes)) {
            processNode(child);
          }
          result += "\n\n";
          return;
        }

        if (tagName === "br") {
          result += "\n";
          return;
        }

        if (tagName === "ul" || tagName === "ol") {
          result += "\n";
          for (const child of Array.from(el.childNodes)) {
            processNode(child);
          }
          result += "\n";
          return;
        }

        if (tagName === "li") {
          result += "\n- ";
          for (const child of Array.from(el.childNodes)) {
            processNode(child);
          }
          return;
        }

        if (tagName === "pre") {
          result += "\n```\n";
          for (const child of Array.from(el.childNodes)) {
            processNode(child);
          }
          result += "\n```\n";
          return;
        }

        if (tagName === "code" && el.parentElement?.tagName.toLowerCase() !== "pre") {
          result += "`";
          for (const child of Array.from(el.childNodes)) {
            processNode(child);
          }
          result += "`";
          return;
        }

        if (["div", "section", "article", "blockquote"].includes(tagName)) {
          result += "\n";
          for (const child of Array.from(el.childNodes)) {
            processNode(child);
          }
          result += "\n";
          return;
        }

        if (tagName === "strong" || tagName === "b") {
          result += "**";
          for (const child of Array.from(el.childNodes)) {
            processNode(child);
          }
          result += "**";
          return;
        }

        if (tagName === "em" || tagName === "i") {
          result += "*";
          for (const child of Array.from(el.childNodes)) {
            processNode(child);
          }
          result += "*";
          return;
        }

        for (const child of Array.from(el.childNodes)) {
          processNode(child);
        }
      }
    };

    processNode(element);
    return result;
  }
}

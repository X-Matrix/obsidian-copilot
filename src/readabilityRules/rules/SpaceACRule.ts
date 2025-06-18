import { BaseReadabilityRule } from "../BaseReadabilityRule";

export class SpaceACRule extends BaseReadabilityRule {
  name = "SpaceACRule";
  domainPatterns: string[] = ["spaces.ac.cn"];

  contentSelectors = [
    "#MainBody", // spaces.ac.cn 的主体内容容器 - 最高优先级
    "#PostContent", // 备选：文章内容容器
    ".PostContent",
    ".Post",
  ];

  unwantedSelectors: string[] = [
    ...this.unwantedSelectors,
    // spaces.ac.cn 页面结构特有的移除元素
    "#breadcrumb", // 面包屑导航
    ".PostHead", // 文章头部（包含日期、作者等）
    ".date-wrap", // 日期包装器
    ".title-wrap .submitted", // 提交信息
    ".title_button", // 标题按钮（Kimi、引用、打印、分享）
    "#kimi", // Kimi 按钮
    "#to_cite", // 引用按钮
    "#print", // 打印按钮
    "#share", // 分享按钮及其子元素
    "#share_position", // 分享位置容器
    'script[type="text/javascript"]', // JavaScript 脚本

    // 页面底部元素
    "#content_tips", // 内容提示
    "#pay", // 打赏部分
    "#QR", // 二维码
    "#how_to_cite", // 引用信息
    ".cite_style", // 引用样式

    // 其他不需要的元素
    "#similar", // 相似文章
    "#tools", // 工具栏
    "#entrynavigation", // 条目导航
    "#PostComment", // 评论提示
    ".AllComments", // 所有评论
    ".ComListLi", // 评论列表项
    ".comment_reply", // 评论回复

    // 转载和版权信息（保留主要学术内容）
    'p[style*="color: #FF8800"]', // 橙色样式的转载说明
    'em[style*="color: #FF8800"]', // 橙色样式的强调文本
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
      ".MathJax_CommonHTML",
    ],
    scriptSelectors: [
      ...this.mathConfig.scriptSelectors,
      'script[type="math/tex"]',
      'script[type="math/tex; mode=display"]',
    ],
  };

  protected isDisplayModeFormula(mathText: string, element: HTMLElement): boolean {
    // spaces.ac.cn 数学公式判断 - 针对学术数学内容优化
    return (
      mathText.includes("\\begin{") ||
      mathText.includes("\\end{") ||
      mathText.includes("\\\\") ||
      mathText.includes("\\newcommand") ||
      mathText.includes("\\mathop") ||
      mathText.includes("\\text{") ||
      mathText.includes("=") ||
      mathText.includes("\\Rightarrow") ||
      mathText.includes("\\quad") ||
      mathText.length > 30 ||
      element.classList.contains("MathJax_Display") ||
      element.closest(".MathJax_Display") !== null ||
      element.style.display === "block"
    );
  }

  // 重写 processContent 方法，参考 RuleExtractor 的实现
  processContent(element: HTMLElement, document: Document): string {
    console.log("SpaceACRule: 开始处理内容");

    // 克隆元素避免修改原始 DOM
    const clone = element.cloneNode(true) as HTMLElement;

    // 移除不需要的元素
    this.unwantedSelectors.forEach((selector) => {
      const elements = clone.querySelectorAll(selector);
      elements.forEach((el) => el.remove());
    });

    // 处理数学公式
    this.processMathFormulas(clone, document);

    // 处理图片
    this.processImages(clone);

    // 转换为结构化文本
    const content = this.convertToStructuredText(clone);

    console.log(`SpaceACRule: 处理完成，内容长度: ${content.length}`);
    return content;
  }

  protected processMathFormulas(element: HTMLElement, document: Document): void {
    // 处理行内数学公式
    const inlineMathScripts = element.querySelectorAll('script[type="math/tex"]');
    inlineMathScripts.forEach((script) => {
      if (script.textContent && script.parentNode) {
        const span = document.createElement("span");
        span.textContent = `$${script.textContent.trim()}$`;
        span.className = "extracted-latex inline-math";
        script.parentNode.replaceChild(span, script);
      }
    });

    // 处理块级数学公式
    const displayMathScripts = element.querySelectorAll('script[type="math/tex; mode=display"]');
    displayMathScripts.forEach((script) => {
      if (script.textContent && script.parentNode) {
        const span = document.createElement("span");
        span.textContent = `$$${script.textContent.trim()}$$`;
        span.className = "extracted-latex display-math";
        script.parentNode.replaceChild(span, script);
      }
    });

    // 处理 MathJax 元素
    const mathJaxElements = element.querySelectorAll(this.mathConfig.mathJaxSelectors.join(", "));
    mathJaxElements.forEach((mathEl) => {
      const htmlMathEl = mathEl as HTMLElement;

      // 如果已经被处理过，跳过
      if (htmlMathEl.querySelector(".extracted-latex")) {
        return;
      }

      // 检查内部 script 标签
      const scriptEl = htmlMathEl.querySelector(this.mathConfig.scriptSelectors.join(", "));
      if (scriptEl && scriptEl.textContent) {
        const latexCode = scriptEl.textContent.trim();
        const isDisplayMode =
          scriptEl.getAttribute("type")?.includes("mode=display") ||
          this.isDisplayModeFormula(latexCode, htmlMathEl);
        const replacement = document.createElement("span");
        replacement.textContent = isDisplayMode ? `$$${latexCode}$$` : `$${latexCode}$`;
        replacement.className = "extracted-latex";
        mathEl.parentNode?.replaceChild(replacement, mathEl);
        return;
      }

      // 从数学元素本身提取内容
      const mathText = htmlMathEl.textContent || "";
      if (mathText.trim()) {
        const replacement = document.createElement("span");
        const isDisplayMode = this.isDisplayModeFormula(mathText, htmlMathEl);
        replacement.textContent = isDisplayMode ? `$$${mathText}$$` : `$${mathText}$`;
        replacement.className = "extracted-latex";
        mathEl.parentNode?.replaceChild(replacement, mathEl);
      }
    });
  }

  private processImages(element: HTMLElement): void {
    const images = element.querySelectorAll("img");
    images.forEach((img) => {
      if (img.parentNode) {
        const src = img.src || img.getAttribute("data-src");
        if (src) {
          // 确保使用完整URL
          const fullSrc = src.startsWith("http") ? src : `https://spaces.ac.cn${src}`;
          const alt = img.alt || "image";
          const replacement = document.createElement("span");
          replacement.textContent = `![${alt}](${fullSrc})`;
          replacement.className = "markdown-image";
          img.parentNode.replaceChild(replacement, img);
        }
      }
    });
  }

  protected convertToStructuredText(element: HTMLElement): string {
    let result = "";

    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        if (text.trim()) {
          result += text;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toLowerCase();

        // 处理标题
        if (/^h[1-6]$/.test(tagName)) {
          const level = parseInt(tagName[1]);
          result += "\n\n" + "#".repeat(level) + " ";
          Array.from(node.childNodes).forEach(processNode);
          result += "\n\n";
          return;
        }

        // 处理段落
        if (tagName === "p") {
          result += "\n\n";
          Array.from(node.childNodes).forEach(processNode);
          result += "\n\n";
          return;
        }

        // 处理换行
        if (tagName === "br") {
          result += "\n";
          return;
        }

        // 处理列表
        if (tagName === "ul" || tagName === "ol") {
          result += "\n";
          Array.from(node.childNodes).forEach(processNode);
          result += "\n";
          return;
        }

        if (tagName === "li") {
          result += "\n- ";
          Array.from(node.childNodes).forEach(processNode);
          return;
        }

        // 处理代码块
        if (tagName === "pre") {
          result += "\n```\n";
          Array.from(node.childNodes).forEach(processNode);
          result += "\n```\n";
          return;
        }

        // 处理行内代码
        if (tagName === "code" && el.parentElement?.tagName.toLowerCase() !== "pre") {
          result += "`";
          Array.from(node.childNodes).forEach(processNode);
          result += "`";
          return;
        }

        // 处理块级元素
        if (["div", "section", "article", "blockquote"].includes(tagName)) {
          result += "\n";
          Array.from(node.childNodes).forEach(processNode);
          result += "\n";
          return;
        }

        // 处理强调
        if (tagName === "strong" || tagName === "b") {
          result += "**";
          Array.from(node.childNodes).forEach(processNode);
          result += "**";
          return;
        }

        if (tagName === "em" || tagName === "i") {
          result += "*";
          Array.from(node.childNodes).forEach(processNode);
          result += "*";
          return;
        }

        // 默认处理子节点
        Array.from(node.childNodes).forEach(processNode);
      }
    };

    processNode(element);

    // 清理文本内容
    return result
      .replace(/\n{3,}/g, "\n\n") // 替换多个连续换行符为两个
      .replace(/\s+/g, " ") // 压缩连续空格
      .trim();
  }
}

import { BaseReadabilityRule } from "../BaseReadabilityRule";

export class SpaceACRule extends BaseReadabilityRule {
  name = "SpaceACRule";
  domainPatterns: string[] = ["spaces.ac.cn"];

  contentSelectors = [
    "#PostContent", // 主要文章内容容器(id="PostContent")
    ".PostContent", // 主要文章内容容器(class="PostContent")
    // "#MainBody", // 不再使用MainBody作为主要内容选择器
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
    ".MathJax_Preview", // 移除 MathJax 预览元素
    "[class^='MathJax_Preview']", // 移除所有以 MathJax_Preview 开头的类名元素
    "span.MathJax_Preview", // 移除 span 的 MathJax_Preview 元素

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
    if (this.mathConfig.preserveLatex) {
      this.processMathFormulas(clone, document, this.mathConfig);
    }

    // 处理图片
    this.processImages(clone);

    // 转换为结构化文本
    const content = this.convertToStructuredText(clone);

    console.log(`SpaceACRule: 处理完成，内容长度: ${content.length}`);
    return content;
  }

  // 修改签名以匹配 RuleExtractor 的实现
  protected processMathFormulas(
    element: HTMLElement,
    document: Document,
    mathConfig: any = this.mathConfig
  ): void {
    // 首先移除所有 MathJax 相关预览元素
    const previewElements = element.querySelectorAll(".MathJax_Preview");
    previewElements.forEach((el) => el.remove());

    // 移除所有不需要的 MathJax 渲染元素
    const renderElements = element.querySelectorAll(
      ".MathJax, .MathJax_Display, .MathJax_SVG_Display"
    );
    renderElements.forEach((el) => {
      // 检查是否有关联的 script 标签，如果没有，直接移除
      const relatedId = el.id?.replace("-Frame", "");
      if (!relatedId || !element.querySelector(`script[id="${relatedId}"]`)) {
        el.remove();
      }
    });

    // 处理行内数学公式
    const inlineMathScripts = element.querySelectorAll(mathConfig.scriptSelectors.join(", "));
    inlineMathScripts.forEach((script) => {
      if (script.textContent && script.parentNode) {
        const latexCode = script.textContent.trim();

        // 提取并保留宏定义
        const macroDefinitions: string[] = [];
        const macroPatt = /\\newcommand{.*?}[^}]+}/g;
        const macroMatches = latexCode.match(macroPatt);

        if (macroMatches) {
          macroMatches.forEach((macro: string) => {
            macroDefinitions.push(macro);
          });
        }

        const isDisplayMode =
          script.getAttribute("type")?.includes("mode=display") ||
          this.isDisplayModeFormula(latexCode, script as HTMLElement);

        const span = document.createElement("span");
        span.textContent = isDisplayMode ? `$$${latexCode}$$` : `$${latexCode}$`;
        span.className = "extracted-latex " + (isDisplayMode ? "display-math" : "inline-math");

        // 替换 script 标签及其相关的 MathJax 元素
        script.parentNode.replaceChild(span, script);

        // 查找并移除相关的 MathJax 渲染元素
        const scriptId = script.id;
        if (scriptId) {
          const relatedMathJax = element.querySelector(`#${scriptId}-Frame`);
          if (relatedMathJax && relatedMathJax.parentNode) {
            relatedMathJax.parentNode.removeChild(relatedMathJax);
          }
        }
      }
    });

    // 处理 MathJax 元素
    const mathJaxElements = element.querySelectorAll(mathConfig.mathJaxSelectors.join(", "));
    mathJaxElements.forEach((mathEl) => {
      const htmlMathEl = mathEl as HTMLElement;

      // 如果已经被处理过，跳过
      if (htmlMathEl.querySelector(".extracted-latex")) {
        return;
      }

      // 检查内部 script 标签
      const scriptEl = htmlMathEl.querySelector(mathConfig.scriptSelectors.join(", "));
      if (scriptEl && scriptEl.textContent) {
        const latexCode = scriptEl.textContent.trim();
        const isDisplayMode =
          scriptEl.getAttribute("type")?.includes("mode=display") ||
          this.isDisplayModeFormula(latexCode, htmlMathEl);
        const replacement = document.createElement("span");
        replacement.textContent = isDisplayMode ? `$$${latexCode}$$` : `$${latexCode}$`;
        replacement.className =
          "extracted-latex " + (isDisplayMode ? "display-math" : "inline-math");
        mathEl.parentNode?.replaceChild(replacement, mathEl);
        return;
      }

      // 检查兄弟元素中的script标签
      if (htmlMathEl.id && htmlMathEl.id.includes("MathJax-Element")) {
        const elementId = htmlMathEl.id;
        const siblingScript = element.querySelector(`script[id="${elementId}"]`);
        if (siblingScript && siblingScript.textContent) {
          const latexCode = siblingScript.textContent.trim();
          const isDisplayMode =
            siblingScript.getAttribute("type")?.includes("mode=display") ||
            this.isDisplayModeFormula(latexCode, htmlMathEl);
          const replacement = document.createElement("span");
          replacement.textContent = isDisplayMode ? `$$${latexCode}$$` : `$${latexCode}$`;
          replacement.className =
            "extracted-latex " + (isDisplayMode ? "display-math" : "inline-math");
          mathEl.parentNode?.replaceChild(replacement, mathEl);
          return;
        }
      }

      // 尝试从data属性获取LaTeX源码
      const latexAttr =
        htmlMathEl.getAttribute("data-latex") ||
        htmlMathEl.getAttribute("data-original-title") ||
        htmlMathEl.getAttribute("title") ||
        htmlMathEl.getAttribute("data-mathml");
      if (latexAttr) {
        const replacement = document.createElement("span");
        const isDisplayMode = this.isDisplayModeFormula(latexAttr, htmlMathEl);
        replacement.textContent = isDisplayMode ? `$$${latexAttr}$$` : `$${latexAttr}$`;
        replacement.className =
          "extracted-latex " + (isDisplayMode ? "display-math" : "inline-math");
        mathEl.parentNode?.replaceChild(replacement, mathEl);
        return;
      }

      // 从数学元素本身提取内容
      const mathText = htmlMathEl.textContent || "";
      if (mathText.trim()) {
        const replacement = document.createElement("span");
        const isDisplayMode = this.isDisplayModeFormula(mathText, htmlMathEl);
        replacement.textContent = isDisplayMode ? `$$${mathText}$$` : `$${mathText}$`;
        replacement.className =
          "extracted-latex " + (isDisplayMode ? "display-math" : "inline-math");
        mathEl.parentNode?.replaceChild(replacement, mathEl);
      } else {
        mathEl.remove(); // 如果没有有效内容，则移除该元素
      }
    });

    // 最后清理任何剩余的 MathJax 元素
    const remainingMathJax = element.querySelectorAll(
      ".MathJax, .MathJax_Preview, .MathJax_Display"
    );
    remainingMathJax.forEach((el) => el.remove());
  }

  private processImages(element: HTMLElement): void {
    const images = element.querySelectorAll("img");
    images.forEach((img) => {
      if (img.parentNode) {
        const src = img.src || img.getAttribute("data-src");
        if (src) {
          // 修正图片 URL 处理逻辑：只有以斜杠开头的路径才添加域名前缀
          const fullSrc = src.startsWith("/") ? `https://spaces.ac.cn${src}` : src;
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
      .replace(/[ \t]+/g, " ") // 压缩连续空格和制表符
      .replace(/\n +/g, "\n") // 移除行开头的空格
      .trim();
  }

  /**
   * 为 spaces.ac.cn 网站生成专门优化的浏览器提取器代码
   * 这段代码将在浏览器环境中执行，用于提取和处理学术内容
   * @returns {string} 可在浏览器中执行的 JavaScript 代码字符串
   */
  generateSpecificBrowserExtractor(): string {
    return `
      // 创建特化的SpaceACExtractor函数
      (function() {
        window.SpaceACExtractor = {
          extractContent: function(document, config) {
            console.log("SpaceACExtractor: 开始提取内容");

            // 先尝试使用主要内容选择器
            for (const selector of config.contentSelectors) {
              const element = document.querySelector(selector);
              if (element) {
                console.log("SpaceACExtractor: 找到内容元素", selector);
                const clone = element.cloneNode(true);

                // 移除不需要的元素
                config.unwantedSelectors.forEach(sel => {
                  const elements = clone.querySelectorAll(sel);
                  elements.forEach(el => el.remove());
                });

                // 处理数学公式
                if (config.mathConfig.preserveLatex) {
                  this.processMathFormulas(clone, document, config.mathConfig);
                }

                // 处理图片
                this.processImages(clone);

                // 转换为结构化文本
                const content = this.convertToStructuredText(clone);

                // 清理文本
                const cleanedContent = content
                  .replace(/\\n{3,}/g, "\\n\\n")
                  .replace(/[ \\t]+/g, " ")
                  .replace(/\\n +/g, "\\n")
                  .trim();

                if (cleanedContent && cleanedContent.trim().length > 100) {
                  console.log("SpaceACExtractor: 提取成功，内容长度", cleanedContent.length);
                  return {
                    title: document.title,
                    content: cleanedContent,
                    success: true
                  };
                }
              }
            }

            // 如果没找到主要内容，使用备选方案
            return this.extractFromBody(document, config);
          },

          extractFromBody: function(document, config) {
            console.log("SpaceACExtractor: 从body提取内容");
            const bodyClone = document.body.cloneNode(true);

            // 移除不需要的元素
            config.unwantedSelectors.forEach(selector => {
              const elements = bodyClone.querySelectorAll(selector);
              elements.forEach(el => el.remove());
            });

            // 处理数学公式
            if (config.mathConfig.preserveLatex) {
              this.processMathFormulas(bodyClone, document, config.mathConfig);
            }

            // 处理图片
            this.processImages(bodyClone);

            // 转换为更有结构的文本
            const content = this.convertToStructuredText(bodyClone);

            // 清理文本
            const cleanedContent = content
              .replace(/\\n{3,}/g, "\\n\\n")
              .replace(/[ \\t]+/g, " ")
              .replace(/\\n +/g, "\\n")
              .trim();

            return {
              title: document.title,
              content: cleanedContent,
              success: cleanedContent.trim().length > 50
            };
          },

          processMathFormulas: function(element, document, mathConfig) {
            // 首先移除所有 MathJax 相关预览元素
            const previewElements = element.querySelectorAll('.MathJax_Preview');
            previewElements.forEach(el => el.remove());

            // 移除所有不需要的 MathJax 渲染元素
            const renderElements = element.querySelectorAll('.MathJax, .MathJax_Display, .MathJax_SVG_Display');
            renderElements.forEach(el => {
              // 检查是否有关联的 script 标签，如果没有，直接移除
              const relatedId = el.id?.replace("-Frame", "");
              if (!relatedId || !element.querySelector(\`script[id="\${relatedId}"]\`)) {
                el.remove();
              }
            });

            // 处理行内数学公式
            const inlineMathScripts = element.querySelectorAll(mathConfig.scriptSelectors.join(", "));
            inlineMathScripts.forEach((script) => {
              if (script.textContent && script.parentNode) {
                let latexCode = script.textContent.trim();

                // 提取并保留宏定义
                const macroDefinitions = [];
                const macroPatt = /\\\\newcommand{.*?}[^}]+}/g;
                const macroMatches = latexCode.match(macroPatt);

                if (macroMatches) {
                  macroMatches.forEach(macro => {
                    macroDefinitions.push(macro);
                  });
                }

                const isDisplayMode = script.getAttribute("type")?.includes("mode=display") ||
                  this.isDisplayModeFormula(latexCode, script);

                const span = document.createElement("span");
                span.textContent = isDisplayMode ? \`$$\${latexCode}$$\` : \`$\${latexCode}$\`;
                span.className = "extracted-latex " + (isDisplayMode ? "display-math" : "inline-math");

                // 替换 script 标签及其相关的 MathJax 元素
                script.parentNode.replaceChild(span, script);

                // 查找并移除相关的 MathJax 渲染元素
                const scriptId = script.id;
                if (scriptId) {
                  const relatedMathJax = element.querySelector(\`#\${scriptId}-Frame\`);
                  if (relatedMathJax && relatedMathJax.parentNode) {
                    relatedMathJax.parentNode.removeChild(relatedMathJax);
                  }
                }
              }
            });

            // 处理 MathJax 元素
            const mathJaxElements = element.querySelectorAll(mathConfig.mathJaxSelectors.join(", "));
            mathJaxElements.forEach((mathEl) => {
              const htmlMathEl = mathEl;

              // 如果已经被处理过，跳过
              if (htmlMathEl.querySelector(".extracted-latex")) {
                return;
              }

              // 检查内部 script 标签
              const scriptEl = htmlMathEl.querySelector(mathConfig.scriptSelectors.join(", "));
              if (scriptEl && scriptEl.textContent) {
                const latexCode = scriptEl.textContent.trim();
                const isDisplayMode = scriptEl.getAttribute("type")?.includes("mode=display") ||
                  this.isDisplayModeFormula(latexCode, htmlMathEl);
                const replacement = document.createElement("span");
                replacement.textContent = isDisplayMode ? \`$$\${latexCode}$$\` : \`$\${latexCode}$\`;
                replacement.className = "extracted-latex " + (isDisplayMode ? "display-math" : "inline-math");
                mathEl.parentNode?.replaceChild(replacement, mathEl);
                return;
              }

              // 检查兄弟元素中的script标签
              if (htmlMathEl.id && htmlMathEl.id.includes('MathJax-Element')) {
                const elementId = htmlMathEl.id;
                const siblingScript = element.querySelector(\`script[id="\${elementId}"]\`);
                if (siblingScript && siblingScript.textContent) {
                  const latexCode = siblingScript.textContent.trim();
                  const isDisplayMode = siblingScript.getAttribute('type')?.includes('mode=display') ||
                    this.isDisplayModeFormula(latexCode, htmlMathEl);
                  const replacement = document.createElement('span');
                  replacement.textContent = isDisplayMode ? \`$$\${latexCode}$$\` : \`$\${latexCode}$\`;
                  replacement.className = "extracted-latex " + (isDisplayMode ? "display-math" : "inline-math");
                  mathEl.parentNode?.replaceChild(replacement, mathEl);
                  return;
                }
              }

              // 尝试从data属性获取LaTeX源码
              const latexAttr = htmlMathEl.getAttribute('data-latex') ||
                htmlMathEl.getAttribute('data-original-title') ||
                htmlMathEl.getAttribute('title') ||
                htmlMathEl.getAttribute('data-mathml');
              if (latexAttr) {
                const replacement = document.createElement('span');
                const isDisplayMode = this.isDisplayModeFormula(latexAttr, htmlMathEl);
                replacement.textContent = isDisplayMode ? \`$$\${latexAttr}$$\` : \`$\${latexAttr}$\`;
                replacement.className = "extracted-latex " + (isDisplayMode ? "display-math" : "inline-math");
                mathEl.parentNode?.replaceChild(replacement, mathEl);
                return;
              }

              // 从数学元素本身提取内容
              const mathText = htmlMathEl.textContent || "";
              if (mathText.trim()) {
                const replacement = document.createElement("span");
                const isDisplayMode = this.isDisplayModeFormula(mathText, htmlMathEl);
                replacement.textContent = isDisplayMode ? \`$$\${mathText}$$\` : \`$\${mathText}$\`;
                replacement.className = "extracted-latex " + (isDisplayMode ? "display-math" : "inline-math");
                mathEl.parentNode?.replaceChild(replacement, mathEl);
              } else {
                mathEl.remove();  // 如果没有有效内容，则移除该元素
              }
            });

            // 最后清理任何剩余的 MathJax 元素
            const remainingMathJax = element.querySelectorAll('.MathJax, .MathJax_Preview, .MathJax_Display');
            remainingMathJax.forEach(el => el.remove());
          },

          isDisplayModeFormula: function(mathText, element) {
            return (
              mathText.includes("\\\\begin{") ||
              mathText.includes("\\\\end{") ||
              mathText.includes("\\\\\\\\") ||
              mathText.includes("\\\\newcommand") ||
              mathText.includes("\\\\mathop") ||
              mathText.includes("\\\\text{") ||
              mathText.includes("=") ||
              mathText.includes("\\\\Rightarrow") ||
              mathText.includes("\\\\quad") ||
              mathText.length > 30 ||
              element.classList.contains("MathJax_Display") ||
              element.closest(".MathJax_Display") !== null ||
              element.style.display === "block"
            );
          },

          processImages: function(element) {
            const images = element.querySelectorAll("img");
            images.forEach(img => {
              if (img.parentNode) {
                const src = img.src || img.getAttribute("data-src");
                if (src) {
                  // 修正图片 URL 处理逻辑：只有以斜杠开头的路径才添加域名前缀
                  const fullSrc = src.startsWith("/") ? \`https://spaces.ac.cn\${src}\` : src;
                  const alt = img.alt || "image";
                  const replacement = document.createElement("span");
                  replacement.textContent = \`![\${alt}](\${fullSrc})\`;
                  replacement.className = "markdown-image";
                  img.parentNode.replaceChild(replacement, img);
                }
              }
            });
          },

          convertToStructuredText: function(element) {
            let result = '';

            const processNode = (node) => {
              if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent || '';
                if (text.trim()) {
                  result += text;
                }
              } else if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node;
                const tagName = el.tagName.toLowerCase();

                // 处理标题
                if (/^h[1-6]$/.test(tagName)) {
                  const level = parseInt(tagName[1]);
                  result += '\\n\\n' + '#'.repeat(level) + ' ';
                  Array.from(node.childNodes).forEach(processNode);
                  result += '\\n\\n';
                  return;
                }

                // 处理段落
                if (tagName === 'p') {
                  result += '\\n\\n';
                  Array.from(node.childNodes).forEach(processNode);
                  result += '\\n\\n';
                  return;
                }

                // 处理换行
                if (tagName === 'br') {
                  result += '\\n';
                  return;
                }

                // 处理列表
                if (tagName === 'ul' || tagName === 'ol') {
                  result += '\\n';
                  Array.from(node.childNodes).forEach(processNode);
                  result += '\\n';
                  return;
                }

                if (tagName === 'li') {
                  result += '\\n- ';
                  Array.from(node.childNodes).forEach(processNode);
                  return;
                }

                // 处理代码块
                if (tagName === 'pre') {
                  result += '\\n\`\`\`\\n';
                  Array.from(node.childNodes).forEach(processNode);
                  result += '\\n\`\`\`\\n';
                  return;
                }

                // 处理行内代码
                if (tagName === 'code' && el.parentElement?.tagName.toLowerCase() !== 'pre') {
                  result += '\`';
                  Array.from(node.childNodes).forEach(processNode);
                  result += '\`';
                  return;
                }

                // 处理块级元素
                if (['div', 'section', 'article', 'blockquote'].includes(tagName)) {
                  result += '\\n';
                  Array.from(node.childNodes).forEach(processNode);
                  result += '\\n';
                  return;
                }

                // 处理强调
                if (tagName === 'strong' || tagName === 'b') {
                  result += '**';
                  Array.from(node.childNodes).forEach(processNode);
                  result += '**';
                  return;
                }

                if (tagName === 'em' || tagName === 'i') {
                  result += '*';
                  Array.from(node.childNodes).forEach(processNode);
                  result += '*';
                  return;
                }

                // 默认处理子节点
                Array.from(node.childNodes).forEach(processNode);
              }
            };

            processNode(element);
            return result;
          }
        };

        // 确保有readabilityRuleManager对象可用
        if (!window.readabilityRuleManager) {
          window.readabilityRuleManager = {};
        }

        // 将SpaceACExtractor绑定到window对象
        window.readabilityRuleManager.extractor = SpaceACExtractor;

        // 返回提取器对象以便可以立即调用
        return SpaceACExtractor;
      })();
    `;
  }
}

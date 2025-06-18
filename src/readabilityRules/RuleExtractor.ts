import { ReadabilityRule } from "./BaseReadabilityRule";

export interface RuleConfig {
  name: string;
  contentSelectors: string[];
  unwantedSelectors: string[];
  mathConfig: {
    preserveLatex: boolean;
    mathJaxSelectors: string[];
    scriptSelectors: string[];
  };
}

export class RuleExtractor {
  /**
   * 生成可在浏览器环境中执行的规则提取器代码
   * 这个方法返回一个字符串，包含完整的提取逻辑
   */
  static generateBrowserExtractor(): string {
    return `
      // 创建RuleBasedExtractor函数而不是直接使用eval
      (function() {
        window.RuleBasedExtractor = {
          extractContent: function(document, config) {
            // 寻找主要内容区域
            for (const selector of config.contentSelectors) {
              const element = document.querySelector(selector);
              if (element) {
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

                // 转换为结构化文本
                const content = this.convertToStructuredText(clone);

                if (content && content.trim().length > 100) {
                  return {
                    title: document.title,
                    content: content,
                    success: true
                  };
                }
              }
            }

            // 如果没找到主要内容，使用body作为备选
            return this.extractFromBody(document, config);
          },

          extractFromBody: function(document, config) {
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

            const bodyContent = bodyClone.textContent || bodyClone.innerText || '';

            return {
              title: document.title,
              content: bodyContent,
              success: bodyContent.trim().length > 50
            };
          },

          processMathFormulas: function(element, document, mathConfig) {
            // 处理script标签中的LaTeX
            const scriptElements = element.querySelectorAll(mathConfig.scriptSelectors.join(', '));
            scriptElements.forEach(scriptEl => {
              if (scriptEl.textContent) {
                const latexCode = scriptEl.textContent.trim();
                const isDisplayMode = scriptEl.getAttribute('type')?.includes('mode=display');
                const replacement = document.createElement('span');
                replacement.textContent = isDisplayMode ? \`$$\${latexCode}$$\` : \`$\${latexCode}$\`;
                replacement.className = 'extracted-latex';
                scriptEl.parentNode?.replaceChild(replacement, scriptEl);
              }
            });

            // 处理MathJax元素
            const mathElements = element.querySelectorAll(mathConfig.mathJaxSelectors.join(', '));
            mathElements.forEach(mathEl => {
              if (mathEl.querySelector('.extracted-latex')) {
                return;
              }

              // 检查内部script标签
              const scriptEl = mathEl.querySelector(mathConfig.scriptSelectors.join(', '));
              if (scriptEl && scriptEl.textContent) {
                const latexCode = scriptEl.textContent.trim();
                const isDisplayMode = scriptEl.getAttribute('type')?.includes('mode=display');
                const replacement = document.createElement('span');
                replacement.textContent = isDisplayMode ? \`$$\${latexCode}$$\` : \`$\${latexCode}$\`;
                mathEl.parentNode?.replaceChild(replacement, mathEl);
                return;
              }

              // 检查兄弟元素中的script标签
              if (mathEl.id && mathEl.id.includes('MathJax-Element')) {
                const elementId = mathEl.id;
                const siblingScript = element.querySelector(\`script[id="\${elementId}"]\`);
                if (siblingScript && siblingScript.textContent) {
                  const latexCode = siblingScript.textContent.trim();
                  const isDisplayMode = siblingScript.getAttribute('type')?.includes('mode=display');
                  const replacement = document.createElement('span');
                  replacement.textContent = isDisplayMode ? \`$$\${latexCode}$$\` : \`$\${latexCode}$\`;
                  mathEl.parentNode?.replaceChild(replacement, mathEl);
                  return;
                }
              }

              // 尝试从data属性获取LaTeX源码
              const latexAttr = mathEl.getAttribute('data-latex') ||
                mathEl.getAttribute('data-original-title') ||
                mathEl.getAttribute('title') ||
                mathEl.getAttribute('data-mathml');
              if (latexAttr) {
                const replacement = document.createElement('span');
                replacement.textContent = latexAttr.includes('$$') ? latexAttr : \`$\${latexAttr}$\`;
                mathEl.parentNode?.replaceChild(replacement, mathEl);
                return;
              }

              // 保留数学符号文本
              const mathText = mathEl.textContent || mathEl.innerText || '';
              if (mathText.trim()) {
                const replacement = document.createElement('span');
                const isDisplayMode = mathText.includes('\\\\begin{') ||
                  mathText.includes('\\\\end{') ||
                  mathText.includes('\\\\\\\\') ||
                  mathText.length > 50 ||
                  mathEl.classList.contains('MathJax_Display') ||
                  mathEl.closest('.MathJax_Display');
                replacement.textContent = isDisplayMode ? \`$$\${mathText}$$\` : \`$\${mathText}$\`;
                mathEl.parentNode?.replaceChild(replacement, mathEl);
              } else {
                mathEl.remove();
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
                const tagName = node.tagName.toLowerCase();

                if (/^h[1-6]$/.test(tagName)) {
                  const level = parseInt(tagName[1]);
                  result += '\\n\\n' + '#'.repeat(level) + ' ';
                  for (const child of Array.from(node.childNodes)) {
                    processNode(child);
                  }
                  result += '\\n\\n';
                  return;
                }

                if (tagName === 'p') {
                  result += '\\n\\n';
                  for (const child of Array.from(node.childNodes)) {
                    processNode(child);
                  }
                  result += '\\n\\n';
                  return;
                }

                if (tagName === 'br') {
                  result += '\\n';
                  return;
                }

                if (tagName === 'ul' || tagName === 'ol') {
                  result += '\\n';
                  for (const child of Array.from(node.childNodes)) {
                    processNode(child);
                  }
                  result += '\\n';
                  return;
                }

                if (tagName === 'li') {
                  result += '\\n- ';
                  for (const child of Array.from(node.childNodes)) {
                    processNode(child);
                  }
                  return;
                }

                if (tagName === 'pre') {
                  result += '\\n\`\`\`\\n';
                  for (const child of Array.from(node.childNodes)) {
                    processNode(child);
                  }
                  result += '\\n\`\`\`\\n';
                  return;
                }

                if (tagName === 'code' && node.parentElement?.tagName.toLowerCase() !== 'pre') {
                  result += '\`';
                  for (const child of Array.from(node.childNodes)) {
                    processNode(child);
                  }
                  result += '\`';
                  return;
                }

                if (['div', 'section', 'article', 'blockquote'].includes(tagName)) {
                  result += '\\n';
                  for (const child of Array.from(node.childNodes)) {
                    processNode(child);
                  }
                  result += '\\n';
                  return;
                }

                if (tagName === 'strong' || tagName === 'b') {
                  result += '**';
                  for (const child of Array.from(node.childNodes)) {
                    processNode(child);
                  }
                  result += '**';
                  return;
                }

                if (tagName === 'em' || tagName === 'i') {
                  result += '*';
                  for (const child of Array.from(node.childNodes)) {
                    processNode(child);
                  }
                  result += '*';
                  return;
                }

                for (const child of Array.from(node.childNodes)) {
                  processNode(child);
                }
              }
            };

            processNode(element);
            return result;
          }
        };
      })();
    `;
  }

  /**
   * 将规则转换为浏览器可用的配置
   */
  static ruleToConfig(rule: ReadabilityRule): RuleConfig {
    return {
      name: rule.name,
      contentSelectors: rule.contentSelectors,
      unwantedSelectors: rule.unwantedSelectors,
      mathConfig: rule.mathConfig,
    };
  }

  /**
   * 生成一个更安全的提取器函数，避免使用eval
   */
  static createExtractorFunction(): (
    document: Document,
    config: any
  ) => { title: string; content: string; success: boolean } {
    return new Function(
      "document",
      "config",
      `
      // 直接返回提取逻辑，不需要eval
      const RuleBasedExtractor = {
        extractContent: function(document, config) {
          // 寻找主要内容区域
          for (const selector of config.contentSelectors) {
            const element = document.querySelector(selector);
            if (element) {
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

              // 转换为结构化文本
              const content = this.convertToStructuredText(clone);

              if (content && content.trim().length > 100) {
                return {
                  title: document.title,
                  content: content,
                  success: true
                };
              }
            }
          }

          // 如果没找到主要内容，使用body作为备选
          return this.extractFromBody(document, config);
        },

        extractFromBody: function(document, config) {
          const bodyClone = document.body.cloneNode(true);

          config.unwantedSelectors.forEach(selector => {
            const elements = bodyClone.querySelectorAll(selector);
            elements.forEach(el => el.remove());
          });

          if (config.mathConfig.preserveLatex) {
            this.processMathFormulas(bodyClone, document, config.mathConfig);
          }

          const bodyContent = bodyClone.textContent || bodyClone.innerText || '';

          return {
            title: document.title,
            content: bodyContent,
            success: bodyContent.trim().length > 50
          };
        },

        processMathFormulas: function(element, document, mathConfig) {
          // 数学公式处理逻辑
          const scriptElements = element.querySelectorAll(mathConfig.scriptSelectors.join(', '));
          scriptElements.forEach(scriptEl => {
            if (scriptEl.textContent) {
              const latexCode = scriptEl.textContent.trim();
              const isDisplayMode = scriptEl.getAttribute('type')?.includes('mode=display');
              const replacement = document.createElement('span');
              replacement.textContent = isDisplayMode ? \`$$\${latexCode}$$\` : \`$\${latexCode}$\`;
              replacement.className = 'extracted-latex';
              scriptEl.parentNode?.replaceChild(replacement, scriptEl);
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
              const tagName = node.tagName.toLowerCase();

              if (/^h[1-6]$/.test(tagName)) {
                const level = parseInt(tagName[1]);
                result += '\\n\\n' + '#'.repeat(level) + ' ';
                Array.from(node.childNodes).forEach(processNode);
                result += '\\n\\n';
                return;
              }

              if (tagName === 'p') {
                result += '\\n\\n';
                Array.from(node.childNodes).forEach(processNode);
                result += '\\n\\n';
                return;
              }

              Array.from(node.childNodes).forEach(processNode);
            }
          };

          processNode(element);
          return result;
        }
      };

      return RuleBasedExtractor.extractContent(document, config);
    `
    ) as (document: Document, config: any) => { title: string; content: string; success: boolean };
  }
}

import { Browser, Page, chromium } from "playwright";
import { Notice } from "obsidian";
import { logInfo } from "@/logger";
import { ReadabilityRuleManager } from "@/readabilityRules/ReadabilityRuleManager";
import { url } from "inspector";
import TurndownService from "turndown";
import { MathJaxExtractor, ExtractedMath } from "./MathJaxExtractor";
import { LatexCleaner } from "../extractors/LatexCleaner";

export interface LocalUrl4llmResponse {
  content: string;
  title: string;
  url: string;
  success: boolean;
  error?: string;
}

// 添加Window接口扩展，使readabilityRuleManager属性合法
declare global {
  interface Window {
    readabilityRuleManager?: any;
  }
}

export class LocalUrl4llmTool {
  private static instance: LocalUrl4llmTool;
  private browser: Browser | null = null;
  private playwrightModule: any = null;
  private isSupported: boolean | null = null;
  private readonly timeout = 30000; // 30 seconds
  private readonly userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  private ruleManager: ReadabilityRuleManager;

  static getInstance(): LocalUrl4llmTool {
    if (!LocalUrl4llmTool.instance) {
      LocalUrl4llmTool.instance = new LocalUrl4llmTool();
    }
    return LocalUrl4llmTool.instance;
  }

  private constructor() {
    this.ruleManager = ReadabilityRuleManager.getInstance();
  }

  private async checkSupport(): Promise<boolean> {
    if (this.isSupported !== null) {
      return this.isSupported;
    }

    try {
      // 检查Node.js环境
      if (typeof require === "undefined") {
        console.warn("Node.js require function not available");
        this.isSupported = false;
        return false;
      }

      // 检查是否在Electron环境中
      const isElectron =
        typeof process !== "undefined" && process.versions && process.versions.electron;

      logInfo("LocalUrl4llm environment check:", {
        isElectron,
        processVersions: process?.versions,
        nodeVersion: process?.version,
        platform: process?.platform,
        hasRequire: typeof require !== "undefined",
      });

      if (!isElectron) {
        console.warn("Local URL processing requires Electron environment");
        this.isSupported = false;
        return false;
      }

      // 检查playwright是否可用
      logInfo("Attempting to import playwright for URL processing...");

      // 尝试导入 @mozilla/readability
      let readabilityModule;
      try {
        readabilityModule = require("@mozilla/readability");
        logInfo("Readability module imported successfully");
      } catch (readabilityError) {
        logInfo(
          "Readability module not found, will use fallback methods:",
          readabilityError.message
        );
      }

      let playwrightModule;
      try {
        playwrightModule = await import("playwright");
      } catch (importError) {
        logInfo("Dynamic import failed, trying require:", importError.message);
        try {
          playwrightModule = require("playwright");
        } catch (requireError) {
          console.error("Both import and require failed:", {
            importError: importError.message,
            requireError: requireError.message,
          });

          // 尝试从开发目录直接导入
          try {
            const devPlaywrightPath =
              "/Users/xmatrix/Documents/fun_project/obsidian-copilot/node_modules/playwright";
            logInfo("Trying development path import:", devPlaywrightPath);
            playwrightModule = require(devPlaywrightPath);
          } catch (directError) {
            console.error("Development path import failed:", directError.message);
            throw new Error("Playwright module not found. Please install: npm install playwright");
          }
        }
      }

      this.playwrightModule = playwrightModule;
      logInfo("Playwright imported successfully for URL processing");

      // 检查chromium是否可用
      try {
        const { chromium } = this.playwrightModule;
        logInfo("Checking chromium availability for URL processing...");

        const executablePath = chromium.executablePath();
        logInfo("Chromium executable path:", executablePath);

        const fs = require("fs");
        const chromiumExists = fs.existsSync(executablePath);
        logInfo("Chromium exists:", chromiumExists);

        if (!chromiumExists) {
          console.warn("Chromium not found. Please run: npx playwright install chromium");
          this.isSupported = false;
          return false;
        }
      } catch (chromiumError) {
        console.error("Chromium check failed:", chromiumError);
        this.isSupported = false;
        return false;
      }

      this.isSupported = true;
      logInfo("Playwright environment check passed for URL processing");
      return true;
    } catch (error) {
      console.error("Playwright environment check failed for URL processing:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      if (
        error.message.includes("Cannot resolve module") ||
        error.message.includes("Failed to resolve module")
      ) {
        console.warn(
          "Playwright module not found. This feature requires playwright to be installed."
        );
      } else if (error.message.includes("ENOENT")) {
        console.warn("Playwright browsers not installed. Run: npx playwright install");
      }

      this.isSupported = false;
      return false;
    }
  }

  private async initPlaywright() {
    const isSupported = await this.checkSupport();
    if (!isSupported) {
      const errorMessage =
        "本地URL处理不支持当前环境。请按以下步骤操作：\n" +
        "1. 确保在桌面版Obsidian中运行\n" +
        "2. 安装playwright: npm install playwright\n" +
        "3. 安装浏览器: npx playwright install chromium\n" +
        "4. 重启Obsidian";
      throw new Error(errorMessage);
    }
    return this.playwrightModule;
  }

  private async initBrowser(): Promise<any> {
    if (!this.browser) {
      const playwright = await this.initPlaywright();
      try {
        logInfo("Playwright module structure:", Object.keys(playwright));

        if (!playwright.chromium) {
          throw new Error("Chromium browser not available in playwright module");
        }

        this.browser = await playwright.chromium.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu",
            "--disable-blink-features=AutomationControlled",
            "--disable-features=VizDisplayCompositor",
            "--disable-web-security",
            "--disable-extensions-file-access-check",
            "--disable-extensions-http-throttling",
            "--disable-sync",
          ],
        });

        logInfo("Browser launched successfully for URL processing");
      } catch (error) {
        console.error("Browser launch error:", error);
        throw new Error(
          `无法启动浏览器进行URL处理: ${error.message}。请确保已安装Chromium: npx playwright install chromium`
        );
      }
    }
    return this.browser;
  }

  async initialize(): Promise<void> {
    await this.initBrowser();
  }

  async extractContent(url: string): Promise<LocalUrl4llmResponse> {
    try {
      // 检查是否支持本地处理
      const isSupported = await this.isLocalUrlProcessingSupported();
      if (!isSupported) {
        return {
          content: "",
          title: "",
          url,
          success: false,
          error: `本地URL处理功能不可用。请安装playwright并重启Obsidian，或在设置中切换到远程URL处理。`,
        };
      }

      const browser = await this.initBrowser();
      const page = await browser.newPage();
      let result: LocalUrl4llmResponse | null = null;

      try {
        // 检查 page 对象的 API 可用性
        logInfo("Page object methods:", Object.getOwnPropertyNames(page.__proto__));
        logInfo("Has setUserAgent:", typeof page.setUserAgent);
        logInfo("Has goto:", typeof page.goto);
        logInfo("Has setViewportSize:", typeof page.setViewportSize);

        // 尝试设置 User Agent（如果可用）
        try {
          if (typeof page.setUserAgent === "function") {
            await page.setUserAgent(this.userAgent);
            logInfo("User agent set successfully");
          } else if (typeof page.setExtraHTTPHeaders === "function") {
            await page.setExtraHTTPHeaders({
              "User-Agent": this.userAgent,
            });
            logInfo("User agent set via extra headers");
          } else {
            logInfo(
              "Neither setUserAgent nor setExtraHTTPHeaders available, skipping user agent setup"
            );
          }
        } catch (uaError) {
          logInfo("Failed to set user agent:", uaError.message);
          // 继续执行，不要因为用户代理设置失败而终止
        }

        // 尝试设置视口大小（如果可用）
        try {
          if (typeof page.setViewportSize === "function") {
            await page.setViewportSize({ width: 1920, height: 1080 });
            logInfo("Viewport size set successfully");
          } else if (typeof page.setViewport === "function") {
            await page.setViewport({ width: 1920, height: 1080 });
            logInfo("Viewport set via alternative method");
          } else {
            logInfo("Viewport setting not available, using default");
          }
        } catch (viewportError) {
          logInfo("Failed to set viewport:", viewportError.message);
          // 继续执行，不要因为视口设置失败而终止
        }

        logInfo(`Extracting content from URL: ${url}`);

        // Navigate to the URL
        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: this.timeout,
        });

        // 尝试等待页面加载（如果可用）
        try {
          if (typeof page.waitForLoadState === "function") {
            await page.waitForLoadState("networkidle");
            logInfo("Page load state waited successfully");
          } else {
            // 如果没有 waitForLoadState，使用简单的延迟
            await new Promise((resolve) => setTimeout(resolve, 2000));
            logInfo("Used fallback delay for page loading");
          }
        } catch (loadStateError) {
          logInfo("Failed to wait for load state:", loadStateError.message);
          // 继续执行
        }

        // Extract title and content using Readability if available
        const { title, content } = await this.extractContentWithReadability(page, url);

        logInfo(`Successfully extracted ${content.length} characters from ${url}`);

        result = {
          content: this._cleanContent(content),
          title,
          url,
          success: true,
        };

        return result;
      } finally {
        if (page) {
          try {
            await page.close();
            logInfo("Browser page closed after delay");
          } catch (closeError) {
            logInfo("Failed to close page:", closeError.message);
          }
        }
      }
    } catch (error) {
      logInfo(`Error extracting content from ${url}: ${error}`);

      // 提供用户友好的错误信息
      let userFriendlyError = String(error);
      if (error.message.includes("setUserAgent") || error.message.includes("setViewportSize")) {
        userFriendlyError = `Playwright API兼容性问题。可能需要更新playwright版本或使用不同的浏览器引擎。`;
      } else if (error.message.includes("Timeout") || error.message.includes("timeout")) {
        userFriendlyError = `网页加载超时 (${this.timeout / 1000}秒)。可能的原因：网络连接问题或网站响应缓慢。`;
      } else if (error.message.includes("net::ERR_")) {
        userFriendlyError = `网络错误：无法访问该URL。请检查网址是否正确或网络连接。`;
      } else if (error.message.includes("playwright") || error.message.includes("Playwright")) {
        userFriendlyError = `本地URL处理环境未正确配置。请安装playwright: npm install playwright && npx playwright install chromium`;
      }

      return {
        content: "",
        title: "",
        url,
        success: false,
        error: userFriendlyError,
      };
    }
  }

  // 添加专门处理数学公式的函数
  private extractMathFormulas(html: string): {
    html: string;
    formulas: { type: string; content: string; id: string }[];
  } {
    const formulas: { type: string; content: string; id: string }[] = [];
    let processedHtml = html;

    // 提取所有<script type="math/tex">内容
    const inlineRegex =
      /<script\s+type=["']math\/tex["']\s*(?:id=["']([^"']+)["'])?\s*>([\s\S]*?)<\/script>/gi;
    processedHtml = processedHtml.replace(inlineRegex, (match, id, content) => {
      const uniqueId = id || `inline-math-${formulas.length}`;
      formulas.push({ type: "inline", content: content.trim(), id: uniqueId });
      return `<span data-math-formula="${uniqueId}"></span>`;
    });

    // 提取所有<script type="math/tex; mode=display">内容
    const displayRegex =
      /<script\s+type=["']math\/tex;\s*mode=display["']\s*(?:id=["']([^"']+)["'])?\s*>([\s\S]*?)<\/script>/gi;
    processedHtml = processedHtml.replace(displayRegex, (match, id, content) => {
      const uniqueId = id || `display-math-${formulas.length}`;
      formulas.push({ type: "display", content: content.trim(), id: uniqueId });
      return `<div data-math-formula="${uniqueId}"></div>`;
    });

    return { html: processedHtml, formulas };
  }

  // 更新清理内容的方法，以更好地处理LaTeX格式
  private _cleanContent(content: string): string {
    if (!content) return "";

    // 查找并提取所有LaTeX格式
    const latexExtract = {
      // 提取\begin{equation}...\end{equation}等环境
      environments: [] as { original: string; placeholder: string }[],
      // 提取行内公式$...$
      inlineMath: [] as { original: string; placeholder: string }[],
      // 提取行间公式$$...$$
      displayMath: [] as { original: string; placeholder: string }[],
    };

    // 提取LaTeX环境
    let processedContent = content;
    let envCount = 0;
    const envRegex = /\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}/g;
    processedContent = processedContent.replace(envRegex, (match) => {
      const placeholder = `%%LATEX_ENV_${envCount++}%%`;
      latexExtract.environments.push({ original: match, placeholder });
      return placeholder;
    });

    // 提取行内公式 - 需要小心处理嵌套情况
    let inlineCount = 0;
    const inlineRegex = /\$([^\$\n]+?)\$/g;
    processedContent = processedContent.replace(inlineRegex, (match, formula) => {
      const placeholder = `%%INLINE_MATH_${inlineCount++}%%`;
      latexExtract.inlineMath.push({ original: match, placeholder });
      return placeholder;
    });

    // 提取行间公式 - 需要处理多行情况
    let displayCount = 0;
    const displayRegex = /\$\$([\s\S]+?)\$\$/g;
    processedContent = processedContent.replace(displayRegex, (match, formula) => {
      const placeholder = `%%DISPLAY_MATH_${displayCount++}%%`;
      latexExtract.displayMath.push({ original: match, placeholder });
      return placeholder;
    });

    // 进行常规清理
    processedContent = processedContent
      .replace(/[ \t]+/g, " ")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\n(#{1,6})\s*/g, "\n$1 ")
      .trim();

    // 恢复所有LaTeX内容
    // 先恢复环境
    latexExtract.environments.forEach((item) => {
      processedContent = processedContent.replace(item.placeholder, item.original);
    });

    // 恢复行间公式
    latexExtract.displayMath.forEach((item) => {
      processedContent = processedContent.replace(item.placeholder, item.original);
    });

    // 恢复行内公式
    latexExtract.inlineMath.forEach((item) => {
      processedContent = processedContent.replace(item.placeholder, item.original);
    });

    return processedContent.substring(0, 100000);
  }

  // 新增: 将HTML内容转换为Markdown的方法
  private convertHtmlToMarkdown(html: string): string {
    try {
      // 首先处理MathJax内容
      const htmlWithProcessedMath = this.extractMathJaxContent(html);
      const latexCleaner = new LatexCleaner();

      // 预处理内容，修复混合LaTeX显示问题
      let preprocessedHtml = htmlWithProcessedMath;
      preprocessedHtml = preprocessedHtml.replace(
        /([A-Za-z]+)([A-Za-z])\\?[_^]\{([^}]+)\}/g,
        (match, prefix1, prefix2, subscript) => {
          // 检测并修复混合显示的情况
          if (prefix1 && prefix2 && prefix1.endsWith(prefix2)) {
            // 保留正确的LaTeX部分
            return prefix2 + (match.includes("_") ? "_{" : "^{") + subscript + "}";
          }
          return match;
        }
      );

      const turndownService = new TurndownService({
        headingStyle: "atx",
        codeBlockStyle: "fenced",
        emDelimiter: "*",
      });

      // 配置turndown以更好地处理各种HTML元素
      turndownService.addRule("removeEmptyParagraphs", {
        filter: (node) => {
          return node.nodeName === "P" && node.textContent?.trim() === "";
        },
        replacement: () => "",
      });

      // 添加对LaTeX公式的支持
      // 行内LaTeX公式
      turndownService.addRule("inlineMath", {
        filter: (node, options) => {
          return (
            node.nodeName === "SPAN" &&
            (node.classList?.contains("math") ||
              node.classList?.contains("MathJax_Preview") ||
              node.classList?.contains("math-inline") ||
              (node as Element).getAttribute("data-math-type") === "inline")
          );
        },
        replacement: (content, node) => {
          // 尝试获取原始LaTeX内容
          const latexContent =
            (node as Element).getAttribute("data-latex") ||
            (node as Element).getAttribute("data-formula") ||
            content.trim();
          return `$${latexContent}$`;
        },
      });

      // 块级LaTeX公式
      turndownService.addRule("displayMath", {
        filter: (node, options) => {
          return (
            node.nodeName === "DIV" &&
            (node.classList?.contains("math") ||
              node.classList?.contains("MathJax_Display") ||
              node.classList?.contains("math-block") ||
              (node as Element).getAttribute("data-math-type") === "display")
          );
        },
        replacement: (content, node) => {
          // 尝试获取原始LaTeX内容
          const latexContent =
            (node as Element).getAttribute("data-latex") ||
            (node as Element).getAttribute("data-formula") ||
            content.trim();
          return `\n\n$$${latexContent}$$\n\n`;
        },
      });

      // 保留表格格式
      turndownService.keep(["table", "tr", "td", "th"]);

      // 添加特殊规则处理可能被错误渲染的LaTeX
      turndownService.addRule("fixMixedLatexDisplay", {
        filter: (node) => {
          // 检测是否包含可能是混合LaTeX显示的文本
          const text = node.textContent || "";
          return (
            /([A-Za-z]+)([A-ZaZ])[_^]\{/.test(text) &&
            !node.classList?.contains("protected-inline-math") &&
            !node.classList?.contains("protected-display-math")
          );
        },
        replacement: (content) => {
          // 修复混合显示
          return latexCleaner.fixMixedLatexDisplay(content);
        },
      });

      // 添加对LaTeX环境的特殊保护
      let protectedHtml = preprocessedHtml;

      // 保护\begin{...}...\end{...}格式的LaTeX环境
      protectedHtml = protectedHtml.replace(/\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}/g, (match) => {
        return `<div class="protected-latex-env">${match.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
      });

      // 保护已有的 $...$ 格式的行内公式
      protectedHtml = protectedHtml.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
        return `<span class="protected-inline-math">${formula.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
      });

      // 保护已有的 $$...$$ 格式的块级公式
      protectedHtml = protectedHtml.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
        return `<div class="protected-display-math">${formula.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
      });

      // 转换为Markdown
      let markdown = turndownService.turndown(protectedHtml);

      // 恢复保护的环境和公式
      markdown = markdown.replace(
        /<div class="protected-latex-env">([\s\S]+?)<\/div>/g,
        (match, content) => {
          return this.decodeHtmlEntities(content);
        }
      );

      // 恢复保护的公式
      markdown = markdown.replace(
        /<span class="protected-inline-math">([\s\S]+?)<\/span>/g,
        "$$$1$$"
      );
      markdown = markdown.replace(
        /<div class="protected-display-math">([\s\S]+?)<\/div>/g,
        "$$$$1$$$$"
      );

      // 对LaTeX进行后处理，修复格式问题
      markdown = this.postProcessLaTeX(markdown);

      // 确保所有LaTeX公式被$符号包围
      markdown = latexCleaner.ensureLatexDelimiters(markdown);

      // 最后一次清理，确保没有多余的反斜杠
      markdown = markdown.replace(/\$([^$]+)\$/g, (match, formula) => {
        return `$${latexCleaner.cleanLatex(formula)}$`;
      });

      markdown = markdown.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
        return `$$${latexCleaner.cleanLatex(formula)}$$`;
      });

      return markdown;
    } catch (error) {
      logInfo("Error converting HTML to Markdown:", error.message);
      return html;
    }
  }

  // 添加LaTeX后处理函数
  private postProcessLaTeX(markdown: string): string {
    // 修复可能存在的LaTeX格式问题
    return (
      markdown
        // 修复缺失的$符号
        .replace(/([^$])(\\[a-zA-Z]+\{[^}]+\})([^$])/g, (match, before, latex, after) => {
          // 仅处理确定为LaTeX命令的情况
          if (/(\\mathbb|\\mathcal|\\frac|\\sum|\\int|\\prod)/.test(latex)) {
            return `${before}$${latex}$${after}`;
          }
          return match;
        })
        // 修复上下标缺失$的情况
        .replace(
          /([^$])([A-Za-z][_^]\{[^}]+\})([^$])/g,
          (match, before, latex, after) => `${before}$${latex}$${after}`
        )
        // 修复多余的反斜杠
        .replace(
          /\$([^$]*?)\\\\([_^])([^$]*?)\$/g,
          (match, before, symbol, after) => `$${before}\\${symbol}${after}$`
        )
        // 修复嵌套的$符号
        .replace(/\$([^$]*?)\$([^$]*?)\$([^$]*?)\$/g, (match) =>
          match.replace(/\$([^$]*?)\$([^$]*?)\$/g, "$1$2")
        )
        // 确保内联公式前后有空格
        .replace(/([^\s$])\$/g, "$1 $")
        .replace(/\$([^\s$])/g, "$ $1")
    );
  }

  // 专门处理MathJax格式的LaTeX提取
  private extractMathJaxContent(html: string): string {
    try {
      // 提取script标签中的原始LaTeX
      let processedHtml = html;

      // 处理行间公式 (display mode)
      const displayMathRegex =
        /<script\s+type=['"]math\/tex;\s*mode=display['"]\s*(?:id=['"][^'"]+['"])?\s*>([\s\S]*?)<\/script>/gi;
      processedHtml = processedHtml.replace(displayMathRegex, (match, latexContent) => {
        // 去除可能的HTML转义
        const decodedContent = this.decodeHtmlEntities(latexContent.trim());
        // 去除多余的转义符号
        const cleanedContent = decodedContent.replace(/\\\\(?=[[\],])/g, "\\");
        return `\n\n$$${cleanedContent}$$\n\n`;
      });

      // 处理行内公式
      const inlineMathRegex =
        /<script\s+type=['"]math\/tex['"](?:\s+id=['"][^'"]+['"])?\s*>([\s\S]*?)<\/script>/gi;
      processedHtml = processedHtml.replace(inlineMathRegex, (match, latexContent) => {
        // 去除可能的HTML转义
        const decodedContent = this.decodeHtmlEntities(latexContent.trim());
        // 去除多余的转义符号
        const cleanedContent = decodedContent.replace(/\\\\(?=[[\],])/g, "\\");
        return `$${cleanedContent}$`;
      });

      // 扫描页面中可能存在的裸露LaTeX内容（没有被$包围的）
      // 正则表达式匹配常见的LaTeX命令和环境
      const bareLatexRegex =
        /\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}|\\[a-zA-Z]+(?:\{[^}]*\})+|\\\[[^\]]*\\\]/g;
      processedHtml = processedHtml.replace(bareLatexRegex, (match) => {
        // 确保不是已经在$符号内的内容
        // 修改这里，不使用s标志，而是使用[\s\S]代替.以匹配任何字符包括换行符
        if (!/\$[\s\S]*?\$/.test(`$${match}$`)) {
          return `$${match}$`;
        }
        return match;
      });

      // 移除MathJax预览和渲染元素
      processedHtml = processedHtml.replace(
        /<span\s+class=['"]MathJax_Preview['"][^>]*>[\s\S]*?<\/span>/gi,
        ""
      );
      processedHtml = processedHtml.replace(
        /<div\s+class=['"]MathJax_Display['"][^>]*>[\s\S]*?<\/div>/gi,
        ""
      );
      processedHtml = processedHtml.replace(
        /<span\s+class=['"]MathJax(?:\s+MathJax_\w+)?['"][^>]*>[\s\S]*?<\/span>/gi,
        ""
      );

      // 额外处理：检测可能是混合显示的LaTeX（如"DnmD_{n}^{m}"）
      processedHtml = processedHtml.replace(
        /([A-Za-z]+)([A-ZaZ][_^]\{[^}]+\})/g,
        (match, prefix, latex) => {
          // 如果前缀包含LaTeX中的字母，可能是混合显示
          if (prefix.includes(latex.charAt(0))) {
            // 只保留实际的LaTeX部分
            return `$${latex}$`;
          }
          return match;
        }
      );

      return processedHtml;
    } catch (error) {
      logInfo("Error extracting MathJax content:", error.message);
      return html;
    }
  }

  // 解码HTML实体，恢复原始LaTeX字符
  private decodeHtmlEntities(text: string): string {
    // 基本HTML实体
    const entities: Record<string, string> = {
      "&lt;": "<",
      "&gt;": ">",
      "&amp;": "&",
      "&quot;": '"',
      "&#39;": "'",
      "&#x2019;": "\u2019", // 右单引号
      "&#x2018;": "\u2018", // 左单引号
      "&#x201C;": "\u201C", // 左双引号
      "&#x201D;": "\u201D", // 右双引号
      "&#x2026;": "\u2026", // 省略号
      "&hellip;": "\u2026", // 省略号
      "&mdash;": "\u2014", // 破折号
      "&ndash;": "\u2013", // 连接号
    };

    // 先用基本实体替换
    let decoded = text.replace(/&[^;]+;/g, (entity) => {
      return entities[entity] || entity;
    });

    // 然后处理LaTeX中常见的反斜杠转义问题
    decoded = decoded
      // 修复双反斜杠问题 (\\[ 应该是 \[)
      .replace(/\\\\(\[|\]|,)/g, "\\$1")
      // 修复转义的大括号 \{ 和 \}
      .replace(/\\\\(\{|\})/g, "\\$1")
      // 修复误转义的下标和上标
      .replace(/\\\\_/g, "\\_")
      .replace(/\\\\\\^/g, "\\^");

    return decoded;
  }

  private async extractContentWithReadability(
    page: Page,
    url: string
  ): Promise<{ title: string; content: string }> {
    try {
      // 先提取页面上的数学公式
      const mathExtractor = new MathJaxExtractor();
      const extractedFormulas = await mathExtractor.extractMathJaxFromPage(page);

      // 获取规则配置和提取器代码
      const ruleConfig = this.ruleManager.getRuleConfig(url);
      logInfo(`Selected rule: ${ruleConfig.name} for URL: ${url}`);

      // 先注入规则管理器和相关代码
      await page.evaluate(
        (params: { ruleConfig: any }) => {
          try {
            // 创建全局readabilityRuleManager对象
            window.readabilityRuleManager = {
              config: params.ruleConfig,

              extractContent: function (document: Document, url: string) {
                try {
                  // 寻找主要内容区域
                  for (const selector of this.config.contentSelectors) {
                    // 替换console.log为浏览器中可见的日志方法
                    console.warn(`Trying selector: ${selector}`); // 使用warn级别使日志更明显
                    const element = document.querySelector(selector);
                    if (element) {
                      console.warn(`Found element with selector: ${selector}`);
                      try {
                        // 克隆元素以便安全处理
                        const clone = element.cloneNode(true);

                        // 移除不需要的元素
                        this.config.unwantedSelectors.forEach((sel: string) => {
                          const elements = clone.querySelectorAll(sel);
                          elements.forEach((el: Element) => el.remove());
                        });

                        const content = clone.textContent || (clone as HTMLElement).innerText;
                        if (content && content.trim().length > 100) {
                          return {
                            title: document.title || "Unknown Title",
                            content: content,
                            success: true,
                          };
                        }
                      } catch (processingError) {
                        console.error(`Content processing failed:`, processingError);
                        continue;
                      }
                    }
                  }

                  // 如果没找到主要内容，使用body作为备选
                  const bodyClone = document.body.cloneNode(true) as HTMLElement;

                  // 移除不需要的元素
                  this.config.unwantedSelectors.forEach((selector: string) => {
                    const elements = bodyClone.querySelectorAll(selector);
                    elements.forEach((el: Element) => el.remove());
                  });

                  const bodyContent =
                    bodyClone.textContent || (bodyClone as HTMLElement).innerText || "";

                  return {
                    title: document.title || "Unknown Title",
                    content: bodyContent,
                    success: bodyContent.trim().length > 50,
                  };
                } catch (error) {
                  console.error("Extract content error:", error);
                  return {
                    title: document.title || "Unknown Title",
                    content: "",
                    success: false,
                    error: error.toString(),
                  };
                }
              },
            };
            return true;
          } catch (error) {
            console.error("Setup error:", error);
            return false;
          }
        },
        { ruleConfig }
      );

      logInfo("Rule-based extraction not available, using fallback methods");

      // 回退到原有的多策略提取方法
      const title = await this.extractTitle(page);
      let content = await this.extractReadableContent(page, true); // 获取HTML内容

      // 如果提取到公式，处理HTML内容中的MathJax
      if (extractedFormulas.length > 0) {
        content = mathExtractor.replaceMathJaxInHtml(content, extractedFormulas);
      }

      // 将HTML内容转换为Markdown
      let markdownContent = this.convertHtmlToMarkdown(content);

      // 使用LaTeX清理器进行额外处理
      const latexCleaner = new LatexCleaner();
      markdownContent = latexCleaner.ensureLatexDelimiters(markdownContent);

      return { title, content: markdownContent };
    } catch (error) {
      logInfo("Content extraction with rule system failed:", error.message);

      // 完全回退到原有方法
      const title = await this.extractTitle(page);
      const content = await this.extractReadableContent(page, true);

      // 将HTML内容转换为Markdown
      const markdownContent = this.convertHtmlToMarkdown(content);

      return { title, content: markdownContent };
    }
  }

  private async extractTitle(page: Page): Promise<string> {
    try {
      if (typeof page.title === "function") {
        return await page.title();
      } else {
        // 尝试通过 evaluate 获取标题
        return await page.evaluate(() => document.title || "");
      }
    } catch (titleError) {
      logInfo("Failed to extract title:", titleError.message);
      return "Unknown Title";
    }
  }

  private async extractReadableContent(page: Page, returnHtml: boolean = false): Promise<string> {
    // 首先尝试使用配置化的内容提取方法
    try {
      const currentUrl = await page.evaluate(() => window.location.href);
      const fallbackConfig = this.ruleManager.getFallbackConfig();

      // 使用规则系统进行内容提取，将参数打包成对象
      const content = await page.evaluate(
        (params: { config: any; returnHtml: boolean }) => {
          try {
            // 只尝试从主要内容选择器提取
            for (const selector of params.config.contentSelectors) {
              const element = document.querySelector(selector) as HTMLElement;
              if (element) {
                const clone = element.cloneNode(true) as HTMLElement;

                // 移除不需要的元素
                params.config.unwantedSelectors.forEach((sel: string) => {
                  const elements = clone.querySelectorAll(sel);
                  elements.forEach((el: Element) => el.remove());
                });

                if (params.returnHtml) {
                  return clone.outerHTML;
                }

                const content = clone.innerText || "";
                if (content.trim().length > 100) {
                  return content;
                }
              }
            }

            // 回退到body处理
            const bodyClone = document.body.cloneNode(true) as HTMLElement;
            params.config.unwantedSelectors.forEach((selector: string) => {
              const elements = bodyClone.querySelectorAll(selector);
              elements.forEach((el: Element) => el.remove());
            });

            return params.returnHtml ? bodyClone.outerHTML : bodyClone.innerText || "";
          } catch (error) {
            console.log("Fallback extraction failed:", error);
            return "";
          }
        },
        { config: fallbackConfig, returnHtml }
      );

      if (content && content.trim().length > 100) {
        return content;
      }
    } catch (error) {
      logInfo("Rule-based fallback extraction failed, using generic strategies");
    }

    // 最后的通用策略回退
    const strategies = [
      // Strategy 1: 简化的选择器策略
      async () => {
        return await page.evaluate((returnHtml) => {
          const selectors = [
            "article",
            "main",
            '[role="main"]',
            ".content",
            ".main-content",
            ".post-content",
            ".article-content",
          ];

          for (const selector of selectors) {
            const element = document.querySelector(selector) as HTMLElement;
            if (element && element.innerText && element.innerText.trim().length > 100) {
              return returnHtml ? element.outerHTML : element.innerText;
            }
          }
          return null;
        }, returnHtml);
      },

      // Strategy 2: 清理后的body内容
      async () => {
        return await page.evaluate((returnHtml) => {
          const bodyClone = document.body.cloneNode(true) as HTMLElement;
          const unwantedSelectors = [
            "script",
            "style",
            "nav",
            "header",
            "footer",
            ".navigation",
            ".sidebar",
            ".menu",
            ".ads",
          ];

          unwantedSelectors.forEach((selector) => {
            const elements = bodyClone.querySelectorAll(selector);
            elements.forEach((el: Element) => el.remove());
          });

          return returnHtml ? bodyClone.outerHTML : bodyClone.innerText || "";
        }, returnHtml);
      },

      // Strategy 3: 原始body内容
      async () => {
        return await page.evaluate((returnHtml) => {
          return returnHtml ? document.body?.outerHTML || "" : document.body?.innerText || "";
        }, returnHtml);
      },
    ];

    // 使用策略逐个尝试提取内容
    for (const strategy of strategies) {
      const result = await strategy();
      if (result && result.trim().length > 100) {
        return result;
      }
    }

    return "无法提取页面内容";
  }

  async close(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        logInfo("Browser closed successfully");
      } catch (error) {
        logInfo(`Error closing browser: ${error}`);
      }
    }
  }

  // 检查是否支持本地URL处理
  async isLocalUrlProcessingSupported(): Promise<boolean> {
    return await this.checkSupport();
  }

  // Static method for one-off extractions with better error handling
  static async extractUrl(url: string): Promise<LocalUrl4llmResponse> {
    const tool = LocalUrl4llmTool.getInstance();
    try {
      return await tool.extractContent(url);
    } catch (error) {
      logInfo(`Static URL extraction failed for ${url}: ${error}`);
      return {
        content: "",
        title: "",
        url,
        success: false,
        error: `URL处理失败: ${error.message}`,
      };
    } finally {
      // 注意：不要在这里关闭浏览器，因为使用单例模式
    }
  }

  // Enhanced batch processing with better error handling
  async extractMultipleUrls(urls: string[]): Promise<LocalUrl4llmResponse[]> {
    logInfo(`Processing ${urls.length} URLs locally`);

    if (urls.length === 0) {
      return [];
    }

    // 检查环境支持
    const isSupported = await this.isLocalUrlProcessingSupported();
    if (!isSupported) {
      return urls.map((url) => ({
        content: "",
        title: "",
        url,
        success: false,
        error: "本地URL处理功能不可用，请检查playwright安装",
      }));
    }

    const results: LocalUrl4llmResponse[] = [];

    // 并发处理，但限制并发数量避免资源过载
    const concurrencyLimit = 3;
    const chunks = [];
    for (let i = 0; i < urls.length; i += concurrencyLimit) {
      chunks.push(urls.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (url) => {
        try {
          return await this.extractContent(url);
        } catch (error) {
          return {
            content: "",
            title: "",
            url,
            success: false,
            error: String(error),
          };
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    const successCount = results.filter((r) => r.success).length;
    logInfo(`Successfully processed ${successCount}/${urls.length} URLs`);

    return results;
  }

  // 提供处理单个URL的用户友好方法
  async processUrlWithFeedback(url: string): Promise<string> {
    try {
      const result = await this.extractContent(url);

      if (!result.success) {
        return `无法处理URL: ${url}

**错误:** ${result.error || "未知错误"}

**建议:**
- 检查URL是否正确
- 确保网络连接正常
- 或在设置中切换到远程URL处理`;
      }

      return `从 ${url} 提取的内容:

**标题:** ${result.title}

**内容:**
${result.content}

---
*来源: ${url}*`;
    } catch (error) {
      return `URL处理遇到错误: ${error.message}

**URL:** ${url}

请尝试使用远程URL处理功能或稍后重试。`;
    }
  }

  // 添加方法来动态注册新规则
  registerCustomRule(rule: any): void {
    this.ruleManager.registerRule(rule);
    logInfo(`Registered custom rule: ${rule.name}`);
  }

  // 获取当前所有可用规则
  getAvailableRules(): any[] {
    return this.ruleManager.getAllRules();
  }

  // 根据URL预览将使用的规则
  previewRule(url: string): any {
    return this.ruleManager.selectRule(url);
  }
}

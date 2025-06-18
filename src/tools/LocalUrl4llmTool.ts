import { Browser, Page, chromium } from "playwright";
import { Notice } from "obsidian";
import { logInfo } from "@/logger";
import { ReadabilityRuleManager } from "@/readabilityRules/ReadabilityRuleManager";

export interface LocalUrl4llmResponse {
  content: string;
  title: string;
  url: string;
  success: boolean;
  error?: string;
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

        return {
          content: this.cleanContent(content),
          title,
          url,
          success: true,
        };
      } finally {
        try {
          await page.close();
        } catch (closeError) {
          logInfo("Failed to close page:", closeError.message);
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

  private async extractContentWithReadability(
    page: Page,
    url: string
  ): Promise<{ title: string; content: string }> {
    try {
      // 获取规则配置和提取器代码
      const ruleConfig = this.ruleManager.getRuleConfig(url);
      const extractorCode = this.ruleManager.getBrowserExtractorCode();

      logInfo(`Selected rule: ${ruleConfig.name} for URL: ${url}`);

      // 通过page.evaluate执行内容提取，将参数打包成对象避免"Too many arguments"错误
      const readabilityResult = await page.evaluate(
        (params) => {
          try {
            // 使用Function构造函数代替eval
            const executorFunc = new Function(params.extractorCode);
            executorFunc();

            // 使用RuleBasedExtractor进行内容提取
            const result = (window as any).RuleBasedExtractor.extractContent(
              document,
              params.config
            );
            if (result.success) {
              return {
                title: result.title || document.title,
                content: result.content,
                success: true,
              };
            }

            return { success: false };
          } catch (error) {
            console.log("Rule-based extraction failed:", error);
            return { success: false, error: error.message };
          }
        },
        { extractorCode, config: ruleConfig }
      );

      if (readabilityResult.success) {
        logInfo(`Content extracted successfully using rule: ${ruleConfig.name}`);
        return {
          title: readabilityResult.title || "Unknown Title",
          content: readabilityResult.content || "",
        };
      }

      logInfo("Rule-based extraction not available, using fallback methods");

      // 回退到原有的多策略提取方法
      const title = await this.extractTitle(page);
      const content = await this.extractReadableContent(page);

      return { title, content };
    } catch (error) {
      logInfo("Content extraction with rule system failed:", error.message);

      // 完全回退到原有方法
      const title = await this.extractTitle(page);
      const content = await this.extractReadableContent(page);

      return { title, content };
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

  private async extractReadableContent(page: Page): Promise<string> {
    // 首先尝试使用配置化的内容提取方法
    try {
      const currentUrl = await page.evaluate(() => window.location.href);
      const fallbackConfig = this.ruleManager.getFallbackConfig();
      const extractorCode = this.ruleManager.getBrowserExtractorCode();

      logInfo(`Using fallback extraction with config: ${fallbackConfig.name}`);

      // 使用规则系统进行内容提取，将参数打包成对象
      const content = await page.evaluate(
        (params) => {
          try {
            const executorFunc = new Function(params.extractorCode);
            executorFunc();

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

            return bodyClone.innerText || "";
          } catch (error) {
            console.log("Fallback extraction failed:", error);
            return "";
          }
        },
        { extractorCode, config: fallbackConfig }
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
        return await page.evaluate(() => {
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
              return element.innerText;
            }
          }
          return null;
        });
      },

      // Strategy 2: 清理后的body内容
      async () => {
        return await page.evaluate(() => {
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

          return bodyClone.innerText || "";
        });
      },

      // Strategy 3: 原始body内容
      async () => {
        return await page.evaluate(() => document.body?.innerText || "");
      },
    ];

    // Try each strategy until we get meaningful content
    for (const strategy of strategies) {
      try {
        const content = await strategy();
        if (content && content.trim().length > 100) {
          logInfo(`Content extraction strategy succeeded, length: ${content.length}`);
          return content;
        }
      } catch (strategyError) {
        logInfo(`Content extraction strategy failed: ${strategyError.message}`);
        continue;
      }
    }

    logInfo("All content extraction strategies failed");
    return "无法提取页面内容，可能是页面结构特殊或加载问题。";
  }

  private cleanContent(content: string): string {
    if (!content) return "";

    return (
      content
        // 保留LaTeX公式
        .replace(/\$\$([^$]+)\$\$/g, (match) => match) // 保留行间公式
        .replace(/\$([^$]+)\$/g, (match) => match) // 保留行内公式
        // 规范化空白字符，但保留重要的换行
        .replace(/[ \t]+/g, " ") // 多个空格/制表符合并为一个空格
        .replace(/\n[ \t]+/g, "\n") // 移除行首空白
        .replace(/[ \t]+\n/g, "\n") // 移除行尾空白
        // 保留段落分隔（双换行）
        .replace(/\n{3,}/g, "\n\n") // 多个换行合并为双换行
        // 保留标题格式
        .replace(/\n(#{1,6})\s*/g, "\n$1 ") // 规范化标题格式
        // 移除开头和结尾的空白
        .trim()
        // 限制内容长度以防止过载LLM
        .substring(0, 100000)
    ); // 增加长度限制以容纳更多学术内容
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

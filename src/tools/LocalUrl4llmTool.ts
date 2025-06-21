import { Browser, Page, chromium } from "playwright";
import { Notice } from "obsidian";
import { logInfo } from "@/logger";
import { ReadabilityRuleManager } from "@/readabilityRules/ReadabilityRuleManager";
import { url } from "inspector";
import TurndownService from "turndown";
import { log } from "console";
import { App } from "obsidian";
import { formatDateTime } from "@/utils";

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
  private browserCloseTimer: NodeJS.Timeout | null = null; // 浏览器延迟关闭定时器
  private readonly browserIdleTimeout = 60000; // 浏览器空闲后延迟关闭时间，默认60秒
  private app: App;

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
          //打开浏览器调试工具
          devtools: true,
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

        const { title, content } = await this.extractContentWithReadability(page, url);

        logInfo(`Extracted html content from ${url},title: ${title},content : ${content}`);

        // markdown转换
        const markdownContent = this.ruleManager.convertHtmlToMarkdown(content, url);
        result = {
          content: markdownContent,
          title: title,
          url: url,
          success: true,
        };

        // 将结果写入当前 vault 的文档中
        //await this.writeToVaultFile(markdownContent, title, url);
        // 弹窗提醒
        new Notice(`本地URL处理成功: ${title}`, 5000);

        return result;
      } finally {
        if (page) {
          try {
            // 等待一段时间后关闭页面
            logInfo("Waiting for 30 seconds before closing the page...");
            //await new Promise((resolve) => setTimeout(resolve, 30000));
            await page.close();
            logInfo("Browser page closed after delay");
            // 页面关闭后，设置浏览器延迟关闭
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

  private async extractContentWithReadability(
    page: Page,
    url: string
  ): Promise<{ title: string; content: string }> {
    try {
      // 获取规则配置和提取器代码
      const ruleConfig = this.ruleManager.getRuleConfig(url);
      logInfo(`Selected rule: ${ruleConfig.name} for URL: ${url}`);
      logInfo("Rule configuration:", ruleConfig);

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
                    console.warn(`Trying selector: ${selector}`);
                    const element = document.querySelector(selector);
                    if (element) {
                      console.warn(`Found element with selector: ${selector}`);
                      try {
                        // 克隆元素并确保类型正确
                        const clone = element.cloneNode(true) as Element;

                        // 移除不需要的元素
                        this.config.unwantedSelectors.forEach((sel: string) => {
                          try {
                            const elements = clone.querySelectorAll(sel);
                            elements.forEach((el: Element) => {
                              if (el.parentNode) {
                                el.parentNode.removeChild(el);
                              }
                            });
                          } catch (selectorError) {
                            console.warn(
                              `Failed to remove elements with selector ${sel}:`,
                              selectorError
                            );
                          }
                        });

                        const content = (clone as HTMLElement).innerHTML || clone.innerHTML;
                        if (content && content.trim().length > 100) {
                          console.warn(
                            `Successfully extracted content using selector: ${selector}`
                          );
                          return {
                            title: document.title || "Unknown Title",
                            content: content,
                            success: true,
                          };
                        }
                      } catch (processingError) {
                        console.error(
                          `Content processing failed for selector ${selector}:`,
                          processingError
                        );
                        continue;
                      }
                    }
                  }

                  // 如果没找到主要内容，使用body作为备选并应用过滤规则
                  console.warn("No content selectors matched, using body as fallback");
                  const bodyClone = document.body.cloneNode(true) as Element;

                  // 重要：也要对body应用过滤规则
                  this.config.unwantedSelectors.forEach((selector: string) => {
                    try {
                      const elements = bodyClone.querySelectorAll(selector);
                      elements.forEach((el: Element) => {
                        if (el.parentNode) {
                          el.parentNode.removeChild(el);
                        }
                      });
                    } catch (selectorError) {
                      console.warn(
                        `Failed to remove elements with selector ${selector} from body:`,
                        selectorError
                      );
                    }
                  });

                  const bodyContent = (bodyClone as HTMLElement).innerHTML || "";

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

      // 执行内容提取
      const extractionResult = await page.evaluate(() => {
        if (window.readabilityRuleManager) {
          return window.readabilityRuleManager.extractContent(document, window.location.href);
        }
        return null;
      });

      if (extractionResult && extractionResult.success) {
        logInfo(`Rule-based extraction successful for ${url}`);
        return {
          title: extractionResult.title,
          content: extractionResult.content,
        };
      }

      logInfo("Rule-based extraction failed or returned no content, using fallback methods");

      // 回退到原有的多策略提取方法
      const title = await this.extractTitle(page);
      const content = await page.evaluate(() => {
        return document.body.innerHTML || "";
      });

      return { title, content };
    } catch (error) {
      logInfo("Content extraction with rule system failed:", error.message);

      // 完全回退到原有方法
      const title = await this.extractTitle(page);
      return { title, content: "parse error" };
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

  private async writeToVaultFile(
    content: string,
    title: string,
    url: string,
    app: App
  ): Promise<void> {
    try {
      // 获取当前的APP
      const vault = app.vault;
      const title_normalized = title
        .replace(/[^a-zA-Z0-9]/g, "_")
        .toLowerCase()
        .replace(":", "_")
        .replace("?", "_");
      const fileName = `copilot-${Date.now()}-${title_normalized}.md`;
      const filePath = `Copilot Logs/${fileName}`;

      // 确保目录存在
      const folderPath = "Copilot Logs";
      const folder = vault.getAbstractFileByPath(folderPath);
      if (!folder) {
        await vault.createFolder(folderPath);
      }

      const current_date = formatDateTime(new Date()).display;

      // 格式化内容
      const formattedContent = `
Created: ${current_date}
URL: ${url}
Title: ${title}
${content}
`;

      // 创建文件
      await vault.create(filePath, formattedContent);
      logInfo(`Enhanced user message saved to: ${filePath}`);
    } catch (error) {
      console.error("Failed to write enhanced user message to vault:", error);
    }
  }
}

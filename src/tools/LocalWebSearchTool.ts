export interface LocalWebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface LocalWebSearchResponse {
  results: LocalWebSearchResult[];
  searchQuery: string;
}

export class LocalWebSearchTool {
  private static instance: LocalWebSearchTool;
  private browser: any = null;
  private playwrightModule: any = null;
  private isSupported: boolean | null = null;

  static getInstance(): LocalWebSearchTool {
    if (!LocalWebSearchTool.instance) {
      LocalWebSearchTool.instance = new LocalWebSearchTool();
    }
    return LocalWebSearchTool.instance;
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
      console.log("Environment check:", {
        isElectron,
        processVersions: process?.versions,
        nodeVersion: process?.version,
        platform: process?.platform,
        hasRequire: typeof require !== "undefined",
      });

      if (!isElectron) {
        console.warn("Local web search requires Electron environment");
        this.isSupported = false;
        return false;
      }

      // 检查playwright是否在package.json中安装
      try {
        const path = require("path");
        const fs = require("fs");

        // 获取当前工作目录和可能的插件路径
        const cwd = process.cwd();
        console.log("Current working directory:", cwd);

        // 尝试多个可能的插件根目录
        const possibleRoots = [
          // 开发环境路径
          "/Users/xmatrix/Documents/fun_project/obsidian-copilot",
          // 相对路径（从当前文件位置推算）
          path.join(__dirname, "../../../"),
          path.join(__dirname, "../../"),
          // 当前工作目录
          cwd,
          // 如果在Obsidian插件目录中
          path.join(cwd, ".obsidian/plugins/obsidian-copilot"),
        ];

        let playwrightExists = false;

        for (const root of possibleRoots) {
          const packageJsonPath = path.join(root, "package.json");
          const playwrightModulePath = path.join(root, "node_modules/playwright");

          console.log(`Checking root: ${root}`);
          console.log(`Package.json exists: ${fs.existsSync(packageJsonPath)}`);
          console.log(`Playwright module exists: ${fs.existsSync(playwrightModulePath)}`);

          if (fs.existsSync(packageJsonPath) && fs.existsSync(playwrightModulePath)) {
            playwrightExists = true;
            console.log(`Found plugin root with playwright: ${root}`);
            break;
          }
        }

        if (!playwrightExists) {
          console.warn("Playwright module not found in any expected location");
          console.warn("Please ensure playwright is installed in the plugin directory:");
          console.warn(
            "cd /Users/xmatrix/Documents/fun_project/obsidian-copilot && npm install playwright"
          );
        }
      } catch (fsError) {
        console.error("File system check failed:", fsError);
      }

      // 尝试导入playwright并检查可用的浏览器
      console.log("Attempting to import playwright...");

      // 使用require作为备用方案
      let playwrightModule;
      try {
        playwrightModule = await import("playwright");
      } catch (importError) {
        console.log("Dynamic import failed, trying require:", importError.message);
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
            console.log("Trying development path import:", devPlaywrightPath);
            playwrightModule = require(devPlaywrightPath);
          } catch (directError) {
            console.error("Development path import failed:", directError.message);
            throw new Error("Playwright module not found. Please install: npm install playwright");
          }
        }
      }

      this.playwrightModule = playwrightModule;
      console.log("Playwright imported successfully");

      // 检查chromium是否可用
      try {
        const { chromium } = this.playwrightModule;
        console.log("Checking chromium availability...");

        // 尝试获取chromium可执行文件路径
        const executablePath = chromium.executablePath();
        console.log("Chromium executable path:", executablePath);

        // 检查文件是否存在
        const fs = require("fs");
        const chromiumExists = fs.existsSync(executablePath);
        console.log("Chromium exists:", chromiumExists);

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
      console.log("Playwright environment check passed");
      return true;
    } catch (error) {
      console.error("Playwright environment check failed:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      // 提供详细的安装指导
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
        "本地网页搜索不支持当前环境。请按以下步骤操作：\n" +
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
        console.log("Playwright module structure:", Object.keys(playwright));
        console.log("Chromium object:", typeof playwright.chromium);

        if (!playwright.chromium) {
          throw new Error("Chromium browser not available in playwright module");
        }

        this.browser = await playwright.chromium.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--no-first-run",
            "--no-default-browser-check",
            // 添加更多反检测参数
            "--disable-blink-features=AutomationControlled",
            "--disable-features=VizDisplayCompositor",
            "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "--disable-web-security",
            "--disable-extensions-file-access-check",
            "--disable-extensions-http-throttling",
            "--disable-sync",
          ],
        });

        console.log("Browser launched successfully");
      } catch (error) {
        console.error("Browser launch error:", error);
        throw new Error(
          `无法启动浏览器: ${error.message}。请确保已安装Chromium: npx playwright install chromium`
        );
      }
    }
    return this.browser;
  }

  async search(query: string, maxResults: number = 10): Promise<LocalWebSearchResponse> {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      try {
        // 检查page对象的API
        console.log("Page object methods:", Object.getOwnPropertyNames(page.__proto__));
        console.log("Has setUserAgent:", typeof page.setUserAgent);
        console.log("Has goto:", typeof page.goto);
        console.log("Has waitForSelector:", typeof page.waitForSelector);

        // 尝试不同的用户代理设置方法
        try {
          if (typeof page.setUserAgent === "function") {
            await page.setUserAgent(
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            );
          } else if (typeof page.setExtraHTTPHeaders === "function") {
            await page.setExtraHTTPHeaders({
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            });
          } else {
            console.warn("Neither setUserAgent nor setExtraHTTPHeaders available");
          }
        } catch (uaError) {
          console.warn("Failed to set user agent:", uaError.message);
        }

        // 使用Google搜索
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${maxResults}&hl=en`;
        console.log("Navigating to:", searchUrl);

        await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

        // 等待页面加载并尝试多个可能的选择器
        console.log("Waiting for page to load...");

        // 先等待一下让页面有时间渲染
        await page.waitForTimeout(2000);

        // 尝试多个可能的搜索结果容器选择器
        const possibleSelectors = ["#search", "#rso", "[data-ved]", ".g", "#center_col", "body"];

        let searchContainer = null;
        for (const selector of possibleSelectors) {
          try {
            await page.waitForSelector(selector, { timeout: 3000 });
            searchContainer = selector;
            console.log(`Found search container with selector: ${selector}`);
            break;
          } catch {
            console.log(`Selector ${selector} not found, trying next...`);
          }
        }

        if (!searchContainer) {
          // 如果找不到搜索容器，记录页面内容用于调试
          const pageContent = await page.content();
          const pageTitle = await page.title();
          const pageUrl = page.url();

          console.log("=== 页面调试信息 ===");
          console.log("Page title:", pageTitle);
          console.log("Page URL:", pageUrl);
          console.log("Page content length:", pageContent.length);
          console.log("Page content preview (first 1000 chars):", pageContent.substring(0, 1000));

          // 检查页面中是否有特定的元素
          const hasSearchResults = await page.evaluate(() => {
            const elements = {
              search: document.querySelector("#search"),
              rso: document.querySelector("#rso"),
              centerCol: document.querySelector("#center_col"),
              bodyText: document.body?.textContent?.substring(0, 200),
              allDivs: document.querySelectorAll("div").length,
              allLinks: document.querySelectorAll("a").length,
              hasGoogleLogo: !!document.querySelector('[alt*="Google"]'),
              hasRecaptcha: !!document.querySelector('[src*="recaptcha"]'),
              hasErrorMsg:
                document.body?.textContent?.includes("error") ||
                document.body?.textContent?.includes("blocked"),
              // 检测Google反爬虫页面的特征
              hasJsWarning: document.body?.textContent?.includes("enable javascript"),
              hasUnusualTraffic: document.body?.textContent?.includes("unusual traffic"),
              hasCaptchaForm: !!document.querySelector("#captcha-form"),
              hasSubmitCallback: document.body?.textContent?.includes("submitCallback"),
            };
            return elements;
          });

          console.log("Page element analysis:", hasSearchResults);

          // 检测是否被Google反爬虫机制阻止
          if (
            hasSearchResults.hasJsWarning ||
            hasSearchResults.hasUnusualTraffic ||
            hasSearchResults.hasCaptchaForm
          ) {
            console.warn("Detected Google anti-bot protection");
            throw new Error("被Google反爬虫机制阻止，需要人工验证。建议使用远程搜索或稍后重试。");
          }

          // 截图保存（如果可能）
          try {
            const screenshot = await page.screenshot({ type: "png" });
            console.log("Screenshot captured, size:", screenshot.length, "bytes");
            // 这里可以保存截图到文件或转换为base64
          } catch (screenshotError) {
            console.log("Failed to capture screenshot:", screenshotError.message);
          }

          throw new Error("未找到搜索结果容器，可能被Google阻止或页面结构改变");
        }

        // 提取搜索结果前先分析页面结构
        const pageAnalysis = await page.evaluate(() => {
          const analysis = {
            totalElements: document.querySelectorAll("*").length,
            searchDivs: document.querySelectorAll("#search .g").length,
            rsoDivs: document.querySelectorAll("#rso .g").length,
            dataVedElements: document.querySelectorAll("[data-ved]").length,
            gClassElements: document.querySelectorAll(".g").length,
            allH3s: document.querySelectorAll("h3").length,
            allLinks: document.querySelectorAll("a[href]").length,
            pageText: document.body?.textContent?.substring(0, 300),
          };
          console.log("Page structure analysis:", analysis);
          return analysis;
        });

        console.log("Page analysis before extraction:", pageAnalysis);

        // 提取搜索结果
        const results = await page.evaluate((containerSelector: string) => {
          const searchResults: any[] = [];

          // 尝试多种搜索结果选择器
          const resultSelectors = ["#search .g", "#rso .g", "[data-ved]", ".g"];

          let resultElements: NodeListOf<Element> | null = null;
          for (const selector of resultSelectors) {
            resultElements = document.querySelectorAll(selector);
            if (resultElements.length > 0) {
              console.log(`Found ${resultElements.length} results with selector: ${selector}`);
              break;
            }
          }

          if (!resultElements || resultElements.length === 0) {
            console.log("No search results found with any selector");
            return [];
          }

          resultElements.forEach((element: any, index) => {
            try {
              const titleElement =
                element.querySelector("h3") ||
                element.querySelector("h2") ||
                element.querySelector("h1");
              const linkElement = element.querySelector("a[href]");

              // 尝试多种摘要选择器
              const snippetElement =
                element.querySelector("[data-sncf]") ||
                element.querySelector(".VwiC3b") ||
                element.querySelector(".s") ||
                element.querySelector("[data-content-feature]") ||
                element.querySelector(".st") ||
                element.querySelector("[data-ved] + div") ||
                element.querySelector("span");

              if (titleElement && linkElement) {
                const title = titleElement.textContent?.trim() || "";
                const url = linkElement.href;
                const snippet = snippetElement?.textContent?.trim() || "";

                if (title && url && !url.includes("javascript:") && !url.includes("#")) {
                  // 过滤掉Google内部链接
                  const urlObj = new URL(url);
                  if (
                    !urlObj.hostname.includes("google.com") ||
                    urlObj.pathname.startsWith("/url?")
                  ) {
                    searchResults.push({ title, url, snippet: snippet || "无摘要" });
                  }
                }
              }
            } catch (error) {
              console.error("Error extracting search result:", error);
            }
          });

          return searchResults;
        }, searchContainer);

        console.log(`Found ${results.length} search results`);

        return {
          results: results.slice(0, maxResults),
          searchQuery: query,
        };
      } finally {
        await page.close();
      }
    } catch (error) {
      console.error("Error performing local web search:", error);

      // 提供更详细的错误信息
      if (error.message.includes("Timeout") || error.message.includes("waitForSelector")) {
        throw new Error(`Google搜索页面加载超时。可能的原因：
1. 网络连接问题
2. 被Google反爬虫机制阻止
3. 页面结构变化

建议：
- 检查网络连接
- 稍后重试
- 或使用远程搜索功能`);
      }

      throw new Error(`本地网页搜索失败: ${error.message}`);
    }
  }

  async searchAndExtractContent(query: string, maxResults: number = 5): Promise<string> {
    try {
      // 首先检查是否支持本地搜索
      const isSupported = await this.isLocalSearchSupported();
      if (!isSupported) {
        return `本地网页搜索功能不可用。

**原因：** Playwright模块未安装或不兼容当前环境。

**解决方案：**
1. 在Obsidian插件目录中安装playwright：
   \`\`\`
   cd /Users/xmatrix/Documents/fun_project/obsidian-copilot
   npm install playwright
   npx playwright install chromium
   \`\`\`

2. 或者在插件设置中切换到远程网页搜索功能。

3. 重启Obsidian后重试。

**查询：** "${query}"`;
      }

      const searchResponse = await this.search(query, maxResults);

      if (searchResponse.results.length === 0) {
        return `没有找到关于"${query}"的搜索结果。`;
      }

      // 格式化搜索结果
      let content = `基于网页搜索"${query}"的结果:\n\n`;

      for (let i = 0; i < searchResponse.results.length; i++) {
        const result = searchResponse.results[i];
        content += `${i + 1}. **${result.title}**\n`;
        content += `   ${result.snippet}\n`;
        content += `   来源: ${result.url}\n\n`;
      }

      // 添加引用链接
      content += "\n#### Sources\n";
      searchResponse.results.forEach((result, index) => {
        try {
          const domain = new URL(result.url).hostname;
          content += `- [${result.title} - ${domain}](${result.url})\n`;
        } catch {
          // 如果URL无效，仍然添加但不显示域名
          content += `- [${result.title}](${result.url})\n`;
        }
      });

      return content;
    } catch (error) {
      console.error("Local web search error:", error);

      // 根据错误类型提供不同的用户友好消息
      if (error.message.includes("playwright") || error.message.includes("Playwright")) {
        return `本地网页搜索暂时不可用。

**错误详情：** ${error.message}

**建议：**
- 请在插件设置中切换到远程搜索
- 或按照上述说明安装playwright

**查询：** "${query}"`;
      }

      if (error.message.includes("无法启动浏览器")) {
        return `浏览器启动失败。

**可能原因：**
- Chromium未正确安装
- 系统权限不足
- 资源占用过高

**建议：**
- 运行：\`npx playwright install chromium\`
- 重启Obsidian
- 或使用远程搜索功能

**查询：** "${query}"`;
      }

      // 其他错误
      return `网页搜索遇到错误：${error.message}

**查询：** "${query}"

请尝试使用远程搜索功能或稍后重试。`;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error) {
        console.error("Error closing browser:", error);
      }
      this.browser = null;
    }
  }

  // 检查是否支持本地搜索
  async isLocalSearchSupported(): Promise<boolean> {
    return await this.checkSupport();
  }
}

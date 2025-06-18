declare module "playwright" {
  export interface Browser {
    newPage(): Promise<Page>;
    close(): Promise<void>;
    isConnected(): boolean;
  }

  export interface Page {
    goto(
      url: string,
      options?: {
        waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
        timeout?: number;
      }
    ): Promise<void>;
    waitForSelector(
      selector: string,
      options?: {
        timeout?: number;
        state?: "attached" | "detached" | "visible" | "hidden";
      }
    ): Promise<ElementHandle | null>;
    evaluate<T>(fn: () => T): Promise<T>;
    evaluate<T, A extends any[]>(fn: (...args: A) => T, ...args: A): Promise<T>;
    close(): Promise<void>;
    setUserAgent?(userAgent: string): Promise<void>;
    setViewportSize?(size: { width: number; height: number }): Promise<void>;
    setViewport?(viewport: { width: number; height: number }): Promise<void>;
    setExtraHTTPHeaders?(headers: Record<string, string>): Promise<void>;
    content(): Promise<string>;
    title?(): Promise<string>;
    locator?(selector: string): Locator;
    waitForLoadState?(state?: "load" | "domcontentloaded" | "networkidle"): Promise<void>;
    waitForTimeout?(timeout: number): Promise<void>;
    screenshot?(options?: { path?: string; fullPage?: boolean }): Promise<Buffer>;
    addScriptTag?(options: {
      content?: string;
      path?: string;
      url?: string;
    }): Promise<ElementHandle>;
  }

  export interface ElementHandle {
    textContent(): Promise<string | null>;
    getAttribute(name: string): Promise<string | null>;
    click(options?: { timeout?: number }): Promise<void>;
    innerHTML(): Promise<string>;
    innerText(): Promise<string>;
  }

  export interface Locator {
    textContent(): Promise<string | null>;
    innerHTML(): Promise<string>;
    innerText(): Promise<string>;
    count(): Promise<number>;
    first(): Locator;
    last(): Locator;
    nth(index: number): Locator;
  }

  export interface BrowserType {
    launch(options?: {
      headless?: boolean;
      args?: string[];
      timeout?: number;
      slowMo?: number;
    }): Promise<Browser>;
    launchPersistentContext(
      userDataDir: string,
      options?: {
        headless?: boolean;
        args?: string[];
      }
    ): Promise<BrowserContext>;
  }

  export interface BrowserContext {
    newPage(): Promise<Page>;
    close(): Promise<void>;
  }

  export const chromium: BrowserType;
  export const firefox: BrowserType;
  export const webkit: BrowserType;

  export interface PlaywrightModule {
    chromium: BrowserType;
    firefox: BrowserType;
    webkit: BrowserType;
  }
}

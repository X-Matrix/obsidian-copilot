import { moment } from "obsidian";
import { en } from "./locales/en";
import { zhCN } from "./locales/zh-CN";
import { es } from "./locales/es";
import { I18nMessages, SupportedLanguage } from "./types";

class I18nManager {
  private currentLanguage: SupportedLanguage = "en";
  private messages: Record<SupportedLanguage, I18nMessages> = {
    en: en,
    "zh-CN": zhCN,
    es: es,
  };

  constructor() {
    this.detectLanguage();
  }

  private detectLanguage(): void {
    try {
      // 从 moment.js 获取语言设置（Obsidian 使用 moment.js）
      const locale = moment.locale();

      if (locale && locale.startsWith("zh")) {
        this.currentLanguage = "zh-CN";
      } else if (locale && locale.startsWith("es")) {
        this.currentLanguage = "es";
      } else {
        this.currentLanguage = "en";
      }
    } catch (error) {
      // 如果检测失败，默认使用英文
      console.warn("Failed to detect language, using English as default:", error);
      this.currentLanguage = "en";
    }
  }

  public setLanguage(language: SupportedLanguage): void {
    if (language && this.messages[language]) {
      this.currentLanguage = language;
    } else {
      console.warn(`Unsupported language: ${language}, falling back to English`);
      this.currentLanguage = "en";
    }
  }

  public getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  public t(key: string): string {
    if (!key) return "";

    const keys = key.split(".");
    let current: any = this.messages[this.currentLanguage];

    for (const k of keys) {
      current = current?.[k];
      if (current === undefined) {
        // 如果找不到翻译，回退到英文
        current = this.messages["en"];
        for (const fallbackKey of keys) {
          current = current?.[fallbackKey];
          if (current === undefined) {
            console.warn(`Missing translation for key: ${key}`);
            return key; // 如果英文也没有，返回原始key
          }
        }
        break;
      }
    }

    return current || key;
  }

  // 便捷方法
  public getSupportedLanguages(): { code: SupportedLanguage; name: string }[] {
    return [
      { code: "en", name: "English" },
      { code: "zh-CN", name: "简体中文" },
      { code: "es", name: "Español" },
    ];
  }
}

// 导出单例实例
export const i18n = new I18nManager();

// 导出便捷函数
export const t = (key: string): string => i18n.t(key);

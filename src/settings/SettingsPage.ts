import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import { i18n, t } from "@/i18n";
import type { SupportedLanguage } from "@/i18n/types";
import { getSettings, setSettings } from "./model";
import type CopilotPlugin from "@/main";

export class CopilotSettingTab extends PluginSettingTab {
  plugin: CopilotPlugin;

  constructor(app: App, plugin: CopilotPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // 添加标题
    containerEl.createEl("h1", { text: t("settings.title") });

    // General Settings Section
    containerEl.createEl("h2", { text: t("settings.general") });

    // Language Settings
    new Setting(containerEl)
      .setName(t("settings.language"))
      .setDesc("Choose your preferred language / 选择您的首选语言")
      .addDropdown((dropdown: any) => {
        const supportedLanguages = i18n.getSupportedLanguages();

        supportedLanguages.forEach((lang) => {
          dropdown.addOption(lang.code, lang.name);
        });

        dropdown.setValue(getSettings().language || "en").onChange(async (value: string) => {
          try {
            const newSettings = { ...getSettings(), language: value };
            setSettings(newSettings);

            // 立即应用语言设置
            i18n.setLanguage(value as SupportedLanguage);

            // 保存到插件数据
            await this.plugin.setLanguage(value);

            // 刷新设置页面以显示新语言
            this.display();

            new Notice(t("settings.languageChanged") || "Language changed successfully");
          } catch (error) {
            console.error("Error changing language:", error);
            new Notice("Error changing language");
          }
        });
      });

    // API Keys Section
    containerEl.createEl("h2", { text: t("settings.apiKeys") || "API Keys" });

    // OpenAI API Key
    new Setting(containerEl)
      .setName(t("settings.openaiApiKey") || "OpenAI API Key")
      .setDesc(t("settings.openaiApiKeyDesc") || "Enter your OpenAI API key")
      .addText((text) =>
        text
          .setPlaceholder("sk-...")
          .setValue(getSettings().openAIApiKey || "")
          .onChange(async (value) => {
            const newSettings = { ...getSettings(), openAIApiKey: value };
            setSettings(newSettings);
          })
      );

    // Model Settings Section
    containerEl.createEl("h2", { text: t("settings.modelSettings") || "Model Settings" });

    // Temperature
    new Setting(containerEl)
      .setName(t("settings.temperature"))
      .setDesc(t("settings.temperatureDesc") || "Controls randomness in responses (0.0 to 1.0)")
      .addSlider((slider) =>
        slider
          .setLimits(0, 1, 0.1)
          .setValue(getSettings().temperature || 0.1)
          .setDynamicTooltip()
          .onChange(async (value) => {
            const newSettings = { ...getSettings(), temperature: value };
            setSettings(newSettings);
          })
      );

    // Chat Settings Section
    containerEl.createEl("h2", { text: t("settings.chatSettings") || "Chat Settings" });

    // Auto-save Chat
    new Setting(containerEl)
      .setName(t("settings.autosaveChat") || "Auto-save Chat")
      .setDesc(t("settings.autosaveChatDesc") || "Automatically save chat conversations")
      .addToggle((toggle) =>
        toggle.setValue(getSettings().autosaveChat || false).onChange(async (value) => {
          const newSettings = { ...getSettings(), autosaveChat: value };
          setSettings(newSettings);
        })
      );

    // Default Save Folder
    new Setting(containerEl)
      .setName(t("settings.defaultSaveFolder") || "Default Save Folder")
      .setDesc(t("settings.defaultSaveFolderDesc") || "Folder to save chat conversations")
      .addText((text) =>
        text
          .setPlaceholder("copilot-conversations")
          .setValue(getSettings().defaultSaveFolder || "copilot-conversations")
          .onChange(async (value) => {
            const newSettings = { ...getSettings(), defaultSaveFolder: value };
            setSettings(newSettings);
          })
      );

    // Advanced Settings Section
    containerEl.createEl("h2", { text: t("settings.advanced") });

    // Debug Mode
    new Setting(containerEl)
      .setName(t("settings.debugMode") || "Debug Mode")
      .setDesc(t("settings.debugModeDesc") || "Enable debug logging")
      .addToggle((toggle) =>
        toggle.setValue(getSettings().debug || false).onChange(async (value) => {
          const newSettings = { ...getSettings(), debug: value };
          setSettings(newSettings);
        })
      );

    // Encryption
    new Setting(containerEl)
      .setName(t("settings.enableEncryption") || "Enable Encryption")
      .setDesc(t("settings.enableEncryptionDesc") || "Encrypt sensitive data")
      .addToggle((toggle) =>
        toggle.setValue(getSettings().enableEncryption || false).onChange(async (value) => {
          const newSettings = { ...getSettings(), enableEncryption: value };
          setSettings(newSettings);
        })
      );
  }
}

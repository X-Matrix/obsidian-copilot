import { ChainType } from "@/chainFactory";
import { RebuildIndexConfirmModal } from "@/components/modals/RebuildIndexConfirmModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getModelDisplayWithIcons } from "@/components/ui/model-display";
import { SettingItem } from "@/components/ui/setting-item";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DEFAULT_OPEN_AREA, PLUS_UTM_MEDIUMS } from "@/constants";
import { createPlusPageUrl } from "@/plusUtils";
import VectorStoreManager from "@/search/vectorStoreManager";
import { getModelKeyFromModel, updateSetting, useSettingsValue } from "@/settings/model";
import { PlusSettings } from "@/settings/v2/components/PlusSettings";
import { checkModelApiKey, formatDateTime } from "@/utils";
import { HelpCircle, Key, Loader2 } from "lucide-react";
import { Notice } from "obsidian";
import React, { useState, useCallback } from "react";
import { ApiKeyDialog } from "./ApiKeyDialog";
import { cn } from "@/lib/utils";
import { i18n, t } from "@/i18n";
import type { SupportedLanguage } from "@/i18n/types";

const ChainType2Label: Record<ChainType, string> = {
  [ChainType.LLM_CHAIN]: t("chat.mode.chat") || "Chat",
  [ChainType.VAULT_QA_CHAIN]: t("chat.mode.vaultQA") || "Vault QA (Basic)",
  [ChainType.COPILOT_PLUS_CHAIN]: t("chat.mode.copilotPlus") || "Copilot Plus (beta)",
  [ChainType.PROJECT_CHAIN]: t("chat.mode.projects") || "Projects (alpha)",
};

export const BasicSettings: React.FC = () => {
  const settings = useSettingsValue();
  const [isChecking, setIsChecking] = useState(false);
  const [forceRender, setForceRender] = useState(0);
  const [conversationNoteName, setConversationNoteName] = useState(
    settings.defaultConversationNoteName || "{$date}_{$time}__{$topic}"
  );

  const handleSetDefaultEmbeddingModel = async (modelKey: string) => {
    if (modelKey !== settings.embeddingModelKey) {
      new RebuildIndexConfirmModal(app, async () => {
        updateSetting("embeddingModelKey", modelKey);
        await VectorStoreManager.getInstance().indexVaultToVectorStore(true);
      }).open();
    }
  };

  const applyCustomNoteFormat = () => {
    setIsChecking(true);

    try {
      // Check required variables
      const format = conversationNoteName || "{$date}_{$time}__{$topic}";
      const requiredVars = ["{$date}", "{$time}", "{$topic}"];
      const missingVars = requiredVars.filter((v) => !format.includes(v));

      if (missingVars.length > 0) {
        new Notice(`Error: Missing required variables: ${missingVars.join(", ")}`, 4000);
        return;
      }

      // Check illegal characters (excluding variable placeholders)
      const illegalChars = /[\\/:*?"<>|]/;
      const formatWithoutVars = format
        .replace(/\{\$date}/g, "")
        .replace(/\{\$time}/g, "")
        .replace(/\{\$topic}/g, "");

      if (illegalChars.test(formatWithoutVars)) {
        new Notice(`Error: Format contains illegal characters (\\/:*?"<>|)`, 4000);
        return;
      }

      // Generate example filename
      const { fileName: timestampFileName } = formatDateTime(new Date());
      const firstTenWords = "test topic name";

      // Create example filename
      const customFileName = format
        .replace("{$topic}", firstTenWords.slice(0, 100).replace(/\s+/g, "_"))
        .replace("{$date}", timestampFileName.split("_")[0])
        .replace("{$time}", timestampFileName.split("_")[1]);

      // Save settings
      updateSetting("defaultConversationNoteName", format);
      setConversationNoteName(format);
      new Notice(`Format applied successfully! Example: ${customFileName}`, 4000);
    } catch (error) {
      new Notice(`Error applying format: ${error.message}`, 4000);
    } finally {
      setIsChecking(false);
    }
  };

  const defaultModelActivated = !!settings.activeModels.find(
    (m) => m.enabled && getModelKeyFromModel(m) === settings.defaultModelKey
  );
  const enableActivatedModels = settings.activeModels
    .filter((m) => m.enabled)
    .map((model) => ({
      label: getModelDisplayWithIcons(model),
      value: getModelKeyFromModel(model),
    }));

  const handleLanguageChange = useCallback((value: string) => {
    try {
      updateSetting("language", value);
      i18n.setLanguage(value as SupportedLanguage);

      // 强制重新渲染组件
      setForceRender((prev) => prev + 1);

      new Notice(t("settings.languageChanged") || "Language changed successfully");

      // 延迟一点再次强制渲染，确保所有翻译都已更新
      setTimeout(() => {
        setForceRender((prev) => prev + 1);
      }, 100);
    } catch (error) {
      console.error("Error changing language:", error);
      new Notice("Error changing language");
    }
  }, []);

  return (
    <div className="tw-space-y-4" key={forceRender}>
      <PlusSettings />

      {/* General Section */}
      <section>
        <div className="tw-mb-3 tw-text-xl tw-font-bold">{t("settings.general")}</div>
        <div className="tw-space-y-4">
          <div className="tw-space-y-4">
            {/* Language Selection */}
            <SettingItem
              type="select"
              title={t("settings.language")}
              description="Choose your preferred language / 选择您的首选语言"
              value={settings.language || "en"}
              onChange={handleLanguageChange}
              options={i18n.getSupportedLanguages().map((lang) => ({
                label: lang.name,
                value: lang.code,
              }))}
              placeholder={t("settings.language")}
            />

            {/* API Key Section */}
            <SettingItem
              type="custom"
              title={t("settings.apiKeys")}
              description={
                <div className="tw-flex tw-items-center tw-gap-1.5">
                  <span className="tw-leading-none">{t("settings.configureApiKeys")}</span>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="tw-size-4" />
                      </TooltipTrigger>
                      <TooltipContent className="tw-flex tw-max-w-96 tw-flex-col tw-gap-2 tw-py-4">
                        <div className="tw-text-sm tw-font-medium tw-text-accent">
                          {t("settings.apiKeyRequired")}
                        </div>
                        <div className="tw-text-xs tw-text-muted">
                          {t("settings.apiKeyRequiredDesc")}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              }
            >
              <Button
                onClick={() => {
                  new ApiKeyDialog(app).open();
                }}
                variant="secondary"
                className="tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-2 sm:tw-w-auto sm:tw-justify-start"
              >
                {t("settings.setKeys")}
                <Key className="tw-size-4" />
              </Button>
            </SettingItem>
          </div>
          <SettingItem
            type="select"
            title={t("settings.defaultChatModel")}
            description={t("settings.defaultChatModelDesc")}
            value={defaultModelActivated ? settings.defaultModelKey : t("settings.selectModel")}
            onChange={(value) => {
              const selectedModel = settings.activeModels.find(
                (m) => m.enabled && getModelKeyFromModel(m) === value
              );
              if (!selectedModel) return;

              const { hasApiKey, errorNotice } = checkModelApiKey(selectedModel, settings);
              if (!hasApiKey && errorNotice) {
                new Notice(errorNotice);
                return;
              }
              updateSetting("defaultModelKey", value);
            }}
            options={
              defaultModelActivated
                ? enableActivatedModels
                : [
                    { label: t("settings.selectModel"), value: t("settings.selectModel") },
                    ...enableActivatedModels,
                  ]
            }
            placeholder={t("settings.model")}
          />

          <SettingItem
            type="select"
            title={t("settings.embeddingModel")}
            description={
              <div className="tw-space-y-2">
                <div className="tw-flex tw-items-center tw-gap-1.5">
                  <span className="tw-font-medium tw-leading-none tw-text-accent">
                    {t("settings.embeddingModelDesc")}
                  </span>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="tw-size-4" />
                      </TooltipTrigger>
                      <TooltipContent className="tw-flex tw-max-w-96 tw-flex-col tw-gap-2">
                        <div className="tw-pt-2 tw-text-sm tw-text-muted">
                          {t("settings.embeddingModelTooltip")}
                        </div>
                        <ul className="tw-pl-4 tw-text-sm tw-text-muted">
                          <li>{t("settings.rebuildIndexRequired")}</li>
                          <li>{t("settings.affectSearchQuality")}</li>
                          <li>{t("settings.impactQAPerformance")}</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            }
            value={settings.embeddingModelKey}
            onChange={handleSetDefaultEmbeddingModel}
            options={settings.activeEmbeddingModels.map((model) => ({
              label: getModelDisplayWithIcons(model),
              value: getModelKeyFromModel(model),
            }))}
            placeholder={t("settings.model")}
          />

          {/* Basic Configuration Group */}
          <SettingItem
            type="select"
            title={t("settings.defaultMode")}
            description={
              <div className="tw-flex tw-items-center tw-gap-1.5">
                <span className="tw-leading-none">{t("settings.selectDefaultMode")}</span>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="tw-size-4" />
                    </TooltipTrigger>
                    <TooltipContent className="tw-flex tw-max-w-96 tw-flex-col tw-gap-2">
                      <ul className="tw-pl-4 tw-text-sm tw-text-muted">
                        <li>
                          <strong>{t("chat.mode.chat")}:</strong> {t("settings.chatModeDesc")}
                        </li>
                        <li>
                          <strong>{t("chat.mode.vaultQA")}:</strong> {t("settings.vaultQAModeDesc")}
                        </li>
                        <li>
                          <strong>{t("chat.mode.copilotPlus")}:</strong>{" "}
                          {t("settings.copilotPlusModeDesc")} Check out{" "}
                          <a
                            href={createPlusPageUrl(PLUS_UTM_MEDIUMS.MODE_SELECT_TOOLTIP)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tw-text-accent hover:tw-text-accent-hover"
                          >
                            obsidiancopilot.com
                          </a>{" "}
                          for more details.
                        </li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            }
            value={settings.defaultChainType}
            onChange={(value) => updateSetting("defaultChainType", value as ChainType)}
            options={Object.entries(ChainType2Label).map(([key, value]) => ({
              label: value,
              value: key,
            }))}
          />

          <SettingItem
            type="select"
            title={t("settings.openPluginIn")}
            description={t("settings.openPluginInDesc")}
            value={settings.defaultOpenArea}
            onChange={(value) => updateSetting("defaultOpenArea", value as DEFAULT_OPEN_AREA)}
            options={[
              { label: t("settings.sidebarView"), value: DEFAULT_OPEN_AREA.VIEW },
              { label: t("settings.editor"), value: DEFAULT_OPEN_AREA.EDITOR },
            ]}
          />

          <SettingItem
            type="text"
            title={t("settings.defaultConversationFolder")}
            description={t("settings.defaultConversationFolderDesc")}
            value={settings.defaultSaveFolder}
            onChange={(value) => updateSetting("defaultSaveFolder", value)}
            placeholder="copilot-conversations"
          />

          <SettingItem
            type="text"
            title={t("settings.customPromptsFolder")}
            description={t("settings.customPromptsFolderDesc")}
            value={settings.customPromptsFolder}
            onChange={(value) => updateSetting("customPromptsFolder", value)}
            placeholder="copilot-custom-prompts"
          />

          <SettingItem
            type="text"
            title={t("settings.defaultConversationTag")}
            description={t("settings.defaultConversationTagDesc")}
            value={settings.defaultConversationTag}
            onChange={(value) => updateSetting("defaultConversationTag", value)}
            placeholder="ai-conversations"
          />

          <SettingItem
            type="custom"
            title={t("settings.conversationFilenameTemplate")}
            description={
              <div className="tw-flex tw-items-start tw-gap-1.5 ">
                <span className="tw-leading-none">{t("settings.customizeFilenameFormat")}</span>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="tw-size-4" />
                    </TooltipTrigger>
                    <TooltipContent className="tw-flex tw-max-w-96 tw-flex-col tw-gap-2 tw-py-4">
                      <div className="tw-text-sm tw-font-medium tw-text-accent">
                        {t("settings.filenameTemplateNote")}
                      </div>
                      <div>
                        <div className="tw-text-sm tw-font-medium tw-text-muted">
                          {t("settings.availableVariables")}
                        </div>
                        <ul className="tw-pl-4 tw-text-sm tw-text-muted">
                          <li>
                            <strong>{"{$date}"}</strong>: {t("settings.dateVariable")}
                          </li>
                          <li>
                            <strong>{"{$time}"}</strong>: {t("settings.timeVariable")}
                          </li>
                          <li>
                            <strong>{"{$topic}"}</strong>: {t("settings.topicVariable")}
                          </li>
                        </ul>
                        <i className="tw-mt-2 tw-text-sm tw-text-muted">
                          {t("settings.filenameExample")} {"{$date}_{$time}__{$topic}"} →
                          20250114_153232__polish_this_article_[[Readme]]
                        </i>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            }
          >
            <div className="tw-flex tw-w-[320px] tw-items-center tw-gap-1.5">
              <Input
                type="text"
                className={cn(
                  "tw-min-w-[80px] tw-grow tw-transition-all tw-duration-200",
                  isChecking ? "tw-w-[80px]" : "tw-w-[120px]"
                )}
                placeholder="{$date}_{$time}__{$topic}"
                value={conversationNoteName}
                onChange={(e) => setConversationNoteName(e.target.value)}
                disabled={isChecking}
              />

              <Button
                onClick={() => applyCustomNoteFormat()}
                disabled={isChecking}
                variant="secondary"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="tw-mr-2 tw-size-4 tw-animate-spin" />
                    {t("common.apply")}
                  </>
                ) : (
                  t("common.apply")
                )}
              </Button>
            </div>
          </SettingItem>

          {/* Feature Toggle Group */}
          <SettingItem
            type="switch"
            title={t("settings.autosaveChat")}
            description={t("settings.autosaveChatDesc")}
            checked={settings.autosaveChat}
            onCheckedChange={(checked) => updateSetting("autosaveChat", checked)}
          />

          <SettingItem
            type="switch"
            title={t("settings.suggestedPrompts")}
            description={t("settings.suggestedPromptsDesc")}
            checked={settings.showSuggestedPrompts}
            onCheckedChange={(checked) => updateSetting("showSuggestedPrompts", checked)}
          />

          <SettingItem
            type="switch"
            title={t("settings.relevantNotes")}
            description={t("settings.relevantNotesDesc")}
            checked={settings.showRelevantNotes}
            onCheckedChange={(checked) => updateSetting("showRelevantNotes", checked)}
          />
        </div>
      </section>
    </div>
  );
};

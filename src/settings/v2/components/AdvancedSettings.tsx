import { SettingItem } from "@/components/ui/setting-item";
import { updateSetting, useSettingsValue } from "@/settings/model";
import { PromptSortStrategy } from "@/types";
import { t } from "@/i18n";
import React from "react";

export const AdvancedSettings: React.FC = () => {
  const settings = useSettingsValue();

  return (
    <div className="tw-space-y-4">
      {/* Privacy Settings Section */}
      <section>
        <SettingItem
          type="textarea"
          title={t("advanced.userSystemPrompt")}
          description={t("advanced.userSystemPromptDesc")}
          value={settings.userSystemPrompt}
          onChange={(value) => updateSetting("userSystemPrompt", value)}
          placeholder={t("advanced.userSystemPromptPlaceholder")}
        />

        <div className="tw-space-y-4">
          <SettingItem
            type="switch"
            title={t("advanced.customPromptTemplating")}
            description={t("advanced.customPromptTemplatingDesc")}
            checked={settings.enableCustomPromptTemplating}
            onCheckedChange={(checked) => {
              updateSetting("enableCustomPromptTemplating", checked);
            }}
          />

          <SettingItem
            type="select"
            title={t("advanced.customPromptsSortStrategy")}
            description={t("advanced.customPromptsSortStrategyDesc")}
            value={settings.promptSortStrategy}
            onChange={(value) => updateSetting("promptSortStrategy", value)}
            options={[
              { label: t("advanced.sortByRecency"), value: PromptSortStrategy.TIMESTAMP },
              { label: t("advanced.sortByAlphabetical"), value: PromptSortStrategy.ALPHABETICAL },
            ]}
          />

          <SettingItem
            type="switch"
            title={t("advanced.enableEncryption")}
            description={t("advanced.enableEncryptionDesc")}
            checked={settings.enableEncryption}
            onCheckedChange={(checked) => {
              updateSetting("enableEncryption", checked);
            }}
          />

          <SettingItem
            type="switch"
            title={t("advanced.debugMode")}
            description={t("advanced.debugModeDesc")}
            checked={settings.debug}
            onCheckedChange={(checked) => {
              updateSetting("debug", checked);
            }}
          />
        </div>
      </section>
    </div>
  );
};

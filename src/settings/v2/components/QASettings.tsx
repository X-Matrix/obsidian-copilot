import { PatternMatchingModal } from "@/components/modals/PatternMatchingModal";
import { RebuildIndexConfirmModal } from "@/components/modals/RebuildIndexConfirmModal";
import { Button } from "@/components/ui/button";
import { SettingItem } from "@/components/ui/setting-item";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { VAULT_VECTOR_STORE_STRATEGIES } from "@/constants";
import VectorStoreManager from "@/search/vectorStoreManager";
import { updateSetting, useSettingsValue } from "@/settings/model";
import { t } from "@/i18n";
import { HelpCircle } from "lucide-react";
import React from "react";

export const QASettings: React.FC = () => {
  const settings = useSettingsValue();

  const handlePartitionsChange = (value: string) => {
    const numValue = parseInt(value);
    if (numValue !== settings.numPartitions) {
      new RebuildIndexConfirmModal(app, async () => {
        updateSetting("numPartitions", numValue);
        await VectorStoreManager.getInstance().indexVaultToVectorStore(true);
      }).open();
    }
  };

  return (
    <div className="tw-space-y-4">
      <section>
        <div className="tw-space-y-4">
          {/* Auto-Index Strategy */}
          <SettingItem
            type="select"
            title={t("settings.autoIndexStrategy")}
            description={
              <div className="tw-flex tw-items-center tw-gap-1.5">
                <span className="tw-leading-none">{t("settings.autoIndexStrategyDesc")}</span>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="tw-size-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="tw-space-y-2 tw-py-2">
                        <div className="tw-space-y-1">
                          <div className="tw-text-sm tw-text-muted">
                            {t("settings.autoIndexStrategyTooltip")}
                          </div>
                          <ul className="tw-list-disc tw-space-y-1 tw-pl-2 tw-text-sm">
                            <li>
                              <div className="tw-flex tw-items-center tw-gap-1">
                                <strong className="tw-inline-block tw-whitespace-nowrap">
                                  NEVER:
                                </strong>
                                <span>{t("settings.autoIndexNever")}</span>
                              </div>
                            </li>
                            <li>
                              <div className="tw-flex tw-items-center tw-gap-1">
                                <strong className="tw-inline-block tw-whitespace-nowrap">
                                  ON STARTUP:
                                </strong>
                                <span>{t("settings.autoIndexOnStartup")}</span>
                              </div>
                            </li>
                            <li>
                              <div className="tw-flex tw-items-center tw-gap-1">
                                <strong className="tw-inline-block tw-whitespace-nowrap">
                                  ON MODE SWITCH:
                                </strong>
                                <span>{t("settings.autoIndexOnModeSwitch")}</span>
                              </div>
                            </li>
                          </ul>
                        </div>
                        <p className="tw-text-sm tw-text-callout-warning">
                          {t("settings.autoIndexWarning")}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            }
            value={settings.indexVaultToVectorStore}
            onChange={(value) => {
              updateSetting("indexVaultToVectorStore", value);
            }}
            options={VAULT_VECTOR_STORE_STRATEGIES.map((strategy) => ({
              label: strategy,
              value: strategy,
            }))}
            placeholder={t("settings.strategy")}
          />

          {/* Max Sources */}
          <SettingItem
            type="slider"
            title={t("settings.maxSources")}
            description={t("settings.maxSourcesDesc")}
            min={1}
            max={128}
            step={1}
            value={settings.maxSourceChunks}
            onChange={(value) => updateSetting("maxSourceChunks", value)}
          />

          {/* Requests per Minute */}
          <SettingItem
            type="slider"
            title={t("settings.requestsPerMinute")}
            description={t("settings.requestsPerMinuteDesc")}
            min={10}
            max={300}
            step={10}
            value={settings.embeddingRequestsPerMin}
            onChange={(value) => updateSetting("embeddingRequestsPerMin", value)}
          />

          {/* Embedding batch size */}
          <SettingItem
            type="slider"
            title={t("settings.embeddingBatchSize")}
            description={t("settings.embeddingBatchSizeDesc")}
            min={1}
            max={128}
            step={1}
            value={settings.embeddingBatchSize}
            onChange={(value) => updateSetting("embeddingBatchSize", value)}
          />

          {/* Number of Partitions */}
          <SettingItem
            type="select"
            title={t("settings.numPartitions")}
            description={t("settings.numPartitionsDesc")}
            value={settings.numPartitions.toString()}
            onChange={handlePartitionsChange}
            options={[
              "1",
              "2",
              "3",
              "4",
              "5",
              "6",
              "7",
              "8",
              "12",
              "16",
              "20",
              "24",
              "28",
              "32",
              "36",
              "40",
            ].map((it) => ({
              label: it,
              value: it,
            }))}
          />

          {/* Exclusions */}
          <SettingItem
            type="custom"
            title={t("settings.exclusions")}
            description={
              <>
                <p>{t("settings.exclusionsDesc")}</p>
              </>
            }
          >
            <Button
              variant="secondary"
              onClick={() =>
                new PatternMatchingModal(
                  app,
                  (value) => updateSetting("qaExclusions", value),
                  settings.qaExclusions,
                  "Manage Exclusions"
                ).open()
              }
            >
              {t("settings.manage")}
            </Button>
          </SettingItem>

          {/* Inclusions */}
          <SettingItem
            type="custom"
            title={t("settings.inclusions")}
            description={<p>{t("settings.inclusionsDesc")}</p>}
          >
            <Button
              variant="secondary"
              onClick={() =>
                new PatternMatchingModal(
                  app,
                  (value) => updateSetting("qaInclusions", value),
                  settings.qaInclusions,
                  "Manage Inclusions"
                ).open()
              }
            >
              {t("settings.manage")}
            </Button>
          </SettingItem>

          {/* Enable Obsidian Sync */}
          <SettingItem
            type="switch"
            title={t("settings.enableObsidianSync")}
            description={t("settings.enableObsidianSyncDesc")}
            checked={settings.enableIndexSync}
            onCheckedChange={(checked) => updateSetting("enableIndexSync", checked)}
          />

          {/* Disable index loading on mobile */}
          <SettingItem
            type="switch"
            title={t("settings.disableIndexOnMobile")}
            description={t("settings.disableIndexOnMobileDesc")}
            checked={settings.disableIndexOnMobile}
            onCheckedChange={(checked) => updateSetting("disableIndexOnMobile", checked)}
          />
        </div>
      </section>
    </div>
  );
};

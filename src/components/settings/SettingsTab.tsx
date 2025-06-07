import React from "react";
import { LanguageSelector } from "../LanguageSelector";
import { t } from "@/i18n";

interface SettingsTabProps {
  onLanguageChange?: (language: string) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ onLanguageChange }) => {
  return (
    <div style={{ padding: "16px" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>
              {t("settings.language")}
            </h3>
          </div>
        </div>
      </div>

      <LanguageSelector onLanguageChange={onLanguageChange} />

      {/* 其他设置项可以在这里添加 */}
    </div>
  );
};

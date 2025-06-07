import React from "react";
import { i18n, t } from "@/i18n";

interface LanguageSelectorProps {
  onLanguageChange?: (language: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onLanguageChange }) => {
  const currentLanguage = i18n.getCurrentLanguage();
  const supportedLanguages = i18n.getSupportedLanguages();

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value;
    i18n.setLanguage(newLanguage as any);
    onLanguageChange?.(newLanguage);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ fontSize: "14px", fontWeight: "500" }}>{t("settings.language")}:</span>
      <select
        style={{
          padding: "4px 8px",
          border: "1px solid var(--background-modifier-border)",
          borderRadius: "4px",
          fontSize: "14px",
          backgroundColor: "var(--background-primary)",
          color: "var(--text-normal)",
        }}
        value={currentLanguage}
        onChange={handleLanguageChange}
      >
        {supportedLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

import { InlineEditCommandSettings } from "@/settings/model";
import { t } from "@/i18n";

export const SELECTED_TEXT_PLACEHOLDER = "{copilot-selection}";
export const COMMAND_NAME_MAX_LENGTH = 50;

export const getDefaultInlineEditCommands = (): InlineEditCommandSettings[] => [
  {
    name: t("commands.defaults.fixGrammar.name"),
    prompt: t("commands.defaults.fixGrammar.prompt"),
    showInContextMenu: true,
  },
  {
    name: t("commands.defaults.translateToChinese.name"),
    prompt: t("commands.defaults.translateToChinese.prompt"),
    showInContextMenu: true,
  },
  {
    name: t("commands.defaults.summarize.name"),
    prompt: t("commands.defaults.summarize.prompt"),
    showInContextMenu: true,
  },
  {
    name: t("commands.defaults.simplify.name"),
    prompt: t("commands.defaults.simplify.prompt"),
    showInContextMenu: true,
  },
  {
    name: t("commands.defaults.emojify.name"),
    prompt: t("commands.defaults.emojify.prompt"),
    showInContextMenu: true,
  },
  {
    name: t("commands.defaults.makeShorter.name"),
    prompt: t("commands.defaults.makeShorter.prompt"),
    showInContextMenu: true,
  },
  {
    name: t("commands.defaults.makeLonger.name"),
    prompt: t("commands.defaults.makeLonger.prompt"),
    showInContextMenu: true,
  },
  {
    name: t("commands.defaults.generateToc.name"),
    prompt: t("commands.defaults.generateToc.prompt"),
    showInContextMenu: false,
  },
  {
    name: t("commands.defaults.generateGlossary.name"),
    prompt: t("commands.defaults.generateGlossary.prompt"),
    showInContextMenu: false,
  },
  {
    name: t("commands.defaults.removeUrls.name"),
    prompt: t("commands.defaults.removeUrls.prompt"),
    showInContextMenu: false,
  },
  {
    name: t("commands.defaults.rewriteAsTweet.name"),
    prompt: t("commands.defaults.rewriteAsTweet.prompt"),
    showInContextMenu: false,
  },
  {
    name: t("commands.defaults.rewriteAsThread.name"),
    prompt: t("commands.defaults.rewriteAsThread.prompt"),
    showInContextMenu: false,
  },
  {
    name: t("commands.defaults.explainLikeChild.name"),
    prompt: t("commands.defaults.explainLikeChild.prompt"),
    showInContextMenu: false,
  },
  {
    name: t("commands.defaults.rewriteAsPressRelease.name"),
    prompt: t("commands.defaults.rewriteAsPressRelease.prompt"),
    showInContextMenu: false,
  },
];

// 保持向后兼容性的常量
export const DEFAULT_INLINE_EDIT_COMMANDS = getDefaultInlineEditCommands();

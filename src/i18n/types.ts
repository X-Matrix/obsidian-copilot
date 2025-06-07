export interface I18nMessages {
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
    delete: string;
    edit: string;
    close: string;
    apply: string;
    setKeys: string;
  };
  chat: {
    newChat: string;
    loadHistory: string;
    clearHistory: string;
    placeholder: string;
    sending: string;
    errorSending: string;
    mode: {
      chat: string;
      vaultQA: string;
      copilotPlus: string;
      projects: string;
    };
  };
  search: {
    searching: string;
    noResults: string;
    indexing: string;
    indexComplete: string;
    invalidVectorLength: string;
  };
  errors: {
    dbNotInitialized: string;
    embeddingModelError: string;
    fileNotFound: string;
    networkError: string;
  };
  settings: {
    title: string;
    apiKey: string;
    apiKeys: string;
    model: string;
    temperature: string;
    temperatureDesc: string;
    language: string;
    languageChanged: string;
    general: string;
    advanced: string;
    defaultChatModel: string;
    defaultChatModelDesc: string;
    selectModel: string;
    embeddingModel: string;
    embeddingModelDesc: string;
    defaultMode: string;
    defaultModeDesc: string;
    openPluginIn: string;
    openPluginInDesc: string;
    sidebarView: string;
    editor: string;
    defaultConversationFolder: string;
    defaultConversationFolderDesc: string;
    customPromptsFolder: string;
    customPromptsFolderDesc: string;
    defaultConversationTag: string;
    defaultConversationTagDesc: string;
    conversationFilenameTemplate: string;
    conversationFilenameTemplateDesc: string;
    autosaveChat: string;
    autosaveChatDesc: string;
    suggestedPrompts: string;
    suggestedPromptsDesc: string;
    relevantNotes: string;
    relevantNotesDesc: string;
    apiKeyRequired: string;
    apiKeyRequiredDesc: string;
    configureApiKeys: string;
    openaiApiKey: string;
    openaiApiKeyDesc: string;
    modelSettings: string;
    chatSettings: string;
    defaultSaveFolder: string;
    defaultSaveFolderDesc: string;
    debugMode: string;
    debugModeDesc: string;
    enableEncryption: string;
    enableEncryptionDesc: string;
    embeddingModelTooltip: string;
    rebuildIndexRequired: string;
    affectSearchQuality: string;
    impactQAPerformance: string;
    selectDefaultMode: string;
    chatModeDesc: string;
    vaultQAModeDesc: string;
    copilotPlusModeDesc: string;
    customizeFilenameFormat: string;
    filenameTemplateNote: string;
    availableVariables: string;
    dateVariable: string;
    timeVariable: string;
    topicVariable: string;
    filenameExample: string;
    // QA Settings
    qaSettings: string;
    autoIndexStrategy: string;
    autoIndexStrategyDesc: string;
    autoIndexStrategyTooltip: string;
    autoIndexNever: string;
    autoIndexOnStartup: string;
    autoIndexOnModeSwitch: string;
    autoIndexWarning: string;
    maxSources: string;
    maxSourcesDesc: string;
    requestsPerMinute: string;
    requestsPerMinuteDesc: string;
    embeddingBatchSize: string;
    embeddingBatchSizeDesc: string;
    numPartitions: string;
    numPartitionsDesc: string;
    exclusions: string;
    exclusionsDesc: string;
    inclusions: string;
    inclusionsDesc: string;
    manage: string;
    enableObsidianSync: string;
    enableObsidianSyncDesc: string;
    disableIndexOnMobile: string;
    disableIndexOnMobileDesc: string;
    strategy: string;
  };
  advanced: {
    userSystemPrompt: string;
    userSystemPromptDesc: string;
    userSystemPromptPlaceholder: string;
    customPromptTemplating: string;
    customPromptTemplatingDesc: string;
    customPromptsSortStrategy: string;
    customPromptsSortStrategyDesc: string;
    sortByRecency: string;
    sortByAlphabetical: string;
    enableEncryption: string;
    enableEncryptionDesc: string;
    debugMode: string;
    debugModeDesc: string;
  };
  commands: {
    title: string;
    description: string;
    tip: string;
    table: {
      name: string;
      inMenu: string;
    };
    actions: {
      edit: string;
      copy: string;
      delete: string;
      addCommand: string;
    };
    copyPrefix: string;
    defaults: {
      fixGrammar: {
        name: string;
        prompt: string;
      };
      translateToChinese: {
        name: string;
        prompt: string;
      };
      summarize: {
        name: string;
        prompt: string;
      };
      simplify: {
        name: string;
        prompt: string;
      };
      emojify: {
        name: string;
        prompt: string;
      };
      makeShorter: {
        name: string;
        prompt: string;
      };
      makeLonger: {
        name: string;
        prompt: string;
      };
      generateToc: {
        name: string;
        prompt: string;
      };
      generateGlossary: {
        name: string;
        prompt: string;
      };
      removeUrls: {
        name: string;
        prompt: string;
      };
      rewriteAsTweet: {
        name: string;
        prompt: string;
      };
      rewriteAsThread: {
        name: string;
        prompt: string;
      };
      explainLikeChild: {
        name: string;
        prompt: string;
      };
      rewriteAsPressRelease: {
        name: string;
        prompt: string;
      };
    };
  };
}

export type SupportedLanguage = "en" | "zh-CN" | "es";

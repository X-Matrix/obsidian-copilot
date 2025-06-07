import { I18nMessages } from "../types";

export const en: I18nMessages = {
  common: {
    loading: "Loading...",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    apply: "Apply",
    setKeys: "Set Keys",
  },
  chat: {
    newChat: "New Chat",
    loadHistory: "Load Chat History",
    clearHistory: "Clear History",
    placeholder: "Type your message here...",
    sending: "Sending...",
    errorSending: "Error sending message",
    mode: {
      chat: "Chat",
      vaultQA: "Vault QA (Basic)",
      copilotPlus: "Copilot Plus (beta)",
      projects: "Projects (alpha)",
    },
  },
  search: {
    searching: "Searching...",
    noResults: "No results found",
    indexing: "Indexing files...",
    indexComplete: "Indexing complete",
    invalidVectorLength:
      "Invalid vector length detected. Please check if your embedding model is working.",
  },
  errors: {
    dbNotInitialized: "Database not initialized",
    embeddingModelError: "Embedding model error",
    fileNotFound: "File not found",
    networkError: "Network error",
  },
  settings: {
    title: "Copilot Settings",
    apiKey: "API Key",
    apiKeys: "API Keys",
    model: "Model",
    temperature: "Temperature",
    temperatureDesc: "Controls randomness in responses (0.0 to 1.0)",
    language: "Language",
    languageChanged: "Language changed successfully",
    general: "General",
    advanced: "Advanced",
    defaultChatModel: "Default Chat Model",
    defaultChatModelDesc: "Select the Chat model to use",
    selectModel: "Select Model",
    embeddingModel: "Embedding Model",
    embeddingModelDesc: "Core Feature: Powers Semantic Search & QA",
    defaultMode: "Default Mode",
    defaultModeDesc: "Select the default chat mode",
    openPluginIn: "Open Plugin In",
    openPluginInDesc: "Choose where to open the plugin",
    sidebarView: "Sidebar View",
    editor: "Editor",
    defaultConversationFolder: "Default Conversation Folder Name",
    defaultConversationFolderDesc:
      'The default folder name where chat conversations will be saved. Default is "copilot-conversations"',
    customPromptsFolder: "Custom Prompts Folder Name",
    customPromptsFolderDesc:
      'The default folder name where custom prompts will be saved. Default is "copilot-custom-prompts"',
    defaultConversationTag: "Default Conversation Tag",
    defaultConversationTagDesc:
      'The default tag to be used when saving a conversation. Default is "ai-conversations"',
    conversationFilenameTemplate: "Conversation Filename Template",
    conversationFilenameTemplateDesc: "Customize the format of saved conversation note names",
    autosaveChat: "Autosave Chat",
    autosaveChatDesc:
      "Automatically save the chat when starting a new one or when the plugin reloads",
    suggestedPrompts: "Suggested Prompts",
    suggestedPromptsDesc: "Show suggested prompts in the chat view",
    relevantNotes: "Relevant Notes",
    relevantNotesDesc: "Show relevant notes in the chat view",
    apiKeyRequired: "API key required for chat and QA features",
    apiKeyRequiredDesc:
      "To enable chat and QA functionality, please provide an API key from your selected provider.",
    configureApiKeys: "Configure API keys for different AI providers",
    openaiApiKey: "OpenAI API Key",
    openaiApiKeyDesc: "Enter your OpenAI API key",
    modelSettings: "Model Settings",
    chatSettings: "Chat Settings",
    defaultSaveFolder: "Default Save Folder",
    defaultSaveFolderDesc: "Folder to save chat conversations",
    debugMode: "Debug Mode",
    debugModeDesc: "Enable debug logging",
    enableEncryption: "Enable Encryption",
    enableEncryptionDesc: "Encrypt sensitive data",
    embeddingModelTooltip:
      "This model converts text into vector representations, essential for semantic search and QA functionality. Changing the embedding model will:",
    rebuildIndexRequired: "Require rebuilding your vault's vector index",
    affectSearchQuality: "Affect semantic search quality",
    impactQAPerformance: "Impact QA feature performance",
    selectDefaultMode: "Select the default chat mode",
    chatModeDesc:
      "Regular chat mode for general conversations and tasks. Free to use with your own API key.",
    vaultQAModeDesc:
      "Ask questions about your vault content with semantic search. Free to use with your own API key.",
    copilotPlusModeDesc:
      "Covers all features of the 2 free modes, plus advanced paid features including chat context menu, advanced search, AI agents, and more.",
    customizeFilenameFormat: "Customize the format of saved conversation note names.",
    filenameTemplateNote: "Note: All the following variables must be included in the template.",
    availableVariables: "Available variables:",
    dateVariable: "Date in YYYYMMDD format",
    timeVariable: "Time in HHMMSS format",
    topicVariable: "Chat conversation topic",
    filenameExample: "Example:",
    // QA Settings
    qaSettings: "Q&A Settings",
    autoIndexStrategy: "Auto-Index Strategy",
    autoIndexStrategyDesc: "Decide when you want the vault to be indexed.",
    autoIndexStrategyTooltip: "Choose when to index your vault:",
    autoIndexNever: "Manual indexing via command or refresh only",
    autoIndexOnStartup: "Index updates when plugin loads or reloads",
    autoIndexOnModeSwitch: "Updates when entering QA mode (Recommended)",
    autoIndexWarning: "Warning: Cost implications for large vaults with paid models",
    maxSources: "Max Sources",
    maxSourcesDesc:
      "Copilot goes through your vault to find relevant blocks and passes the top N blocks to the LLM. Default for N is 3. Increase if you want more sources included in the answer generation step.",
    requestsPerMinute: "Requests per Minute",
    requestsPerMinuteDesc:
      "Default is 90. Decrease if you are rate limited by your embedding provider.",
    embeddingBatchSize: "Embedding Batch Size",
    embeddingBatchSizeDesc:
      "Default is 16. Increase if you are rate limited by your embedding provider.",
    numPartitions: "Number of Partitions",
    numPartitionsDesc:
      "Number of partitions for Copilot index. Default is 1. Increase if you have issues indexing large vaults. Warning: Changes require clearing and rebuilding the index!",
    exclusions: "Exclusions",
    exclusionsDesc:
      "Exclude folders, tags, note titles or file extensions from being indexed. Previously indexed files will remain until a force re-index is performed.",
    inclusions: "Inclusions",
    inclusionsDesc:
      "Index only the specified paths, tags, or note titles. Exclusions take precedence over inclusions. Previously indexed files will remain until a force re-index is performed.",
    manage: "Manage",
    enableObsidianSync: "Enable Obsidian Sync for Copilot index",
    enableObsidianSyncDesc:
      "If enabled, the index will be stored in the .obsidian folder and synced with Obsidian Sync by default. If disabled, it will be stored in .copilot-index folder at vault root.",
    disableIndexOnMobile: "Disable index loading on mobile",
    disableIndexOnMobileDesc:
      "When enabled, Copilot index won't be loaded on mobile devices to save resources. Only chat mode will be available. Any existing index from desktop sync will be preserved. Uncheck to enable QA modes on mobile.",
    strategy: "Strategy",
  },
  advanced: {
    userSystemPrompt: "User System Prompt",
    userSystemPromptDesc:
      "Customize the system prompt for all messages, may result in unexpected behavior!",
    userSystemPromptPlaceholder: "Enter your system prompt here...",
    customPromptTemplating: "Custom Prompt Templating",
    customPromptTemplatingDesc:
      "Enable templating to process variables like {activenote}, {foldername} or {#tag} in prompts. Disable to use raw prompts without any processing.",
    customPromptsSortStrategy: "Custom Prompts Sort Strategy",
    customPromptsSortStrategyDesc:
      "Choose how to sort custom prompts (by recent usage or alphabetically)",
    sortByRecency: "Recency",
    sortByAlphabetical: "Alphabetical",
    enableEncryption: "Enable Encryption",
    enableEncryptionDesc: "Enable encryption for the API keys.",
    debugMode: "Debug Mode",
    debugModeDesc: "Debug mode will log some debug message to the console.",
  },
  commands: {
    title: "Custom Commands",
    description:
      "To trigger a custom command, highlight text in the editor and select it from the command palette, or right-click and choose it from the context menu if configured.",
    tip: "Take control of your inline edit commands! You can now create your own or edit built-in ones to tailor functionality to your needs.",
    table: {
      name: "Name",
      inMenu: "In Menu",
    },
    actions: {
      edit: "Edit",
      copy: "Copy",
      delete: "Delete",
      addCommand: "Add Command",
    },
    copyPrefix: " (copy)",
    defaults: {
      fixGrammar: {
        name: "Fix grammar and spelling",
        prompt:
          "Fix the grammar and spelling of {}. Preserve all formatting, line breaks, and special characters. Do not add or remove any content. Return only the corrected text.",
      },
      translateToChinese: {
        name: "Translate to Chinese",
        prompt:
          "Translate {} into Chinese:\n1. Preserve the meaning and tone\n2. Maintain appropriate cultural context\n3. Keep formatting and structure\nReturn only the translated text.",
      },
      summarize: {
        name: "Summarize",
        prompt:
          "Create a bullet-point summary of {}. Each bullet point should capture a key point. Return only the bullet-point summary.",
      },
      simplify: {
        name: "Simplify",
        prompt:
          "Simplify {} to a 6th-grade reading level (ages 11-12). Use simple sentences, common words, and clear explanations. Maintain the original key concepts. Return only the simplified text.",
      },
      emojify: {
        name: "Emojify",
        prompt:
          "Add relevant emojis to enhance {}. Follow these rules:\n1. Insert emojis at natural breaks in the text\n2. Never place two emojis next to each other\n3. Keep all original text unchanged\n4. Choose emojis that match the context and tone\nReturn only the emojified text.",
      },
      makeShorter: {
        name: "Make shorter",
        prompt:
          "Reduce {} to half its length while preserving these elements:\n1. Main ideas and key points\n2. Essential details\n3. Original tone and style\nReturn only the shortened text.",
      },
      makeLonger: {
        name: "Make longer",
        prompt:
          "Expand {} to twice its length by:\n1. Adding relevant details and examples\n2. Elaborating on key points\n3. Maintaining the original tone and style\nReturn only the expanded text.",
      },
      generateToc: {
        name: "Generate table of contents",
        prompt:
          "Generate a hierarchical table of contents for {}. Use appropriate heading levels (H1, H2, H3, etc.). Include page numbers if present. Return only the table of contents.",
      },
      generateGlossary: {
        name: "Generate glossary",
        prompt:
          'Create a glossary of important terms, concepts, and phrases from {}. Format each entry as "Term: Definition". Sort entries alphabetically. Return only the glossary.',
      },
      removeUrls: {
        name: "Remove URLs",
        prompt:
          "Remove all URLs from {}. Preserve all other content and formatting. URLs may be in various formats (http, https, www). Return only the text with URLs removed.",
      },
      rewriteAsTweet: {
        name: "Rewrite as tweet",
        prompt:
          "Rewrite {} as a single tweet with these requirements:\n1. Maximum 280 characters\n2. Use concise, impactful language\n3. Maintain the core message\nReturn only the tweet text.",
      },
      rewriteAsThread: {
        name: "Rewrite as tweet thread",
        prompt:
          'Convert {} into a Twitter thread following these rules:\n1. Each tweet must be under 240 characters\n2. Start with "THREAD START" on its own line\n3. Separate tweets with "\\n\\n---\\n\\n"\n4. End with "THREAD END" on its own line\n5. Make content engaging and clear\nReturn only the formatted thread.',
      },
      explainLikeChild: {
        name: "Explain like I am 5",
        prompt:
          "Explain {} in simple terms that a 5-year-old would understand:\n1. Use basic vocabulary\n2. Include simple analogies\n3. Break down complex concepts\nReturn only the simplified explanation.",
      },
      rewriteAsPressRelease: {
        name: "Rewrite as press release",
        prompt:
          "Transform {} into a professional press release:\n1. Use formal, journalistic style\n2. Include headline and dateline\n3. Follow inverted pyramid structure\nReturn only the press release format.",
      },
    },
  },
};

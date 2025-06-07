import { I18nMessages } from "../types";

export const zhCN: I18nMessages = {
  common: {
    loading: "加载中...",
    error: "错误",
    success: "成功",
    cancel: "取消",
    confirm: "确认",
    save: "保存",
    delete: "删除",
    edit: "编辑",
    close: "关闭",
    apply: "应用",
    setKeys: "设置密钥",
  },
  chat: {
    newChat: "新对话",
    loadHistory: "加载聊天历史",
    clearHistory: "清除历史",
    placeholder: "在此输入您的消息...",
    sending: "发送中...",
    errorSending: "发送消息时出错",
    mode: {
      chat: "聊天",
      vaultQA: "知识库问答（基础版）",
      copilotPlus: "Copilot Plus（测试版）",
      projects: "项目（内测版）",
    },
  },
  search: {
    searching: "搜索中...",
    noResults: "未找到结果",
    indexing: "索引文件中...",
    indexComplete: "索引完成",
    invalidVectorLength: "检测到无效的向量长度。请检查您的嵌入模型是否正常工作。",
  },
  errors: {
    dbNotInitialized: "数据库未初始化",
    embeddingModelError: "嵌入模型错误",
    fileNotFound: "文件未找到",
    networkError: "网络错误",
  },
  settings: {
    title: "Copilot 设置",
    apiKey: "API 密钥",
    apiKeys: "API 密钥",
    model: "模型",
    temperature: "温度",
    temperatureDesc: "控制响应的随机性（0.0 到 1.0）",
    language: "语言",
    languageChanged: "语言更改成功",
    general: "常规",
    advanced: "高级",
    defaultChatModel: "默认聊天模型",
    defaultChatModelDesc: "选择要使用的聊天模型",
    selectModel: "选择模型",
    embeddingModel: "嵌入模型",
    embeddingModelDesc: "核心功能：支持语义搜索和问答",
    defaultMode: "默认模式",
    defaultModeDesc: "选择默认聊天模式",
    openPluginIn: "插件打开位置",
    openPluginInDesc: "选择插件打开的位置",
    sidebarView: "侧边栏视图",
    editor: "编辑器",
    defaultConversationFolder: "默认对话文件夹名称",
    defaultConversationFolderDesc: '聊天对话保存的默认文件夹名称。默认为"copilot-conversations"',
    customPromptsFolder: "自定义提示文件夹名称",
    customPromptsFolderDesc: '自定义提示保存的默认文件夹名称。默认为"copilot-custom-prompts"',
    defaultConversationTag: "默认对话标签",
    defaultConversationTagDesc: '保存对话时使用的默认标签。默认为"ai-conversations"',
    conversationFilenameTemplate: "对话文件名模板",
    conversationFilenameTemplateDesc: "自定义保存的对话笔记名称格式",
    autosaveChat: "自动保存聊天",
    autosaveChatDesc: "开始新对话或插件重新加载时自动保存聊天",
    suggestedPrompts: "建议提示",
    suggestedPromptsDesc: "在聊天视图中显示建议提示",
    relevantNotes: "相关笔记",
    relevantNotesDesc: "在聊天视图中显示相关笔记",
    apiKeyRequired: "聊天和问答功能需要 API 密钥",
    apiKeyRequiredDesc: "要启用聊天和问答功能，请提供来自您选择的提供商的 API 密钥。",
    configureApiKeys: "为不同的 AI 提供商配置 API 密钥",
    openaiApiKey: "OpenAI API 密钥",
    openaiApiKeyDesc: "输入您的 OpenAI API 密钥",
    modelSettings: "模型设置",
    chatSettings: "聊天设置",
    defaultSaveFolder: "默认保存文件夹",
    defaultSaveFolderDesc: "保存聊天对话的文件夹",
    debugMode: "调试模式",
    debugModeDesc: "启用调试日志",
    enableEncryption: "启用加密",
    enableEncryptionDesc: "加密敏感数据",
    embeddingModelTooltip:
      "此模型将文本转换为向量表示，对语义搜索和问答功能至关重要。更改嵌入模型将：",
    rebuildIndexRequired: "需要重建您的知识库向量索引",
    affectSearchQuality: "影响语义搜索质量",
    impactQAPerformance: "影响问答功能性能",
    selectDefaultMode: "选择默认聊天模式",
    chatModeDesc: "用于常规对话和任务的普通聊天模式。使用您自己的 API 密钥免费使用。",
    vaultQAModeDesc: "通过语义搜索询问有关您的知识库内容的问题。使用您自己的 API 密钥免费使用。",
    copilotPlusModeDesc:
      "涵盖 2 种免费模式的所有功能，以及高级付费功能，包括聊天上下文菜单、高级搜索、AI 代理等。",
    customizeFilenameFormat: "自定义保存的对话笔记名称格式。",
    filenameTemplateNote: "注意：模板中必须包含以下所有变量。",
    availableVariables: "可用变量：",
    dateVariable: "YYYYMMDD 格式的日期",
    timeVariable: "HHMMSS 格式的时间",
    topicVariable: "聊天对话主题",
    filenameExample: "示例：",
    qaSettings: "问答设置",
    autoIndexStrategy: "自动索引策略",
    autoIndexStrategyDesc: "决定何时索引您的知识库。",
    autoIndexStrategyTooltip: "选择何时索引您的知识库：",
    autoIndexNever: "仅通过命令或刷新手动索引",
    autoIndexOnStartup: "插件加载或重新加载时更新索引",
    autoIndexOnModeSwitch: "进入问答模式时更新（推荐）",
    autoIndexWarning: "警告：对于大型知识库使用付费模型会产生成本影响",
    maxSources: "最大来源数",
    maxSourcesDesc:
      "Copilot 会搜索您的知识库以找到相关块，并将前 N 个块传递给 LLM。N 的默认值为 3。如果您希望在答案生成步骤中包含更多来源，请增加此值。",
    requestsPerMinute: "每分钟请求数",
    requestsPerMinuteDesc: "默认为 90。如果您的嵌入提供商对您进行速率限制，请减少此值。",
    embeddingBatchSize: "嵌入批处理大小",
    embeddingBatchSizeDesc: "默认为 16。如果您的嵌入提供商对您进行速率限制，请增加此值。",
    numPartitions: "分区数量",
    numPartitionsDesc:
      "Copilot 索引的分区数量。默认为 1。如果您在索引大型知识库时遇到问题，请增加此值。警告：更改需要清除并重建索引！",
    exclusions: "排除项",
    exclusionsDesc:
      "排除文件夹、标签、笔记标题或文件扩展名不被索引。之前索引的文件将保留，直到执行强制重新索引。",
    inclusions: "包含项",
    inclusionsDesc:
      "仅索引指定的路径、标签或笔记标题。排除项优先于包含项。之前索引的文件将保留，直到执行强制重新索引。",
    manage: "管理",
    enableObsidianSync: "为 Copilot 索引启用 Obsidian 同步",
    enableObsidianSyncDesc:
      "如果启用，索引将存储在 .obsidian 文件夹中，并默认与 Obsidian 同步。如果禁用，它将存储在知识库根目录的 .copilot-index 文件夹中。",
    disableIndexOnMobile: "在移动设备上禁用索引加载",
    disableIndexOnMobileDesc:
      "启用时，Copilot 索引不会在移动设备上加载以节省资源。仅聊天模式可用。来自桌面同步的任何现有索引将被保留。取消选中以在移动设备上启用问答模式。",
    strategy: "策略",
  },
  advanced: {
    userSystemPrompt: "用户系统提示",
    userSystemPromptDesc: "自定义所有消息的系统提示，可能导致意外行为！",
    userSystemPromptPlaceholder: "在此输入您的系统提示...",
    customPromptTemplating: "自定义提示模板",
    customPromptTemplatingDesc:
      "启用模板以处理提示中的变量，如 {activenote}、{foldername} 或 {#tag}。禁用则使用原始提示而不进行任何处理。",
    customPromptsSortStrategy: "自定义提示排序策略",
    customPromptsSortStrategyDesc: "选择如何排序自定义提示（按最近使用或按字母顺序）",
    sortByRecency: "最近使用",
    sortByAlphabetical: "字母顺序",
    enableEncryption: "启用加密",
    enableEncryptionDesc: "为 API 密钥启用加密。",
    debugMode: "调试模式",
    debugModeDesc: "调试模式将在控制台记录一些调试消息。",
  },
  commands: {
    title: "自定义命令",
    description:
      "要触发自定义命令，请在编辑器中高亮文本并从命令面板中选择，或者右键单击并从上下文菜单中选择（如果已配置）。",
    tip: "掌控您的内联编辑命令！您现在可以创建自己的命令或编辑内置命令，以根据您的需求定制功能。",
    table: {
      name: "名称",
      inMenu: "在菜单中",
    },
    actions: {
      edit: "编辑",
      copy: "复制",
      delete: "删除",
      addCommand: "添加命令",
    },
    copyPrefix: "（副本）",
    defaults: {
      fixGrammar: {
        name: "修正语法和拼写",
        prompt:
          "修正 {} 的语法和拼写。保留所有格式、换行和特殊字符。不要添加或删除任何内容。仅返回更正后的文本。",
      },
      translateToChinese: {
        name: "翻译成中文",
        prompt:
          "将 {} 翻译成中文：\n1. 保持意思和语调\n2. 维持适当的文化语境\n3. 保持格式和结构\n仅返回翻译后的文本。",
      },
      summarize: {
        name: "总结",
        prompt: "创建 {} 的要点总结。每个要点应该概括一个关键点。仅返回要点总结。",
      },
      simplify: {
        name: "简化",
        prompt:
          "将 {} 简化为小学六年级阅读水平（11-12岁）。使用简单的句子、常见词汇和清晰的解释。保持原始的关键概念。仅返回简化后的文本。",
      },
      emojify: {
        name: "添加表情符号",
        prompt:
          "为 {} 添加相关的表情符号。遵循以下规则：\n1. 在文本的自然断点处插入表情符号\n2. 不要将两个表情符号放在一起\n3. 保持所有原始文本不变\n4. 选择与上下文和语调匹配的表情符号\n仅返回添加表情符号的文本。",
      },
      makeShorter: {
        name: "缩短",
        prompt:
          "将 {} 缩短至一半长度，同时保留以下元素：\n1. 主要思想和关键点\n2. 基本细节\n3. 原始语调和风格\n仅返回缩短后的文本。",
      },
      makeLonger: {
        name: "扩展",
        prompt:
          "将 {} 扩展至两倍长度，通过：\n1. 添加相关细节和示例\n2. 详述关键点\n3. 保持原始语调和风格\n仅返回扩展后的文本。",
      },
      generateToc: {
        name: "生成目录",
        prompt:
          "为 {} 生成分层目录。使用适当的标题级别（H1、H2、H3等）。如果存在页码，请包含页码。仅返回目录。",
      },
      generateGlossary: {
        name: "生成术语表",
        prompt:
          '从 {} 中创建重要术语、概念和短语的术语表。将每个条目格式化为"术语：定义"。按字母顺序排序条目。仅返回术语表。',
      },
      removeUrls: {
        name: "删除网址",
        prompt:
          "从 {} 中删除所有网址。保留所有其他内容和格式。网址可能有各种格式（http、https、www）。仅返回删除网址后的文本。",
      },
      rewriteAsTweet: {
        name: "改写为推文",
        prompt:
          "将 {} 改写为单条推文，满足以下要求：\n1. 最多280个字符\n2. 使用简洁、有影响力的语言\n3. 保持核心信息\n仅返回推文文本。",
      },
      rewriteAsThread: {
        name: "改写为推文串",
        prompt:
          '将 {} 转换为Twitter推文串，遵循以下规则：\n1. 每条推文必须少于240个字符\n2. 在单独行上以"推文串开始"开头\n3. 用"\\n\\n---\\n\\n"分隔推文\n4. 在单独行上以"推文串结束"结尾\n5. 使内容引人入胜和清晰\n仅返回格式化的推文串。',
      },
      explainLikeChild: {
        name: "像给5岁孩子解释",
        prompt:
          "用5岁孩子能理解的简单术语解释 {}：\n1. 使用基本词汇\n2. 包含简单类比\n3. 分解复杂概念\n仅返回简化的解释。",
      },
      rewriteAsPressRelease: {
        name: "改写为新闻稿",
        prompt:
          "将 {} 转换为专业新闻稿：\n1. 使用正式的新闻风格\n2. 包含标题和日期行\n3. 遵循倒金字塔结构\n仅返回新闻稿格式。",
      },
    },
  },
};

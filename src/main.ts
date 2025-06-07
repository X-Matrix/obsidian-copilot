import { BrevilabsClient } from "@/LLMProviders/brevilabsClient";
import { i18n } from "@/i18n";
import {
  getModelKeyFromModel,
  getSettings,
  sanitizeSettings,
  setSettings,
  subscribeToSettingsChange,
} from "@/settings/model";
import ProjectManager from "@/LLMProviders/projectManager";
import { CustomModel, getCurrentProject } from "@/aiParams";
import { AutocompleteService } from "@/autocomplete/autocompleteService";
import { parseChatContent, updateChatMemory } from "@/chatUtils";
import { registerCommands } from "@/commands";
import CopilotView from "@/components/CopilotView";
import { APPLY_VIEW_TYPE, ApplyView } from "@/components/composer/ApplyView";
import { LoadChatHistoryModal } from "@/components/modals/LoadChatHistoryModal";
import type { SupportedLanguage } from "@/i18n/types";

import { CHAT_VIEWTYPE, DEFAULT_OPEN_AREA, EVENT_NAMES } from "@/constants";
import { registerContextMenu } from "@/contextMenu";
import { encryptAllKeys } from "@/encryptionService";
import { logInfo } from "@/logger";
import { checkIsPlusUser } from "@/plusUtils";
import { HybridRetriever } from "@/search/hybridRetriever";
import VectorStoreManager from "@/search/vectorStoreManager";
import { CopilotSettingTab } from "@/settings/SettingsPage";
import SharedState from "@/sharedState";
import { FileParserManager } from "@/tools/FileParserManager";
import {
  Editor,
  MarkdownView,
  Menu,
  Notice,
  Plugin,
  TFile,
  TFolder,
  WorkspaceLeaf,
} from "obsidian";
import { IntentAnalyzer } from "./LLMProviders/intentAnalyzer";

export default class CopilotPlugin extends Plugin {
  // A chat history that stores the messages sent and received
  // Only reset when the user explicitly clicks "New Chat"
  sharedState: SharedState;
  projectManager: ProjectManager;
  brevilabsClient: BrevilabsClient;
  userMessageHistory: string[] = [];
  vectorStoreManager: VectorStoreManager;
  fileParserManager: FileParserManager;
  settingsUnsubscriber?: () => void;
  private autocompleteService: AutocompleteService;

  async onload(): Promise<void> {
    // 首先加载设置
    await this.loadSettings();

    // 然后初始化语言设置
    const data = await this.loadData();
    const savedLanguage = data?.language || getSettings().language || "en";
    i18n.setLanguage(savedLanguage as SupportedLanguage);

    this.settingsUnsubscriber = subscribeToSettingsChange(async (prev, next) => {
      if (next.enableEncryption) {
        await this.saveData(await encryptAllKeys(next));
      } else {
        await this.saveData(next);
      }
      registerCommands(this, prev, next);
    });
    this.addSettingTab(new CopilotSettingTab(this.app, this));

    // Always have one instance of sharedState in the plugin
    this.sharedState = new SharedState(this);

    this.vectorStoreManager = VectorStoreManager.getInstance();

    // Initialize BrevilabsClient
    this.brevilabsClient = BrevilabsClient.getInstance();
    this.brevilabsClient.setPluginVersion(this.manifest.version);
    checkIsPlusUser();

    // Initialize ProjectManager
    this.projectManager = ProjectManager.getInstance(this.app, this.vectorStoreManager, this);

    // Initialize FileParserManager early with other core services
    this.fileParserManager = new FileParserManager(this.brevilabsClient, this.app.vault);

    this.registerView(CHAT_VIEWTYPE, (leaf: WorkspaceLeaf) => new CopilotView(leaf, this));
    this.registerView(APPLY_VIEW_TYPE, (leaf: WorkspaceLeaf) => new ApplyView(leaf));

    this.initActiveLeafChangeHandler();

    this.addRibbonIcon("message-square", "Open Copilot Chat", (evt: MouseEvent) => {
      this.activateView();
    });

    registerCommands(this, undefined, getSettings());

    IntentAnalyzer.initTools(this.app.vault);

    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu: Menu, editor: Editor) => {
        const selectedText = editor.getSelection().trim();
        if (selectedText) {
          this.handleContextMenu(menu, editor);
        }
      })
    );

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (leaf && leaf.view instanceof MarkdownView) {
          const file = leaf.view.file;
          if (file) {
            const activeCopilotView = this.app.workspace
              .getLeavesOfType(CHAT_VIEWTYPE)
              .find((leaf) => leaf.view instanceof CopilotView)?.view as CopilotView;

            if (activeCopilotView) {
              const event = new CustomEvent(EVENT_NAMES.ACTIVE_LEAF_CHANGE);
              activeCopilotView.eventTarget.dispatchEvent(event);
            }
          }
        }
      })
    );

    // Initialize autocomplete service
    this.autocompleteService = AutocompleteService.getInstance(this);
  }

  async onunload() {
    // Clean up VectorStoreManager
    if (this.vectorStoreManager) {
      this.vectorStoreManager.onunload();
    }

    if (this.projectManager) {
      this.projectManager.onunload();
    }

    this.settingsUnsubscriber?.();
    this.autocompleteService?.destroy();

    logInfo("Copilot plugin unloaded");
  }

  updateUserMessageHistory(newMessage: string) {
    this.userMessageHistory = [...this.userMessageHistory, newMessage];
  }

  async autosaveCurrentChat() {
    if (getSettings().autosaveChat) {
      const chatView = this.app.workspace.getLeavesOfType(CHAT_VIEWTYPE)[0]?.view as CopilotView;
      if (chatView && chatView.sharedState.chatHistory.length > 0) {
        await chatView.saveChat();
      }
    }
  }

  async processText(
    editor: Editor,
    eventType: string,
    eventSubtype?: string,
    checkSelectedText = true
  ) {
    const selectedText = await editor.getSelection();

    const isChatWindowActive = this.app.workspace.getLeavesOfType(CHAT_VIEWTYPE).length > 0;

    if (!isChatWindowActive) {
      await this.activateView();
    }

    // Without the timeout, the view is not yet active
    setTimeout(() => {
      const activeCopilotView = this.app.workspace
        .getLeavesOfType(CHAT_VIEWTYPE)
        .find((leaf) => leaf.view instanceof CopilotView)?.view as CopilotView;
      if (activeCopilotView && (!checkSelectedText || selectedText)) {
        const event = new CustomEvent(eventType, { detail: { selectedText, eventSubtype } });
        activeCopilotView.eventTarget.dispatchEvent(event);
      }
    }, 0);
  }

  processSelection(editor: Editor, eventType: string, eventSubtype?: string) {
    this.processText(editor, eventType, eventSubtype);
  }

  emitChatIsVisible() {
    const activeCopilotView = this.app.workspace
      .getLeavesOfType(CHAT_VIEWTYPE)
      .find((leaf) => leaf.view instanceof CopilotView)?.view as CopilotView;

    if (activeCopilotView) {
      const event = new CustomEvent(EVENT_NAMES.CHAT_IS_VISIBLE);
      activeCopilotView.eventTarget.dispatchEvent(event);
    }
  }

  initActiveLeafChangeHandler() {
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (!leaf) {
          return;
        }
        if (leaf.getViewState().type === CHAT_VIEWTYPE) {
          this.emitChatIsVisible();
        }
      })
    );
  }

  private getCurrentEditorOrDummy(): Editor {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    return {
      getSelection: () => {
        const selection = activeView?.editor?.getSelection();
        if (selection) return selection;
        // Default to the entire active file if no selection
        const activeFile = this.app.workspace.getActiveFile();
        return activeFile ? this.app.vault.cachedRead(activeFile) : "";
      },
      replaceSelection: activeView?.editor?.replaceSelection.bind(activeView.editor) || (() => {}),
    } as Partial<Editor> as Editor;
  }

  processCustomPrompt(eventType: string, customPrompt: string) {
    const editor = this.getCurrentEditorOrDummy();
    this.processText(editor, eventType, customPrompt, false);
  }

  toggleView() {
    const leaves = this.app.workspace.getLeavesOfType(CHAT_VIEWTYPE);
    if (leaves.length > 0) {
      this.deactivateView();
    } else {
      this.activateView();
    }
  }

  async activateView(): Promise<void> {
    const leaves = this.app.workspace.getLeavesOfType(CHAT_VIEWTYPE);
    if (leaves.length === 0) {
      if (getSettings().defaultOpenArea === DEFAULT_OPEN_AREA.VIEW) {
        const rightLeaf = this.app.workspace.getRightLeaf(false);
        if (rightLeaf) {
          await rightLeaf.setViewState({
            type: CHAT_VIEWTYPE,
            active: true,
          });
        }
      } else {
        await this.app.workspace.getLeaf(true).setViewState({
          type: CHAT_VIEWTYPE,
          active: true,
        });
      }
    } else {
      this.app.workspace.revealLeaf(leaves[0]);
    }
    this.emitChatIsVisible();
  }

  async deactivateView() {
    this.app.workspace.detachLeavesOfType(CHAT_VIEWTYPE);
  }

  async loadSettings() {
    const savedSettings = await this.loadData();
    const sanitizedSettings = sanitizeSettings(savedSettings);

    setSettings(sanitizedSettings);

    // 确保语言设置也被应用到 i18n
    if (sanitizedSettings.language) {
      i18n.setLanguage(sanitizedSettings.language as SupportedLanguage);
    }
  }

  mergeActiveModels(
    existingActiveModels: CustomModel[],
    builtInModels: CustomModel[]
  ): CustomModel[] {
    const modelMap = new Map<string, CustomModel>();

    // Create a unique key for each model, it's model (name + provider)

    // Add or update existing models in the map
    existingActiveModels.forEach((model) => {
      const key = getModelKeyFromModel(model);
      const existingModel = modelMap.get(key);
      if (existingModel) {
        // If it's a built-in model, preserve the built-in status
        modelMap.set(key, {
          ...model,
          isBuiltIn: existingModel.isBuiltIn || model.isBuiltIn,
        });
      } else {
        modelMap.set(key, model);
      }
    });

    return Array.from(modelMap.values());
  }

  handleContextMenu = (menu: Menu, editor: Editor): void => {
    registerContextMenu(menu, editor, this);
  };

  async loadCopilotChatHistory() {
    const chatFiles = await this.getChatHistoryFiles();
    if (chatFiles.length === 0) {
      new Notice("No chat history found.");
      return;
    }
    new LoadChatHistoryModal(this.app, chatFiles, this.loadChatHistory.bind(this)).open();
  }

  async getChatHistoryFiles(): Promise<TFile[]> {
    const folder = this.app.vault.getAbstractFileByPath(getSettings().defaultSaveFolder);
    if (!(folder instanceof TFolder)) {
      return [];
    }

    const files = await this.app.vault.getMarkdownFiles();
    const folderFiles = files.filter((file) => file.path.startsWith(folder.path));

    // Get current project ID if in a project
    const currentProject = getCurrentProject();
    const currentProjectId = currentProject?.id;

    if (currentProjectId) {
      // In project mode: return only files with this project's ID prefix
      const projectPrefix = `${currentProjectId}__`;
      return folderFiles.filter((file) => file.basename.startsWith(projectPrefix));
    } else {
      // In non-project mode: return only files without any project ID prefix
      // This assumes project IDs always use the format projectId__ as prefix
      return folderFiles.filter((file) => {
        // Check if the filename has any projectId__ prefix pattern
        return !file.basename.match(/^[a-zA-Z0-9-]+__/);
      });
    }
  }

  async loadChatHistory(file: TFile) {
    const content = await this.app.vault.read(file);
    const messages = parseChatContent(content);
    this.sharedState.clearChatHistory();
    messages.forEach((message) => this.sharedState.addMessage(message));

    await updateChatMemory(messages, this.projectManager.getCurrentChainManager().memoryManager);

    const existingView = this.app.workspace.getLeavesOfType(CHAT_VIEWTYPE)[0];
    if (!existingView) {
      this.activateView();
    } else {
      const copilotView = existingView.view as CopilotView;
      copilotView.updateView();
    }
  }

  async handleNewChat() {
    await this.autosaveCurrentChat();
    this.sharedState.clearChatHistory();
    this.projectManager.getCurrentChainManager().memoryManager.clearChatMemory();

    const existingView = this.app.workspace.getLeavesOfType(CHAT_VIEWTYPE)[0];
    if (existingView) {
      const copilotView = existingView.view as CopilotView;
      copilotView.updateView();
    } else {
      await this.activateView();
    }
  }

  async newChat() {
    // Just delegate to the shared method
    await this.handleNewChat();
  }

  async customSearchDB(query: string, salientTerms: string[], textWeight: number): Promise<any[]> {
    const hybridRetriever = new HybridRetriever({
      minSimilarityScore: 0.3,
      maxK: 20,
      salientTerms: salientTerms,
      textWeight: textWeight,
    });

    const results = await hybridRetriever.getOramaChunks(query, salientTerms);
    return results.map((doc) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
    }));
  }

  // 新增：语言设置方法
  async setLanguage(language: string) {
    i18n.setLanguage(language as SupportedLanguage);

    // 更新设置
    const currentSettings = getSettings();
    const newSettings = { ...currentSettings, language };
    setSettings(newSettings);

    // 保存到插件数据
    const data = (await this.loadData()) || {};
    data.language = language;
    await this.saveData(data);

    // 触发界面更新
    this.app.workspace.trigger("copilot:language-changed");
  }
}

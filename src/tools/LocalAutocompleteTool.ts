import { logInfo, logError } from "@/logger";
import ChatModelManager from "@/LLMProviders/chatModelManager";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export interface LocalAutocompleteResponse {
  completion: string;
  success: boolean;
  error?: string;
}

export class LocalAutocompleteTool {
  private static instance: LocalAutocompleteTool;
  private chatModelManager: ChatModelManager;

  static getInstance(): LocalAutocompleteTool {
    if (!LocalAutocompleteTool.instance) {
      LocalAutocompleteTool.instance = new LocalAutocompleteTool();
    }
    return LocalAutocompleteTool.instance;
  }

  private constructor() {
    this.chatModelManager = ChatModelManager.getInstance();
  }

  /**
   * 检查本地自动补全是否可用
   */
  async isLocalAutocompleteSupported(): Promise<boolean> {
    try {
      // 检查是否有配置的聊天模型
      const chatModel = this.chatModelManager.getChatModel();
      if (!chatModel) {
        logError("本地聊天模型未配置");
        return false;
      }

      // 简单测试调用
      const testResponse = await chatModel.invoke([
        new SystemMessage("You are a helpful assistant."),
        new HumanMessage("Hi"),
      ]);

      return testResponse && testResponse.content ? true : false;
    } catch (error) {
      logError("本地LLM连接测试失败:", error);
      return false;
    }
  }

  /**
   * 使用本地LLM进行自动补全
   */
  async generateCompletion(
    prefix: string,
    noteContext: string = "",
    relevantNotes: string = ""
  ): Promise<LocalAutocompleteResponse> {
    try {
      const chatModel = this.chatModelManager.getChatModel();
      if (!chatModel) {
        return {
          completion: "",
          success: false,
          error: "本地聊天模型未配置",
        };
      }

      // 构建系统提示词和用户提示词
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(prefix, noteContext, relevantNotes);

      logInfo("发送自动补全请求到本地LLM:", {
        prefix: prefix.slice(-50),
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length,
      });

      const response = await chatModel.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ]);

      const content = response.content as string;

      if (!content || typeof content !== "string") {
        throw new Error("本地LLM返回的数据格式不正确");
      }

      // 清理和处理补全内容
      const completion = this.processCompletion(content, prefix);

      logInfo("本地自动补全成功:", { completionLength: completion.length });

      return {
        completion,
        success: true,
      };
    } catch (error) {
      logError("本地自动补全失败:", error);
      return {
        completion: "",
        success: false,
        error: error.message || "未知错误",
      };
    }
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(): string {
    return `你是一个智能的文本补全助手。你的任务是根据提供的上下文为用户的文本提供自然、连贯的续写补全。

规则:
1. 只返回补全的内容，不要重复已有的文本
2. 补全应该自然流畅，符合上下文语境
3. 不要添加解释、说明或其他多余内容
4. 补全长度控制在1-2句话内
5. 保持原文的语言风格和语调
6. 如果是中文内容，用中文补全；如果是英文内容，用英文补全
7. 避免生成不相关或偏离主题的内容

示例:
输入: "今天的天气很好，我决定"
输出: "出去散步享受阳光"

输入: "The new AI model shows impressive results in"
输出: "natural language processing tasks"`;
  }

  /**
   * 构建用户提示词
   */
  private buildUserPrompt(prefix: string, noteContext: string, relevantNotes: string): string {
    let prompt = "";

    // 添加相关笔记作为上下文
    if (relevantNotes && relevantNotes.trim()) {
      prompt += `相关笔记内容:\n${relevantNotes.trim()}\n\n`;
    }

    // 添加当前笔记上下文
    if (noteContext && noteContext.trim()) {
      prompt += `当前笔记上下文:\n${noteContext.trim()}\n\n`;
    }

    // 添加需要补全的文本
    prompt += `请为以下文本提供自然的续写补全:\n\n${prefix}`;

    return prompt;
  }

  /**
   * 处理和清理补全内容
   */
  private processCompletion(rawCompletion: string, prefix: string): string {
    let completion = rawCompletion.trim();

    // 移除可能的引号包装
    if (
      (completion.startsWith('"') && completion.endsWith('"')) ||
      (completion.startsWith("'") && completion.endsWith("'"))
    ) {
      completion = completion.slice(1, -1);
    }

    // 移除可能重复的前缀
    const prefixWords = prefix.trim().split(/\s+/).slice(-5); // 取最后5个词
    for (const word of prefixWords) {
      if (completion.toLowerCase().startsWith(word.toLowerCase())) {
        completion = completion.slice(word.length).trim();
      }
    }

    // 确保补全不以标点符号开始（除非是合适的标点）
    const validStartingPunctuation = ['"', "'", "(", "[", "{"];
    if (
      completion.length > 0 &&
      /^[^\w\s\u4e00-\u9fff]/.test(completion) &&
      !validStartingPunctuation.includes(completion[0])
    ) {
      completion = completion.slice(1).trim();
    }

    // 限制长度，避免过长的补全
    const maxLength = 100;
    if (completion.length > maxLength) {
      // 在适当的位置截断
      const truncated = completion.slice(0, maxLength);
      const lastSpace = truncated.lastIndexOf(" ");
      const lastPunctuation = Math.max(
        truncated.lastIndexOf("."),
        truncated.lastIndexOf("。"),
        truncated.lastIndexOf("!"),
        truncated.lastIndexOf("！"),
        truncated.lastIndexOf("?"),
        truncated.lastIndexOf("？")
      );

      if (lastPunctuation > lastSpace && lastPunctuation > maxLength * 0.7) {
        completion = truncated.slice(0, lastPunctuation + 1);
      } else if (lastSpace > maxLength * 0.7) {
        completion = truncated.slice(0, lastSpace);
      } else {
        completion = truncated;
      }
    }

    return completion;
  }

  /**
   * 批量生成多个补全选项
   */
  async generateMultipleCompletions(
    prefix: string,
    noteContext: string = "",
    relevantNotes: string = "",
    count: number = 3
  ): Promise<LocalAutocompleteResponse[]> {
    const promises = Array(count)
      .fill(null)
      .map(() => this.generateCompletion(prefix, noteContext, relevantNotes));

    try {
      const results = await Promise.allSettled(promises);
      return results.map((result) => {
        if (result.status === "fulfilled") {
          return result.value;
        } else {
          return {
            completion: "",
            success: false,
            error: result.reason?.message || "生成失败",
          };
        }
      });
    } catch (error) {
      logError("批量生成自动补全失败:", error);
      return Array(count).fill({
        completion: "",
        success: false,
        error: "批量生成失败",
      });
    }
  }

  // 测试辅助方法
  public testProcessCompletion(rawCompletion: string, prefix: string) {
    return this.processCompletion(rawCompletion, prefix);
  }

  public testBuildSystemPrompt() {
    return this.buildSystemPrompt();
  }

  public testBuildUserPrompt(prefix: string, noteContext: string, relevantNotes: string) {
    return this.buildUserPrompt(prefix, noteContext, relevantNotes);
  }
}

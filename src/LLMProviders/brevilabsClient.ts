import { BREVILABS_API_BASE_URL } from "@/constants";
import { getDecryptedKey } from "@/encryptionService";
import { logInfo } from "@/logger";
import { turnOffPlus, turnOnPlus } from "@/plusUtils";
import { getSettings } from "@/settings/model";
import { Buffer } from "buffer";
import { Notice } from "obsidian";
import { LocalWebSearchTool } from "@/tools/LocalWebSearchTool";
import { LocalUrl4llmTool, LocalUrl4llmResponse } from "@/tools/LocalUrl4llmTool";
import { LocalAutocompleteTool, LocalAutocompleteResponse } from "@/tools/LocalAutocompleteTool";

export interface BrocaResponse {
  response: {
    tool_calls: Array<{
      tool: string;
      args: {
        [key: string]: any;
      };
    }>;
    salience_terms: string[];
  };
  elapsed_time_ms: number;
  detail?: string;
}

export interface RerankResponse {
  response: {
    object: string;
    data: Array<{
      relevance_score: number;
      index: number;
    }>;
    model: string;
    usage: {
      total_tokens: number;
    };
  };
  elapsed_time_ms: number;
}

export interface ToolCall {
  tool: any;
  args: any;
}

export interface Url4llmResponse {
  response: any;
  elapsed_time_ms: number;
}

export interface Pdf4llmResponse {
  response: any;
  elapsed_time_ms: number;
}

export interface Docs4llmResponse {
  response: any;
  elapsed_time_ms: number;
}

export interface WebSearchResponse {
  response: {
    choices: [
      {
        message: {
          content: string;
        };
      },
    ];
    citations: string[];
  };
  elapsed_time_ms: number;
}

export interface Youtube4llmResponse {
  response: {
    transcript: string;
  };
  elapsed_time_ms: number;
}

export interface LicenseResponse {
  is_valid: boolean;
  plan: string;
}

export interface AutocompleteResponse {
  response: {
    completion: string;
  };
  elapsed_time_ms: number;
}

export interface WordCompleteResponse {
  response: {
    selected_word: string;
  };
  elapsed_time_ms: number;
}

export class BrevilabsClient {
  private static instance: BrevilabsClient;
  private pluginVersion: string = "Unknown";

  static getInstance(): BrevilabsClient {
    if (!BrevilabsClient.instance) {
      BrevilabsClient.instance = new BrevilabsClient();
    }
    return BrevilabsClient.instance;
  }

  private checkLicenseKey() {
    if (!getSettings().plusLicenseKey) {
      new Notice(
        "Copilot Plus license key not found. Please enter your license key in the settings."
      );
      throw new Error("License key not initialized");
    }
  }

  setPluginVersion(pluginVersion: string) {
    this.pluginVersion = pluginVersion;
  }

  private async makeRequest<T>(
    endpoint: string,
    body: any,
    method = "POST",
    excludeAuthHeader = false,
    skipLicenseCheck = false
  ): Promise<{ data: T | null; error?: Error }> {
    if (!skipLicenseCheck) {
      this.checkLicenseKey();
    }

    body.user_id = getSettings().userId;

    const url = new URL(`${BREVILABS_API_BASE_URL}${endpoint}`);
    if (method === "GET") {
      // Add query parameters for GET requests
      Object.entries(body).forEach(([key, value]) => {
        url.searchParams.append(key, value as string);
      });
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(!excludeAuthHeader && {
          Authorization: `Bearer ${await getDecryptedKey(getSettings().plusLicenseKey)}`,
        }),
        "X-Client-Version": this.pluginVersion,
      },
      ...(method === "POST" && { body: JSON.stringify(body) }),
    });
    const data = await response.json();
    if (!response.ok) {
      try {
        const errorDetail = data.detail;
        const error = new Error(errorDetail.reason);
        error.name = errorDetail.error;
        return { data: null, error };
      } catch {
        return { data: null, error: new Error("Unknown error") };
      }
    }
    logInfo(`==== ${endpoint} request ====:`, data);

    return { data };
  }

  private async makeFormDataRequest<T>(
    endpoint: string,
    formData: FormData,
    skipLicenseCheck = false
  ): Promise<{ data: T | null; error?: Error }> {
    if (!skipLicenseCheck) {
      this.checkLicenseKey();
    }

    // Add user_id to FormData
    formData.append("user_id", getSettings().userId);

    const url = new URL(`${BREVILABS_API_BASE_URL}${endpoint}`);

    try {
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          // No Content-Type header - browser will set it automatically with boundary
          Authorization: `Bearer ${await getDecryptedKey(getSettings().plusLicenseKey)}`,
          "X-Client-Version": this.pluginVersion,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        try {
          const errorDetail = data.detail;
          const error = new Error(errorDetail.reason);
          error.name = errorDetail.error;
          return { data: null, error };
        } catch {
          return { data: null, error: new Error(`HTTP error: ${response.status}`) };
        }
      }
      logInfo(`==== ${endpoint} FormData request ====:`, data);
      return { data };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Validate the license key and update the isPlusUser setting.
   * @returns true if the license key is valid, false if the license key is invalid, and undefined if
   * unknown error.
   */
  async validateLicenseKey(): Promise<{ isValid: boolean | undefined; plan?: string }> {
    const { data, error } = await this.makeRequest<LicenseResponse>(
      "/license",
      {
        license_key: await getDecryptedKey(getSettings().plusLicenseKey),
      },
      "POST",
      true,
      true
    );
    if (error) {
      if (error.message === "Invalid license key") {
        turnOffPlus();
        return { isValid: false };
      }
      // Do nothing if the error is not about the invalid license key
      return { isValid: undefined };
    }
    turnOnPlus();
    return { isValid: true, plan: data?.plan };
  }

  async broca(userMessage: string, isProjectMode: boolean): Promise<BrocaResponse> {
    const { data, error } = await this.makeRequest<BrocaResponse>("/broca", {
      message: userMessage,
      is_project_mode: isProjectMode,
    });
    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error("No data returned from broca");
    }

    return data;
  }

  async rerank(query: string, documents: string[]): Promise<RerankResponse> {
    const { data, error } = await this.makeRequest<RerankResponse>("/rerank", {
      query,
      documents,
      model: "rerank-2",
    });
    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error("No data returned from rerank");
    }

    return data;
  }

  async url4llm(url: string): Promise<Url4llmResponse> {
    const { data, error } = await this.makeRequest<Url4llmResponse>("/url4llm", { url });
    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error("No data returned from url4llm");
    }

    return data;
  }

  async pdf4llm(binaryContent: ArrayBuffer): Promise<Pdf4llmResponse> {
    // Convert ArrayBuffer to base64 string
    const base64Content = Buffer.from(binaryContent).toString("base64");

    const { data, error } = await this.makeRequest<Pdf4llmResponse>("/pdf4llm", {
      pdf: base64Content,
    });
    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error("No data returned from pdf4llm");
    }

    return data;
  }

  async docs4llm(binaryContent: ArrayBuffer, fileType: string): Promise<Docs4llmResponse> {
    // Create a FormData object
    const formData = new FormData();

    // Convert ArrayBuffer to Blob with appropriate mime type
    const mimeType = this.getMimeTypeFromExtension(fileType);
    const blob = new Blob([binaryContent], { type: mimeType });

    // Create a File object with a filename including the extension
    const fileName = `file.${fileType}`;
    const file = new File([blob], fileName, { type: mimeType });

    // Append the file to FormData
    formData.append("files", file);

    // Add file_type as a regular field
    formData.append("file_type", fileType);

    const { data, error } = await this.makeFormDataRequest<Docs4llmResponse>("/docs4llm", formData);

    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error("No data returned from docs4llm");
    }

    return data;
  }

  private getMimeTypeFromExtension(extension: string): string {
    const mimeMap: Record<string, string> = {
      // Documents
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      epub: "application/epub+zip",
      txt: "text/plain",
      rtf: "application/rtf",

      // Images
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      bmp: "image/bmp",
      svg: "image/svg+xml",
      tiff: "image/tiff",
      webp: "image/webp",

      // Web
      html: "text/html",
      htm: "text/html",

      // Spreadsheets
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      xls: "application/vnd.ms-excel",
      csv: "text/csv",

      // Audio
      mp3: "audio/mpeg",
      mp4: "video/mp4",
      wav: "audio/wav",
      webm: "video/webm",
    };

    return mimeMap[extension.toLowerCase()] || "application/octet-stream";
  }

  async webSearch(query: string): Promise<WebSearchResponse> {
    // 检查是否使用本地websearch
    const useLocalWebSearch = getSettings().useLocalWebSearch || true;

    if (useLocalWebSearch) {
      try {
        const localSearchTool = LocalWebSearchTool.getInstance();
        const content = await localSearchTool.searchAndExtractContent(query);

        // 格式化为WebSearchResponse格式
        return {
          response: {
            choices: [
              {
                message: {
                  content: content,
                },
              },
            ],
            citations: [], // 本地搜索的引用已包含在content中
          },
          elapsed_time_ms: 0,
        };
      } catch (error) {
        console.error("本地网页搜索失败，fallback到远程搜索:", error);
        // fallback到远程搜索
      }
    }

    // 原有的远程websearch逻辑
    const { data, error } = await this.makeRequest<WebSearchResponse>("/websearch", { query });
    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error("No data returned from websearch");
    }

    return data;
  }

  async youtube4llm(url: string): Promise<Youtube4llmResponse> {
    const { data, error } = await this.makeRequest<Youtube4llmResponse>("/youtube4llm", { url });
    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error("No data returned from youtube4llm");
    }

    return data;
  }

  async autocomplete(
    prefix: string,
    noteContext: string = "",
    relevant_notes: string = ""
  ): Promise<AutocompleteResponse> {
    // 检查是否启用自动补全功能
    const settings = getSettings();
    const autocompleteEnabled = settings.enableAutocomplete || true;

    const useLocalAutocomplete = autocompleteEnabled;

    if (useLocalAutocomplete) {
      try {
        const localAutocompleteTool = LocalAutocompleteTool.getInstance();
        const result = await localAutocompleteTool.generateCompletion(
          prefix,
          noteContext,
          relevant_notes
        );

        if (result.success) {
          // 格式化为AutocompleteResponse格式
          return {
            response: {
              completion: result.completion,
            },
            elapsed_time_ms: 0,
          };
        } else {
          console.error("本地自动补全失败，fallback到远程补全:", result.error);
          // fallback到远程补全
        }
      } catch (error) {
        console.error("本地自动补全失败，fallback到远程补全:", error);
        // fallback到远程补全
      }
    }

    // 原有的远程autocomplete逻辑
    const { data, error } = await this.makeRequest<AutocompleteResponse>("/autocomplete", {
      prompt: prefix,
      note_context: noteContext,
      relevant_notes: relevant_notes,
      max_tokens: 64,
    });
    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error("No data returned from autocomplete");
    }
    return data;
  }

  async wordcomplete(
    prefix: string,
    suffix: string = "",
    suggestions: string[]
  ): Promise<WordCompleteResponse> {
    const { data, error } = await this.makeRequest<WordCompleteResponse>("/wordcomplete", {
      prefix: prefix,
      suffix: suffix,
      suggestions: suggestions,
    });
    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error("No data returned from wordcomplete");
    }
    return data;
  }

  async localUrl4llm(url: string): Promise<LocalUrl4llmResponse> {
    logInfo(`Extracting content from URL locally: ${url}`);

    try {
      const tool = LocalUrl4llmTool.getInstance();
      const result = await tool.extractContent(url);

      if (!result.success) {
        throw new Error(result.error || "Failed to extract content from URL");
      }

      logInfo(`Successfully extracted ${result.content.length} characters from ${url}`);
      return result;
    } catch (error) {
      logInfo(`Local URL extraction failed for ${url}: ${error}`);
      throw error;
    }
  }

  // Batch URL processing with enhanced error handling
  async localBatchUrl4llm(urls: string[]): Promise<LocalUrl4llmResponse[]> {
    logInfo(`Extracting content from ${urls.length} URLs locally`);

    if (urls.length === 0) {
      return [];
    }

    const tool = LocalUrl4llmTool.getInstance();
    try {
      const results = await tool.extractMultipleUrls(urls);
      const successCount = results.filter((r) => r.success).length;

      logInfo(`Successfully extracted content from ${successCount}/${urls.length} URLs`);

      // 如果所有URL都失败了，记录警告
      if (successCount === 0) {
        console.warn(
          "All URL extractions failed. Consider checking playwright installation or switching to remote processing."
        );
      }

      return results;
    } catch (error) {
      logInfo(`Batch URL processing failed: ${error}`);
      // 返回所有URL的失败结果
      return urls.map((url) => ({
        content: "",
        title: "",
        url,
        success: false,
        error: String(error),
      }));
    }
  }

  // Enhanced url4llm method that falls back to local processing with better error messages
  async enhancedUrl4llm(
    url: string,
    useLocal: boolean = false
  ): Promise<Url4llmResponse | LocalUrl4llmResponse> {
    if (useLocal) {
      try {
        return await this.localUrl4llm(url);
      } catch (error) {
        logInfo(`Local URL processing failed for ${url}, error: ${error.message}`);

        // 如果本地处理失败，提供详细的错误信息
        const localResult: LocalUrl4llmResponse = {
          content: "",
          title: "",
          url,
          success: false,
          error: `本地URL处理失败: ${error.message}`,
        };

        return localResult;
      }
    }

    try {
      // Try remote first
      logInfo(`Trying remote URL processing for: ${url}`);
      return await this.url4llm(url);
    } catch (remoteError) {
      logInfo(
        `Remote URL processing failed for ${url}, falling back to local: ${remoteError.message}`
      );

      try {
        // Fallback to local processing
        const localResult = await this.localUrl4llm(url);
        logInfo(`Successfully fell back to local processing for: ${url}`);

        // Convert to match original interface for backward compatibility
        return {
          response: localResult.content,
          elapsed_time_ms: 0,
        };
      } catch (localError) {
        logInfo(`Both remote and local URL processing failed for ${url}`);

        // 如果都失败了，返回详细的错误信息
        throw new Error(`URL处理完全失败:
远程处理错误: ${remoteError.message}
本地处理错误: ${localError.message}

建议:
1. 检查网络连接和URL有效性
2. 确保playwright已正确安装 (npm install playwright)
3. 联系支持团队如果问题持续存在`);
      }
    }
  }

  // 检查本地URL处理是否可用
  async checkLocalUrlProcessingAvailability(): Promise<{ available: boolean; message: string }> {
    try {
      const tool = LocalUrl4llmTool.getInstance();
      const isSupported = await tool.isLocalUrlProcessingSupported();

      if (isSupported) {
        return {
          available: true,
          message: "本地URL处理功能可用",
        };
      } else {
        return {
          available: false,
          message:
            "本地URL处理功能不可用。请安装playwright: npm install playwright && npx playwright install chromium",
        };
      }
    } catch (error) {
      return {
        available: false,
        message: `本地URL处理检查失败: ${error.message}`,
      };
    }
  }

  // 本地自动补全方法
  async localAutocomplete(
    prefix: string,
    noteContext: string = "",
    relevantNotes: string = ""
  ): Promise<LocalAutocompleteResponse> {
    logInfo(`Generating autocomplete locally for prefix: ${prefix.slice(-20)}...`);

    try {
      const tool = LocalAutocompleteTool.getInstance();
      const result = await tool.generateCompletion(prefix, noteContext, relevantNotes);

      if (!result.success) {
        throw new Error(result.error || "Failed to generate autocomplete locally");
      }

      logInfo(`Successfully generated local autocomplete: ${result.completion.slice(0, 20)}...`);
      return result;
    } catch (error) {
      logInfo(`Local autocomplete failed: ${error}`);
      throw error;
    }
  }

  // 增强的自动补全方法，支持本地fallback
  async enhancedAutocomplete(
    prefix: string,
    noteContext: string = "",
    relevantNotes: string = "",
    useLocal: boolean = false
  ): Promise<AutocompleteResponse | LocalAutocompleteResponse> {
    if (useLocal) {
      try {
        return await this.localAutocomplete(prefix, noteContext, relevantNotes);
      } catch (error) {
        logInfo(`Local autocomplete failed for prefix, error: ${error.message}`);

        const localResult: LocalAutocompleteResponse = {
          completion: "",
          success: false,
          error: `本地自动补全失败: ${error.message}`,
        };

        return localResult;
      }
    }

    try {
      // Try remote first
      logInfo(`Trying remote autocomplete`);
      return await this.autocomplete(prefix, noteContext, relevantNotes);
    } catch (remoteError) {
      logInfo(`Remote autocomplete failed, falling back to local: ${remoteError.message}`);

      try {
        // Fallback to local processing
        const localResult = await this.localAutocomplete(prefix, noteContext, relevantNotes);
        logInfo(`Successfully fell back to local autocomplete`);

        // Convert to match original interface for backward compatibility
        return {
          response: {
            completion: localResult.completion,
          },
          elapsed_time_ms: 0,
        };
      } catch (localError) {
        logInfo(`Both remote and local autocomplete failed`);

        throw new Error(`自动补全完全失败:
远程补全错误: ${remoteError.message}
本地补全错误: ${localError.message}

建议:
1. 检查网络连接
2. 确保本地LLM服务正在运行
3. 检查本地LLM URL配置是否正确`);
      }
    }
  }

  // 检查本地自动补全是否可用
  async checkLocalAutocompleteAvailability(): Promise<{ available: boolean; message: string }> {
    try {
      const tool = LocalAutocompleteTool.getInstance();
      const isSupported = await tool.isLocalAutocompleteSupported();

      if (isSupported) {
        return {
          available: true,
          message: "本地自动补全功能可用",
        };
      } else {
        return {
          available: false,
          message: "本地自动补全功能不可用。请确保本地LLM服务正在运行并配置正确的URL",
        };
      }
    } catch (error) {
      return {
        available: false,
        message: `本地自动补全检查失败: ${error.message}`,
      };
    }
  }
}

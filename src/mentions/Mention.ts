import { ImageProcessor } from "@/imageProcessing/imageProcessor";
import { BrevilabsClient, Url4llmResponse } from "@/LLMProviders/brevilabsClient";
import { LocalUrl4llmResponse } from "@/tools/LocalUrl4llmTool";
import { isYoutubeUrl } from "@/utils";
import { getSettings } from "@/settings/model";

export interface MentionData {
  type: string;
  original: string;
  processed?: string;
}

export class Mention {
  private static instance: Mention;
  private mentions: Map<string, MentionData>;
  private brevilabsClient: BrevilabsClient;

  private constructor() {
    this.mentions = new Map();
    this.brevilabsClient = BrevilabsClient.getInstance();
  }

  static getInstance(): Mention {
    if (!Mention.instance) {
      Mention.instance = new Mention();
    }
    return Mention.instance;
  }

  extractAllUrls(text: string): string[] {
    // Match URLs and trim any trailing commas
    const urlRegex = /https?:\/\/[^\s"'<>]+/g;
    return (text.match(urlRegex) || [])
      .map((url) => url.replace(/,+$/, "")) // Remove trailing commas
      .filter((url, index, self) => self.indexOf(url) === index); // Remove duplicates
  }

  extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s"'<>]+/g;
    return (text.match(urlRegex) || [])
      .map((url) => url.replace(/,+$/, ""))
      .filter((url, index, self) => self.indexOf(url) === index)
      .filter((url) => !isYoutubeUrl(url));
  }

  async processUrl(url: string): Promise<Url4llmResponse | LocalUrl4llmResponse> {
    try {
      const settings = getSettings();
      // Use local processing if configured, defaulting to false
      const useLocalProcessing = settings.useLocalUrlProcessing || false;

      return await this.brevilabsClient.enhancedUrl4llm(url, useLocalProcessing);
    } catch (error) {
      console.error(`Error processing URL ${url}:`, error);
      return { response: url, elapsed_time_ms: 0 };
    }
  }

  // For non-youtube URLs
  async processUrls(text: string): Promise<{ urlContext: string; imageUrls: string[] }> {
    const urls = this.extractUrls(text);
    let urlContext = "";
    const imageUrls: string[] = [];

    // Return empty string if no URLs to process
    if (urls.length === 0) {
      return { urlContext: "", imageUrls: [] };
    }

    // Process all URLs concurrently
    const processPromises = urls.map(async (url) => {
      // Check if it's an image URL
      if (await ImageProcessor.isImageUrl(url, app.vault)) {
        imageUrls.push(url);
        return null;
      }

      if (!this.mentions.has(url)) {
        const processed = await this.processUrl(url);
        const processedContent = "content" in processed ? processed.content : processed.response;

        this.mentions.set(url, {
          type: "url",
          original: url,
          processed: processedContent,
        });
      }
      return this.mentions.get(url);
    });

    const processedUrls = await Promise.all(processPromises);

    // Append all processed content
    processedUrls.forEach((urlData) => {
      if (urlData?.processed) {
        urlContext += `\n\nContent from ${urlData.original}:\n${urlData.processed}`;
      }
    });

    return { urlContext, imageUrls };
  }

  getMentions(): Map<string, MentionData> {
    return this.mentions;
  }

  clearMentions(): void {
    this.mentions.clear();
  }
}

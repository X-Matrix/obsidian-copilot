import ChatModelManager from "@/LLMProviders/chatModelManager";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import * as chrono from "chrono-node";

export interface LocalBrocaResponse {
  response: {
    tool_calls: Array<{
      tool: string;
      args: any;
    }>;
    salience_terms: string[];
  };
  detail?: string; // Add optional detail property for error compatibility
}

export class LocalIntentAnalyzer {
  private static instance: LocalIntentAnalyzer;
  private chatModelManager: ChatModelManager;

  private constructor() {
    this.chatModelManager = ChatModelManager.getInstance();
  }

  static getInstance(): LocalIntentAnalyzer {
    if (!this.instance) {
      this.instance = new LocalIntentAnalyzer();
    }
    return this.instance;
  }

  // Test helper method to reset singleton for testing
  static resetInstance(): void {
    this.instance = undefined as any;
  }

  async analyzeIntent(
    message: string,
    isProjectMode: boolean = false,
    tools: any[] = []
  ): Promise<LocalBrocaResponse> {
    const systemPrompt = this.getSystemPrompt(isProjectMode, tools);
    console.log("analyzeIntent systemPrompt:", systemPrompt);
    const userPrompt = this.getUserPrompt(message);

    const chatModel = this.chatModelManager.getChatModel();

    try {
      const response = await chatModel.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ]);

      const content = response.content as string;
      console.log("analyzeIntent LLM response content:", content);
      return this.parseResponse(content, message);
    } catch (error) {
      console.error("Error in local intent analysis:", error);
      throw new Error("Local intent analysis failed");
    }
  }

  private getSystemPrompt(isProjectMode: boolean, tools: any[]): string {
    // Extract tool information from the tools array
    const toolDescriptions = tools
      .filter((tool) => {
        // Skip file tree tool in project mode
        if (tool.name === "getFileTree" && isProjectMode) {
          return false;
        }
        return true;
      })
      .map((tool) => {
        const name = tool.name;
        const description = tool.description || "No description available";
        const schemaInfo = this.formatSchemaInfo(tool.schema);
        return `${name} - ${description}${schemaInfo}`;
      });

    return `You are an intent analyzer that determines what tools to call based on user messages.
The current time is ${new Date().toISOString()}.

Available tools:
${toolDescriptions.map((desc) => `- ${desc}`).join("\n")}


Your task:
1. Analyze the user message for intent
2. Extract salient terms (important keywords)
3. Determine which tools to call and with what arguments
4. Handle time-related queries by detecting dates, times, ranges
5. Detect @ commands (@vault, @web, @youtube, @pomodoro)

Time parsing rules:
- Look for phrases like "today", "yesterday", "last week", "this month", etc.
- Detect specific dates like "January 15", "2024-01-15", etc.
- Handle ranges like "from Monday to Friday", "between 2pm and 5pm"
- **use english date format for parsing** regardless of the user's language

Tool calling guidelines:
- Only call tools that are directly relevant to the user's intent
- For time-related queries, use getTimeRangeMs to parse time expressions
- For search queries, use localSearch with appropriate parameters
- For @ commands, identify the specific tool needed (@vault → localSearch, @web → webSearch, etc.)

Response format (JSON only):
{
  "tool_calls": [
    {
      "tool": "toolName",
      "args": {...}
    }
  ],
  "salience_terms": ["term1", "term2", "term3"]
}

Extract 3-7 salient terms that capture the key concepts in the message.
Only call tools that are directly relevant to the user's intent.`;
  }

  private getUserPrompt(message: string): string {
    return `Analyze this user message and determine the appropriate tool calls and salient terms:

Message: "${message}"

Consider:
- What is the user trying to accomplish?
- Are there any @ commands (@vault, @web, @youtube, @pomodoro)?
- Are there time references that need parsing?
- What are the key concepts/terms in this message?

Respond with JSON only.`;
  }

  private parseResponse(content: string, originalMessage: string): LocalBrocaResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate response structure
      if (!parsed.tool_calls || !Array.isArray(parsed.tool_calls)) {
        parsed.tool_calls = [];
      }

      if (!parsed.salience_terms || !Array.isArray(parsed.salience_terms)) {
        parsed.salience_terms = this.extractSalienceTermsFallback(originalMessage);
      }

      // Add time range detection if not present
      this.addTimeRangeDetection(parsed, originalMessage);

      return { response: parsed };
    } catch (error) {
      console.error("Error parsing LLM response:", error);

      // Fallback response
      return {
        response: {
          tool_calls: [],
          salience_terms: this.extractSalienceTermsFallback(originalMessage),
        },
      };
    }
  }

  private extractSalienceTermsFallback(message: string): string[] {
    // Simple keyword extraction as fallback
    const words = message
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .filter(
        (word) =>
          ![
            "that",
            "this",
            "with",
            "from",
            "they",
            "them",
            "have",
            "will",
            "been",
            "were",
          ].includes(word)
      );

    return [...new Set(words)].slice(0, 5);
  }

  private addTimeRangeDetection(parsed: any, message: string): void {
    // Use chrono-node to detect time references
    const timeReferences = chrono.parse(message);

    if (timeReferences.length > 0) {
      // Check if getTimeRangeMs tool call already exists
      const hasTimeRangeTool = parsed.tool_calls.some(
        (call: any) => call.tool === "getTimeRangeMs"
      );

      if (!hasTimeRangeTool && timeReferences.length > 0) {
        parsed.tool_calls.push({
          tool: "getTimeRangeMs",
          args: {
            timeRangeText: message,
          },
        });
      }
    }
  }

  private formatSchemaInfo(schema: any): string {
    if (!schema || !schema.shape) {
      return "";
    }

    try {
      const shape = schema.shape;
      const params: string[] = [];

      for (const [key, value] of Object.entries(shape)) {
        const zodType = value as any;
        let typeInfo = key;

        // Extract type information
        if (zodType._def) {
          const typeName = zodType._def.typeName;
          switch (typeName) {
            case "ZodString": {
              typeInfo += ": string";
              break;
            }
            case "ZodNumber": {
              typeInfo += ": number";
              break;
            }
            case "ZodBoolean": {
              typeInfo += ": boolean";
              break;
            }
            case "ZodArray": {
              typeInfo += ": array";
              break;
            }
            case "ZodObject": {
              typeInfo += ": object";
              break;
            }
            case "ZodOptional": {
              const innerType = zodType._def.innerType?._def?.typeName || "unknown";
              typeInfo += `: ${innerType.replace("Zod", "").toLowerCase()}?`;
              break;
            }
            default: {
              typeInfo += ": any";
            }
          }

          // Extract description if available
          if (zodType._def.description) {
            typeInfo += ` (${zodType._def.description})`;
          }
        }

        params.push(typeInfo);
      }

      return params.length > 0 ? `\n  Parameters: {${params.join(", ")}}` : "";
    } catch {
      return "";
    }
  }

  // Test helper methods (for testing purposes)
  public testParseResponse(content: string, originalMessage: string) {
    return this.parseResponse(content, originalMessage);
  }

  public testExtractSalienceTermsFallback(message: string) {
    return this.extractSalienceTermsFallback(message);
  }

  public testGetSystemPrompt(isProjectMode: boolean, tools: any[]) {
    return this.getSystemPrompt(isProjectMode, tools);
  }
}

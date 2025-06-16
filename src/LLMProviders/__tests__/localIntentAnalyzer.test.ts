import { LocalIntentAnalyzer } from "../localIntentAnalyzer";

// Mock dependencies before importing
jest.mock("@langchain/core/messages", () => ({
  HumanMessage: jest.fn().mockImplementation((content) => ({ content })),
  SystemMessage: jest.fn().mockImplementation((content) => ({ content })),
}));

jest.mock("chrono-node", () => ({
  parse: jest.fn(),
}));

jest.mock("../chatModelManager", () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(),
  },
}));

// Mock constants to avoid circular dependency
jest.mock("@/constants", () => ({
  ChainType: {
    LLM_CHAIN: "LLM_CHAIN",
    VAULT_QA_CHAIN: "VAULT_QA_CHAIN",
    COPILOT_PLUS_CHAIN: "COPILOT_PLUS_CHAIN",
  },
  ChatModels: {
    GPT_41: "gpt-4",
  },
  ChatModelProviders: {
    OPENAI: "openai",
  },
  EmbeddingModels: {
    OPENAI_EMBEDDING_SMALL: "text-embedding-3-small",
  },
  EmbeddingModelProviders: {
    OPENAI: "openai",
  },
}));

import ChatModelManager from "../chatModelManager";
import * as chrono from "chrono-node";

// Get the mocked version of chrono
const mockChrono = chrono as jest.Mocked<typeof chrono>;

describe("LocalIntentAnalyzer", () => {
  let analyzer: LocalIntentAnalyzer;
  let mockChatModel: any;
  let mockChatModelManager: jest.Mocked<ChatModelManager>;

  const mockTools = [
    {
      name: "getCurrentTime",
      description: "Get current time information",
    },
    {
      name: "getTimeRangeMs",
      description: "Parse time range from text",
    },
    {
      name: "localSearch",
      description: "Search through notes/vault",
    },
    {
      name: "webSearch",
      description: "Search the web",
    },
    {
      name: "youtubeTranscription",
      description: "Get YouTube video transcript",
    },
    {
      name: "getFileTree",
      description: "Get file tree structure",
    },
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Reset singleton instance
    (LocalIntentAnalyzer as any).instance = undefined;

    // Mock chat model
    mockChatModel = {
      invoke: jest.fn(),
    };

    // Mock ChatModelManager
    mockChatModelManager = {
      getChatModel: jest.fn().mockReturnValue(mockChatModel),
    } as any;

    (ChatModelManager.getInstance as jest.Mock).mockReturnValue(mockChatModelManager);

    analyzer = LocalIntentAnalyzer.getInstance();
  });

  describe("analyzeIntent", () => {
    it("should analyze simple search intent", async () => {
      const mockResponse = {
        content: JSON.stringify({
          tool_calls: [
            {
              tool: "localSearch",
              args: { query: "find notes about meetings" },
            },
          ],
          salience_terms: ["notes", "meetings", "find"],
        }),
      };

      mockChatModel.invoke.mockResolvedValue(mockResponse);
      mockChrono.parse.mockReturnValue([]);

      const result = await analyzer.analyzeIntent("find notes about meetings", false, mockTools);

      expect(result.response.tool_calls).toHaveLength(1);
      expect(result.response.tool_calls[0].tool).toBe("localSearch");
      expect(result.response.salience_terms).toContain("notes");
      expect(result.response.salience_terms).toContain("meetings");
    });

    it("should handle @vault command", async () => {
      const mockResponse = {
        content: JSON.stringify({
          tool_calls: [
            {
              tool: "localSearch",
              args: { query: "search my notes" },
            },
          ],
          salience_terms: ["search", "notes", "vault"],
        }),
      };

      mockChatModel.invoke.mockResolvedValue(mockResponse);
      mockChrono.parse.mockReturnValue([]);

      const result = await analyzer.analyzeIntent("@vault search my notes", false, mockTools);

      expect(result.response.tool_calls).toHaveLength(1);
      expect(result.response.salience_terms).toContain("search");
      expect(result.response.salience_terms).toContain("notes");
      expect(result.response.salience_terms).toContain("vault");
    });

    it("should detect time references and add getTimeRangeMs tool", async () => {
      const mockResponse = {
        content: JSON.stringify({
          tool_calls: [],
          salience_terms: ["notes", "today"],
        }),
      };

      // Mock chrono to detect time reference with proper structure
      mockChrono.parse.mockReturnValue([
        {
          start: {
            date: () => new Date(),
            isCertain: true,
            get: jest.fn(),
            tags: {},
          } as any,
        } as any,
      ]);

      mockChatModel.invoke.mockResolvedValue(mockResponse);

      const result = await analyzer.analyzeIntent("show me notes from today", false, mockTools);

      expect(result.response.tool_calls).toHaveLength(1);
      expect(result.response.tool_calls[0].tool).toBe("getTimeRangeMs");
      expect(result.response.tool_calls[0].args.timeRangeText).toBe("show me notes from today");
    });

    it("should filter out getFileTree in project mode", async () => {
      const mockResponse = {
        content: JSON.stringify({
          tool_calls: [
            {
              tool: "getFileTree",
              args: {},
            },
          ],
          salience_terms: ["files", "project"],
        }),
      };

      mockChatModel.invoke.mockResolvedValue(mockResponse);
      mockChrono.parse.mockReturnValue([]);

      // Test that system prompt doesn't include getFileTree in project mode
      await analyzer.analyzeIntent("what files do I have", true, mockTools);

      // Verify the system prompt was called
      expect(mockChatModel.invoke).toHaveBeenCalledWith([
        expect.any(Object), // SystemMessage
        expect.any(Object), // HumanMessage
      ]);

      // Get the system message content
      const systemMessage = mockChatModel.invoke.mock.calls[0][0][0];
      expect(systemMessage.content).not.toContain("getFileTree");
    });

    it("should handle malformed LLM response gracefully", async () => {
      const mockResponse = {
        content: "This is not valid JSON",
      };

      mockChatModel.invoke.mockResolvedValue(mockResponse);
      mockChrono.parse.mockReturnValue([]);

      const result = await analyzer.analyzeIntent("test message", false, mockTools);

      expect(result.response.tool_calls).toEqual([]);
      expect(result.response.salience_terms).toEqual(["test", "message"]);
    });

    it("should handle LLM response with missing fields", async () => {
      const mockResponse = {
        content: JSON.stringify({
          tool_calls: [{ tool: "localSearch" }],
          // Missing salience_terms
        }),
      };

      mockChatModel.invoke.mockResolvedValue(mockResponse);
      mockChrono.parse.mockReturnValue([]);

      const result = await analyzer.analyzeIntent("search for something", false, mockTools);

      expect(result.response.tool_calls).toHaveLength(1);
      expect(result.response.salience_terms).toContain("search");
      expect(result.response.salience_terms).toContain("something");
    });

    it("should throw error when chat model fails", async () => {
      mockChatModel.invoke.mockRejectedValue(new Error("Model error"));

      await expect(analyzer.analyzeIntent("test", false, mockTools)).rejects.toThrow(
        "Local intent analysis failed"
      );
    });
  });

  describe("extractSalienceTermsFallback", () => {
    it("should extract meaningful terms", async () => {
      const mockResponse = {
        content: JSON.stringify({
          tool_calls: [],
          // Missing salience_terms to trigger fallback
        }),
      };

      mockChatModel.invoke.mockResolvedValue(mockResponse);
      mockChrono.parse.mockReturnValue([]);

      const result = await analyzer.analyzeIntent(
        "find important documents about machine learning algorithms",
        false,
        mockTools
      );

      // The fallback method returns max 5 terms, so we test for the ones that should be included
      expect(result.response.salience_terms).toContain("find");
      expect(result.response.salience_terms).toContain("important");
      expect(result.response.salience_terms).toContain("documents");
      expect(result.response.salience_terms).toContain("machine");
      // Note: "learning" might not be included as we only get 5 terms max
      expect(result.response.salience_terms.length).toBeLessThanOrEqual(5);
    });

    it("should filter out short words and common words", async () => {
      const mockResponse = {
        content: JSON.stringify({
          tool_calls: [],
        }),
      };

      mockChatModel.invoke.mockResolvedValue(mockResponse);
      mockChrono.parse.mockReturnValue([]);

      const result = await analyzer.analyzeIntent(
        "I have been looking for this with them",
        false,
        mockTools
      );

      // Should not contain short words or common words
      expect(result.response.salience_terms).not.toContain("have");
      expect(result.response.salience_terms).not.toContain("been");
      expect(result.response.salience_terms).not.toContain("this");
      expect(result.response.salience_terms).not.toContain("with");
      expect(result.response.salience_terms).not.toContain("them");
      expect(result.response.salience_terms).toContain("looking");
    });

    it("should handle direct fallback method call", () => {
      const testMessage = "find important documents about machine learning algorithms";
      const salienceTerms = analyzer.testExtractSalienceTermsFallback(testMessage);

      expect(salienceTerms.length).toBeLessThanOrEqual(5);
      expect(salienceTerms).toContain("find");
      expect(salienceTerms).toContain("important");
      expect(salienceTerms).toContain("documents");
      // Check that it includes meaningful terms and filters out short/common words
      expect(salienceTerms.every((term) => term.length > 3)).toBe(true);
    });
  });

  describe("test helper methods", () => {
    it("should provide access to internal methods for testing", () => {
      const testMessage = "find important documents";
      const salienceTerms = analyzer.testExtractSalienceTermsFallback(testMessage);

      expect(salienceTerms).toContain("find");
      expect(salienceTerms).toContain("important");
      expect(salienceTerms).toContain("documents");
    });

    it("should generate system prompt correctly", () => {
      const systemPrompt = analyzer.testGetSystemPrompt(false, mockTools);

      expect(systemPrompt).toContain("intent analyzer");
      expect(systemPrompt).toContain("getCurrentTime");
      expect(systemPrompt).toContain("localSearch");
      expect(systemPrompt).toContain("getFileTree");
    });

    it("should exclude getFileTree in project mode", () => {
      const systemPrompt = analyzer.testGetSystemPrompt(true, mockTools);

      expect(systemPrompt).toContain("intent analyzer");
      expect(systemPrompt).not.toContain("getFileTree");
    });
  });

  describe("singleton pattern", () => {
    it("should return the same instance", () => {
      const instance1 = LocalIntentAnalyzer.getInstance();
      const instance2 = LocalIntentAnalyzer.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});

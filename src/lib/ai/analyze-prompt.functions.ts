import { createServerFn } from "@tanstack/react-start";
import type {
  AnalysisFields,
  AnalysisMode,
  Prompts,
} from "@/lib/prompt-store";

/**
 * Request/response contract shared by the client service
 * (src/lib/ai/prompt-analyzer.ts) and any external caller
 * (e.g. supabase/functions/analyze-prompt).
 */
export type AnalyzeRequest = {
  // One of these MUST be provided. We accept a public URL or a data URL
  // (base64) so the function never needs storage credentials.
  fileUrl?: string;
  fileDataUrl?: string;
  fileName?: string;
  mime?: string;
  kind: "image" | "video";
  mode: AnalysisMode;
  model: "gpt" | "gem" | "cla";
  language?: string; // "es" | "en" | ...
  targetFormat?: string; // "16:9", "9:16", "1:1", ...
};

export type AnalyzeResponse = {
  source: "gemini" | "openai" | "claude" | "mock";
  analysis: AnalysisFields;
  prompts: Prompts;
};

/**
 * Server function — modern-stack equivalent of an edge function.
 *
 * Real provider calls live here so API keys NEVER reach the browser.
 * Today this returns `{ source: "mock" }` and the client falls back to
 * the local preset generator. Wire the real provider call below by
 * reading process.env.LOVABLE_API_KEY (or OPENAI_API_KEY / GEMINI_API_KEY)
 * inside the handler.
 */
export const analyzePrompt = createServerFn({ method: "POST" })
  .inputValidator((input: AnalyzeRequest) => input)
  .handler(async ({ data }): Promise<AnalyzeResponse | { source: "mock" }> => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    // No provider configured → tell the client to use its local mock.
    if (!lovableKey && !openAiKey && !geminiKey) {
      return { source: "mock" };
    }

    // ----------------------------------------------------------------
    // REAL CALL — placeholder. Wire one of these branches when ready:
    //
    // if (data.model === "gem" && (lovableKey || geminiKey)) {
    //   // POST https://ai.gateway.lovable.dev/v1/chat/completions
    //   // body: { model: "google/gemini-3-flash-preview", messages: [...] }
    //   // header: Lovable-API-Key: <lovableKey>
    // }
    //
    // if (data.model === "gpt" && (lovableKey || openAiKey)) {
    //   // POST https://ai.gateway.lovable.dev/v1/chat/completions
    //   // body: { model: "openai/gpt-4o-mini", messages: [...] }
    // }
    //
    // Parse the structured JSON answer into AnalyzeResponse and return it.
    // Until that branch ships, fall through to mock so the UI keeps working.
    // ----------------------------------------------------------------

    void data; // referenced for future implementation
    return { source: "mock" };
  });

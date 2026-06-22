/**
 * Client-side AI service.
 *
 * Exposes a stable surface that the rest of the app calls. Each function
 * delegates to a TanStack server function (which is where API keys live)
 * and falls back to a local mock generator if no provider is configured.
 *
 * IMPORTANT: This file MUST stay 100% client-safe — never read API keys here.
 */
import type {
  AnalysisFields,
  AnalysisMode,
  Prompts,
  UploadInfo,
} from "@/lib/prompt-store";
import {
  buildPromptsFromBase,
  pickPreset,
  DEFAULT_ANALYSIS,
  DEFAULT_BASE,
} from "./mock-presets";
import {
  analyzePrompt,
  type AnalyzeRequest,
  type AnalyzeResponse,
} from "./analyze-prompt.functions";

export type AnalyzeOptions = {
  mode: AnalysisMode;
  language?: string;
  targetFormat?: string;
};

type AnalyzeResult = AnalyzeResponse;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

async function buildRequest(
  source: UploadInfo | File,
  model: AnalyzeRequest["model"],
  options: AnalyzeOptions,
): Promise<AnalyzeRequest> {
  if (source instanceof File) {
    return {
      fileDataUrl: await fileToDataUrl(source),
      fileName: source.name,
      mime: source.type,
      kind: source.type.startsWith("video/") ? "video" : "image",
      mode: options.mode,
      model,
      language: options.language ?? "es",
      targetFormat: options.targetFormat ?? "16:9",
    };
  }
  if (!source) throw new Error("No file provided");
  return {
    fileUrl: source.url.startsWith("blob:") ? undefined : source.url,
    fileName: source.name,
    mime: source.mime,
    kind: source.kind,
    mode: options.mode,
    model,
    language: options.language ?? "es",
    targetFormat: options.targetFormat ?? "16:9",
  };
}

function mockResult(
  name: string | undefined,
  kind: "image" | "video",
  mode: AnalysisMode,
): AnalyzeResult {
  const preset = pickPreset(name ?? "");
  return {
    source: "mock",
    analysis: preset.analysis,
    prompts: buildPromptsFromBase(preset.base, mode, kind),
  };
}

async function runAnalyzer(
  source: UploadInfo | File,
  model: AnalyzeRequest["model"],
  options: AnalyzeOptions,
): Promise<AnalyzeResult> {
  const kind: "image" | "video" =
    source instanceof File
      ? source.type.startsWith("video/")
        ? "video"
        : "image"
      : source!.kind;
  const name = source instanceof File ? source.name : source?.name;

  try {
    const req = await buildRequest(source, model, options);
    const res = await analyzePrompt({ data: req });
    if (!res || res.source === "mock") {
      return mockResult(name, kind, options.mode);
    }
    return res;
  } catch (err) {
    console.warn("[prompt-analyzer] falling back to mock:", err);
    return mockResult(name, kind, options.mode);
  }
}

// ---------------------------------------------------------------------------
// Public surface
// ---------------------------------------------------------------------------

export async function analyzeWithGemini(
  file: UploadInfo | File,
  options: AnalyzeOptions,
): Promise<AnalyzeResult> {
  return runAnalyzer(file, "gem", options);
}

export async function analyzeWithOpenAI(
  file: UploadInfo | File,
  options: AnalyzeOptions,
): Promise<AnalyzeResult> {
  return runAnalyzer(file, "gpt", options);
}

export async function analyzeWithClaude(
  file: UploadInfo | File,
  options: AnalyzeOptions,
): Promise<AnalyzeResult> {
  return runAnalyzer(file, "cla", options);
}

/**
 * Build the 10 prompt variants from a content analysis. Useful when the
 * model returned only the analysis JSON and we synthesize the variants
 * client-side, or for "regenerate prompts" actions that don't re-analyze.
 */
export function generatePromptVariants(
  analysis: AnalysisFields,
  options: { mode: AnalysisMode; kind: "image" | "video" },
): Prompts {
  const base = analysisToBase(analysis);
  return buildPromptsFromBase(base, options.mode, options.kind);
}

function analysisToBase(a: AnalysisFields): string {
  const parts = [a.subject, a.setting, a.lighting, a.mood, a.style].filter(
    Boolean,
  );
  return parts.join(", ") || DEFAULT_BASE;
}

// Re-export so callers can also import preset defaults from one place.
export { DEFAULT_ANALYSIS };

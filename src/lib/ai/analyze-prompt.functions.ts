import { createServerFn } from "@tanstack/react-start";
import type {
  AnalysisFields,
  AnalysisMode,
  Prompts,
} from "@/lib/prompt-store";
import { buildPromptsFromBase, DEFAULT_ANALYSIS, DEFAULT_BASE } from "./mock-presets";

export type AnalyzeRequest = {
  fileUrl?: string;
  fileDataUrl?: string;
  fileName?: string;
  mime?: string;
  kind: "image" | "video";
  mode: AnalysisMode;
  model: "gpt" | "gem" | "both";
  language?: string;
  targetFormat?: string;
};

export type AnalyzeResponse = {
  source: "gemini" | "openai" | "combined" | "mock";
  analysis: AnalysisFields;
  prompts: Prompts;
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const GEMINI_MODEL = "google/gemini-3-flash-preview";
const OPENAI_MODEL = "openai/gpt-5-mini";

const SYSTEM_PROMPT = `Eres un analista visual experto. Analiza el contenido recibido y responde EXCLUSIVAMENTE con un objeto JSON válido (sin markdown, sin texto extra) con estas claves exactas:
{
  "subject": string,
  "setting": string,
  "lighting": string,
  "mood": string,
  "style": string,
  "colors": [string, string, string, string]  // 4 colores hex dominantes,
  "camera": string,
  "weather": string,
  "clothing": string,
  "expression": string,
  "objects": string,
  "actions": string,
  "composition": string,
  "quality": string,
  "realism": string,
  "format": string,
  "base": string  // descripción densa en INGLÉS para generación de prompts (15-30 palabras)
}
Responde en el idioma solicitado para los campos descriptivos, pero "base" siempre en inglés.`;

type RawAnalysis = AnalysisFields & { base: string };

async function callGateway(
  model: string,
  messages: unknown[],
  key: string,
): Promise<string> {
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gateway ${model} ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content ?? "";
  if (!content) throw new Error("Empty completion");
  return content;
}

function safeParse(content: string): RawAnalysis {
  // strip ```json fences if any
  const cleaned = content.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
  const parsed = JSON.parse(cleaned) as Partial<RawAnalysis>;
  return {
    ...DEFAULT_ANALYSIS,
    ...parsed,
    colors:
      Array.isArray(parsed.colors) && parsed.colors.length
        ? parsed.colors.slice(0, 4).map(String)
        : DEFAULT_ANALYSIS.colors,
    base: typeof parsed.base === "string" && parsed.base ? parsed.base : DEFAULT_BASE,
  };
}

function buildVisionMessages(data: AnalyzeRequest) {
  const language = data.language ?? "es";
  const userText = `Analiza este contenido (${data.kind}) y describe con máximo detalle. Modo: ${data.mode}. Idioma: ${language}. Formato objetivo: ${data.targetFormat ?? "16:9"}. Devuelve sólo el JSON pedido.`;

  const imageUrl = data.fileDataUrl ?? data.fileUrl;
  const content: unknown[] = [{ type: "text", text: userText }];
  if (imageUrl && data.kind === "image") {
    content.push({ type: "image_url", image_url: { url: imageUrl } });
  }

  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content },
  ];
}

async function refineWithOpenAI(
  raw: RawAnalysis,
  data: AnalyzeRequest,
  key: string,
): Promise<RawAnalysis> {
  const refineSystem = `Eres un ingeniero de prompts profesional. Recibes un análisis visual JSON y debes mejorarlo para producción de prompts multi-plataforma (Midjourney, Flux, Veo, Kling, Whisk). Responde EXCLUSIVAMENTE con un JSON que mantenga el mismo esquema y mejore especialmente el campo "base" (denso, en inglés, 20-35 palabras, cinemático).`;
  const content = await callGateway(
    OPENAI_MODEL,
    [
      { role: "system", content: refineSystem },
      {
        role: "user",
        content: `Análisis visual original (modo ${data.mode}):\n${JSON.stringify(raw)}`,
      },
    ],
    key,
  );
  try {
    return safeParse(content);
  } catch {
    return raw;
  }
}

export const analyzePrompt = createServerFn({ method: "POST" })
  .inputValidator((input: AnalyzeRequest) => input)
  .handler(async ({ data }): Promise<AnalyzeResponse | { source: "mock" }> => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    if (!lovableKey) return { source: "mock" };

    // Videos: vision models in the gateway don't accept video frames directly.
    // Fall back to mock so the UI keeps working.
    if (data.kind === "video") return { source: "mock" };

    const messages = buildVisionMessages(data);

    try {
      if (data.model === "gpt") {
        const content = await callGateway(OPENAI_MODEL, messages, lovableKey);
        const raw = safeParse(content);
        return {
          source: "openai",
          analysis: stripBase(raw),
          prompts: buildPromptsFromBase(raw.base, data.mode, data.kind),
        };
      }

      if (data.model === "gem") {
        const content = await callGateway(GEMINI_MODEL, messages, lovableKey);
        const raw = safeParse(content);
        return {
          source: "gemini",
          analysis: stripBase(raw),
          prompts: buildPromptsFromBase(raw.base, data.mode, data.kind),
        };
      }

      // model === "both": Gemini para análisis visual + OpenAI para refinar prompts.
      let raw: RawAnalysis;
      try {
        const content = await callGateway(GEMINI_MODEL, messages, lovableKey);
        raw = safeParse(content);
      } catch (err) {
        console.warn("[analyzePrompt] gemini failed, mock:", err);
        return { source: "mock" };
      }
      try {
        raw = await refineWithOpenAI(raw, data, lovableKey);
      } catch (err) {
        console.warn("[analyzePrompt] openai refine failed, using gemini only:", err);
      }
      return {
        source: "combined",
        analysis: stripBase(raw),
        prompts: buildPromptsFromBase(raw.base, data.mode, data.kind),
      };
    } catch (err) {
      console.warn("[analyzePrompt] provider error, mock:", err);
      return { source: "mock" };
    }
  });

function stripBase(raw: RawAnalysis): AnalysisFields {
  const { base: _omit, ...rest } = raw;
  void _omit;
  return rest;
}

// Shared helpers so client can build the same Prompts shape from analysis.
export type { Prompts };

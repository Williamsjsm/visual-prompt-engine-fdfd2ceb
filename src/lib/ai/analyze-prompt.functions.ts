import { createServerFn } from "@tanstack/react-start";
import type {
  AnalysisFields,
  AnalysisMode,
  IdentityLock,
  Prompts,
  SceneAdaptation,
} from "@/lib/prompt-store";
import { buildPromptsFromBase, DEFAULT_ANALYSIS, DEFAULT_BASE } from "./mock-presets";

export type AnalyzeRequest = {
  fileUrl?: string;
  fileDataUrl?: string;
  frameDataUrls?: string[];
  fileName?: string;
  mime?: string;
  referenceDataUrl?: string;
  referenceFileName?: string;
  referenceMime?: string;
  referenceProfileName?: string;
  referenceNotes?: string;
  kind: "image" | "video";
  mode: AnalysisMode;
  model: "gpt" | "gem" | "both";
  language?: string;
  targetFormat?: string;
  sceneAdaptation?: SceneAdaptation;
  identityLock?: IdentityLock;
};

export type AnalyzeResponse = {
  source: "gemini" | "openai" | "combined" | "mock";
  analysis: AnalysisFields;
  prompts: Prompts;
};

type MockResponse = {
  source: "mock";
  error?: string;
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const GEMINI_MODEL = process.env.LOVABLE_GEMINI_MODEL?.trim() || "google/gemini-3-flash-preview";
const OPENAI_MODEL = process.env.LOVABLE_OPENAI_MODEL?.trim() || "openai/gpt-5-mini";
const CACHE_TTL_MS =
  Math.max(0, Number.parseInt(process.env.PROMPT_GENERATOR_CACHE_MINUTES ?? "720", 10) || 720) *
  60_000;
const PROVIDER_COOLDOWN_MS =
  Math.max(
    1,
    Number.parseInt(process.env.PROMPT_GENERATOR_PROVIDER_COOLDOWN_MINUTES ?? "360", 10) || 360,
  ) * 60_000;

const analysisCache = new Map<string, { expiresAt: number; value: AnalyzeResponse }>();
const providerCooldown = new Map<string, number>();

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

const IDENTITY_REFERENCE_INSTRUCTION = `Si el usuario proporciona una IMAGEN DE IDENTIDAD DEL PERSONAJE:
- Usa el contenido principal sólo para escenario, iluminación, ambiente, cámara, composición, acción, movimiento, clima, estilo visual y formato.
- Usa esa identidad como sujeto/persona principal del prompt y trátala como IDENTIDAD BLOQUEADA, no como inspiración libre.
- Conserva SIEMPRE la identidad exacta de esa persona: rasgos faciales, forma del rostro, proporciones, edad aparente, tono de piel, peinado, color y textura del cabello, barba/maquillaje si existe, complexión, estilo de vestir, accesorios, marcas visuales y detalles distintivos.
- No rediseñes, embellezcas, estilices, rejuvenezcas, cambies etnia, cambies género, cambies proporciones ni inventes rasgos nuevos para el personaje.
- Mantén continuidad entre videos: el personaje debe verse como la misma persona en todos los prompts, incluso si cambia el escenario, cámara, ropa contextual o iluminación.
- No copies la identidad, rostro, cuerpo o rasgos personales de la persona que aparece en el video/imagen principal.
- No nombres a personas reales ni influencers.
- Mantén el escenario del contenido principal igual o muy parecido, pero cambia el sujeto para que coincida con la identidad indicada.
- La imagen de identidad NO debe aparecer como un plano separado, intro, foto animada, morph, collage, split-screen ni transición. El resultado debe empezar directamente dentro del escenario del contenido principal con el personaje ya integrado.
- En "base", no escribas etiquetas sobre archivo de entrada, imagen fuente, identidad fuente, imagen de identidad ni sujeto externo.
- En "base", expresa la continuidad así: "same character identity maintained across every frame, consistent face, body proportions, skin tone, hair, clothing details and distinctive features".`;

function sceneInstruction(mode: SceneAdaptation | undefined) {
  switch (mode) {
    case "exact":
      return "MODO ESCENA EXACTA: conserva el escenario, composición, encuadre, iluminación, clima, acciones, objetos, ritmo y cámara lo más parecido posible al contenido principal. Sólo cambia el sujeto si hay identidad indicada.";
    case "style":
      return "MODO SOLO ESTILO VISUAL: no copies el escenario específico. Extrae estética, iluminación, color, cámara, ritmo, realismo y atmósfera; crea un escenario nuevo y original con esa misma estética.";
    case "new":
      return "MODO CAMBIAR ESCENARIO: crea un escenario claramente distinto y original, manteniendo sólo la calidad visual, energía, tipo de cámara e intención cinematográfica del contenido principal.";
    case "similar":
    default:
      return "MODO ESCENA PARECIDA PERO ORIGINAL: conserva la idea, ambiente, cámara, iluminación y composición general, pero evita copiar exactamente el lugar, objetos únicos o detalles demasiado reconocibles.";
  }
}

function identityInstruction(mode: IdentityLock | undefined) {
  switch (mode) {
    case "flex":
      return "FIDELIDAD DE IDENTIDAD FLEXIBLE: mantén parecido general del personaje, pero permite pequeñas adaptaciones naturales de ropa, pose e iluminación según la escena.";
    case "ultra":
      return "FIDELIDAD DE IDENTIDAD ULTRA ESTRICTA: preserva la identidad indicada con máxima exactitud. No alteres rostro, proporciones, edad aparente, tono de piel, cabello, complexión, detalles faciales, accesorios ni rasgos distintivos. El personaje debe verse idéntico entre videos.";
    case "strict":
    default:
      return "FIDELIDAD DE IDENTIDAD ESTRICTA: preserva claramente la misma persona, sus rasgos faciales, proporciones, cabello, tono de piel, estilo y detalles distintivos, permitiendo sólo cambios mínimos de iluminación y pose.";
  }
}

type RawAnalysis = AnalysisFields & { base: string };

class GatewayError extends Error {
  status: number;
  body: string;

  constructor(model: string, status: number, body: string) {
    super(`Gateway ${model} ${status}: ${body.slice(0, 300)}`);
    this.status = status;
    this.body = body;
  }
}

function cacheKey(data: AnalyzeRequest) {
  return JSON.stringify(data);
}

function getCachedAnalysis(key: string): AnalyzeResponse | null {
  if (CACHE_TTL_MS <= 0) return null;
  const hit = analysisCache.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    analysisCache.delete(key);
    return null;
  }
  return hit.value;
}

function setCachedAnalysis(key: string, value: AnalyzeResponse) {
  if (CACHE_TTL_MS <= 0) return;
  analysisCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value });
}

function isQuotaOrRateLimit(err: unknown) {
  if (!(err instanceof GatewayError)) return false;
  const body = err.body.toLowerCase();
  return (
    err.status === 402 ||
    err.status === 429 ||
    body.includes("quota") ||
    body.includes("credit") ||
    body.includes("rate limit") ||
    body.includes("insufficient")
  );
}

function isCoolingDown(model: string) {
  const until = providerCooldown.get(model);
  if (!until) return false;
  if (until <= Date.now()) {
    providerCooldown.delete(model);
    return false;
  }
  return true;
}

function coolDown(model: string) {
  providerCooldown.set(model, Date.now() + PROVIDER_COOLDOWN_MS);
}

const IDENTITY_LOCK_CLAUSE =
  "same character identity maintained across every frame, consistent face, body proportions, skin tone, hair, clothing details and distinctive features, no character redesign, already present in the target scene from the opening frame, single continuous shot in the target scene, no intro shot, no before-after transformation, no morph, no transition";

function enforceReferenceIdentity(raw: RawAnalysis, data: AnalyzeRequest): RawAnalysis {
  if (!data.referenceDataUrl) return raw;
  const base = sanitizeIdentityPromptLanguage(raw.base.trim());
  const hasIdentityClause =
    /same character identity|consistent face|distinctive features|no character redesign/i.test(
      base,
    );
  return {
    ...raw,
    base: hasIdentityClause ? base : `${base}, ${IDENTITY_LOCK_CLAUSE}`,
  };
}

function sanitizeIdentityPromptLanguage(value: string): string {
  return value
    .replace(/the same referenced avatar\/person/gi, "same character identity")
    .replace(/same referenced avatar\/person/gi, "same character identity")
    .replace(/referenced avatar\/person/gi, "character identity")
    .replace(/referenced avatar/gi, "character")
    .replace(/reference image/gi, "same character identity")
    .replace(/reference-image/gi, "same character identity")
    .replace(/attached image/gi, "same character identity")
    .replace(/attached same character identity/gi, "same character identity")
    .replace(/uploaded image/gi, "same character identity")
    .replace(/provided image/gi, "same character identity")
    .replace(/input image/gi, "same character identity")
    .replace(/source image/gi, "same character identity")
    .replace(/identity source/gi, "same character identity")
    .replace(/identity-source/gi, "same character identity")
    .replace(/referenced person/gi, "character")
    .replace(/\bavatar\/person\b/gi, "character")
    .replace(/\bavatar\b/gi, "character")
    .replace(/\breferenced\b/gi, "consistent")
    .replace(/\breference\b/gi, "identity");
}

async function callGateway(model: string, messages: unknown[], key: string): Promise<string> {
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
    throw new GatewayError(model, res.status, text);
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
  const hasReference = Boolean(data.referenceDataUrl);
  const userText = `Analiza este contenido (${data.kind}) y describe con máximo detalle. ${
    data.kind === "video"
      ? "Recibirás varios fotogramas del video; infiere estética, movimiento, acciones, ritmo y uso para redes sociales."
      : ""
  } ${
    hasReference
      ? "También recibirás una imagen de identidad del personaje; aplica estrictamente la continuidad de identidad."
      : ""
  } Modo: ${data.mode}. Idioma: ${language}. Formato objetivo: ${data.targetFormat ?? "16:9"}. Devuelve sólo el JSON pedido.`;

  const imageUrls = getVisualInputs(data);
  const content: unknown[] = [
    { type: "text", text: userText },
    { type: "text", text: sceneInstruction(data.sceneAdaptation) },
    { type: "text", text: identityInstruction(data.identityLock) },
    ...(hasReference ? [{ type: "text", text: IDENTITY_REFERENCE_INSTRUCTION }] : []),
    ...(hasReference && data.referenceProfileName
      ? [{ type: "text", text: `NOMBRE INTERNO DEL PERSONAJE: ${data.referenceProfileName}` }]
      : []),
    ...(hasReference && data.referenceNotes
      ? [{ type: "text", text: `NOTAS FIJAS DE IDENTIDAD DEL PERSONAJE: ${data.referenceNotes}` }]
      : []),
    { type: "text", text: "CONTENIDO PRINCIPAL: escenario, estilo, cámara, acción y ambiente." },
  ];
  for (const imageUrl of imageUrls) {
    content.push({ type: "image_url", image_url: { url: imageUrl } });
  }
  const referenceImage = getReferenceInput(data);
  if (referenceImage) {
    content.push({
      type: "text",
      text: "IMAGEN DE IDENTIDAD DEL PERSONAJE: sujeto e identidad visual a usar.",
    });
    content.push({ type: "image_url", image_url: { url: referenceImage } });
  }

  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content },
  ];
}

function buildGeminiParts(data: AnalyzeRequest) {
  const language = data.language ?? "es";
  const hasReference = Boolean(data.referenceDataUrl);
  const parts: unknown[] = [
    {
      text: `Analiza este contenido (${data.kind}) para recrear prompts virales para redes sociales. ${
        data.kind === "video"
          ? "Estas imágenes son fotogramas representativos del video; deduce cámara, movimiento, transiciones, acciones y estilo visual."
          : ""
      } ${
        hasReference
          ? "También hay una imagen de identidad del personaje para reemplazar al sujeto del contenido principal."
          : ""
      } Modo: ${data.mode}. Idioma: ${language}. Formato objetivo: ${data.targetFormat ?? "16:9"}. Devuelve sólo el JSON pedido.`,
    },
  ];

  if (hasReference) {
    parts.push({ text: IDENTITY_REFERENCE_INSTRUCTION });
    if (data.referenceProfileName) {
      parts.push({ text: `NOMBRE INTERNO DEL PERSONAJE: ${data.referenceProfileName}` });
    }
    if (data.referenceNotes) {
      parts.push({ text: `NOTAS FIJAS DE IDENTIDAD DEL PERSONAJE: ${data.referenceNotes}` });
    }
  }

  parts.push({ text: sceneInstruction(data.sceneAdaptation) });
  parts.push({ text: identityInstruction(data.identityLock) });
  parts.push({ text: "CONTENIDO PRINCIPAL: escenario, estilo, cámara, acción y ambiente." });
  for (const imageUrl of getVisualInputs(data)) {
    const parsed = parseDataUrl(imageUrl);
    if (!parsed) continue;
    parts.push({
      inline_data: {
        mime_type: parsed.mime,
        data: parsed.base64,
      },
    });
  }

  const referenceImage = getReferenceInput(data);
  if (referenceImage) {
    const parsed = parseDataUrl(referenceImage);
    if (parsed) {
      parts.push({
        text: "IMAGEN DE IDENTIDAD DEL PERSONAJE: sujeto e identidad visual a usar.",
      });
      parts.push({
        inline_data: {
          mime_type: parsed.mime,
          data: parsed.base64,
        },
      });
    }
  }

  return parts;
}

function getVisualInputs(data: AnalyzeRequest): string[] {
  const frames = data.frameDataUrls?.filter(Boolean) ?? [];
  if (frames.length) return frames.slice(0, 4);
  const imageUrl = data.fileDataUrl ?? data.fileUrl;
  return imageUrl ? [imageUrl] : [];
}

function getReferenceInput(data: AnalyzeRequest): string | undefined {
  return data.referenceDataUrl;
}

function parseDataUrl(value: string): { mime: string; base64: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(value);
  if (!match) return null;
  return { mime: match[1], base64: match[2] };
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
  .handler(async ({ data }): Promise<AnalyzeResponse | MockResponse> => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const visualInputs = getVisualInputs(data);
    if (!visualInputs.length) return { source: "mock", error: "No visual input provided" };
    if (!lovableKey) return { source: "mock", error: "LOVABLE_API_KEY is not configured" };

    const messages = buildVisionMessages(data);
    const key = cacheKey(data);
    const cached = getCachedAnalysis(key);
    if (cached) return cached;

    try {
      if (data.model === "gpt") {
        if (!isCoolingDown(OPENAI_MODEL)) {
          try {
            const content = await callGateway(OPENAI_MODEL, messages, lovableKey);
            const raw = enforceReferenceIdentity(safeParse(content), data);
            const result = {
              source: "openai" as const,
              analysis: stripBase(raw),
              prompts: buildPromptsFromBase(raw.base, data.mode, data.kind),
            };
            setCachedAnalysis(key, result);
            return result;
          } catch (err) {
            if (!isQuotaOrRateLimit(err)) throw err;
            coolDown(OPENAI_MODEL);
            console.warn("[analyzePrompt] openai quota/rate limit, falling back to gemini");
          }
        }

        const content = await callGateway(GEMINI_MODEL, messages, lovableKey);
        const raw = enforceReferenceIdentity(safeParse(content), data);
        const result = {
          source: "gemini" as const,
          analysis: stripBase(raw),
          prompts: buildPromptsFromBase(raw.base, data.mode, data.kind),
        };
        setCachedAnalysis(key, result);
        return result;
      }

      if (data.model === "gem") {
        const content = await callGateway(GEMINI_MODEL, messages, lovableKey);
        const raw = enforceReferenceIdentity(safeParse(content), data);
        const result = {
          source: "gemini" as const,
          analysis: stripBase(raw),
          prompts: buildPromptsFromBase(raw.base, data.mode, data.kind),
        };
        setCachedAnalysis(key, result);
        return result;
      }

      // model === "both": Gemini para análisis visual + OpenAI para refinar prompts.
      let raw: RawAnalysis;
      try {
        const content = await callGateway(GEMINI_MODEL, messages, lovableKey);
        raw = safeParse(content);
      } catch (err) {
        if (isQuotaOrRateLimit(err)) coolDown(GEMINI_MODEL);
        console.warn("[analyzePrompt] gemini failed, mock:", err);
        return { source: "mock", error: err instanceof Error ? err.message : "Gemini failed" };
      }
      let refined = false;
      if (!isCoolingDown(OPENAI_MODEL)) {
        try {
          raw = await refineWithOpenAI(raw, data, lovableKey);
          refined = true;
        } catch (err) {
          if (isQuotaOrRateLimit(err)) coolDown(OPENAI_MODEL);
          console.warn("[analyzePrompt] openai refine failed, using gemini only:", err);
        }
      }
      raw = enforceReferenceIdentity(raw, data);
      const result = {
        source: refined ? ("combined" as const) : ("gemini" as const),
        analysis: stripBase(raw),
        prompts: buildPromptsFromBase(raw.base, data.mode, data.kind),
      };
      setCachedAnalysis(key, result);
      return result;
    } catch (err) {
      if (isQuotaOrRateLimit(err)) {
        const model = data.model === "gem" ? GEMINI_MODEL : OPENAI_MODEL;
        coolDown(model);
      }
      console.warn("[analyzePrompt] provider error, mock:", err);
      return {
        source: "mock",
        error: err instanceof Error ? err.message : "AI provider error",
      };
    }
  });

function stripBase(raw: RawAnalysis): AnalysisFields {
  const { base: _omit, ...rest } = raw;
  void _omit;
  return rest;
}

// Shared helpers so client can build the same Prompts shape from analysis.
export type { Prompts };

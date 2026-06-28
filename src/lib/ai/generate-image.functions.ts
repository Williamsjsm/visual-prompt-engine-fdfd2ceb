import { createServerFn } from "@tanstack/react-start";

export type ImageAiEngine = "gemini" | "openai";

export type GenerateImageRequest = {
  engine: ImageAiEngine;
  prompt: string;
  format: string;
  style: string;
  target: string;
  editImageDataUrl?: string;
  referenceImageDataUrl?: string;
  sceneImageDataUrl?: string;
};

export type GenerateImageResponse = {
  source: ImageAiEngine;
  mode: "create" | "edit";
  imageDataUrl: string;
  mime: string;
  model: string;
};

type DataUrlImage = {
  mime: string;
  base64: string;
  fileName: string;
};

type ProviderResolved =
  | { kind: "gemini"; apiKey: string; model: string; gateway: true }
  | { kind: "openai"; apiKey: string; model: string; gateway: true }
  | { kind: "openai"; apiKey: string; model: string; gateway: false };

const LOVABLE_IMAGE_API_URL = "https://ai.gateway.lovable.dev/v1/images/generations";
const OPENAI_GENERATIONS_API_URL = "https://api.openai.com/v1/images/generations";
const OPENAI_EDITS_API_URL = "https://api.openai.com/v1/images/edits";

const LOVABLE_GEMINI_IMAGE_MODEL =
  process.env.LOVABLE_GEMINI_IMAGE_MODEL || "google/gemini-2.5-flash-image";
const LOVABLE_OPENAI_IMAGE_MODEL = process.env.LOVABLE_OPENAI_IMAGE_MODEL || "openai/gpt-image-2";
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

export const generateImageWithAi = createServerFn({ method: "POST" })
  .inputValidator((input: GenerateImageRequest) => input)
  .handler(async ({ data }): Promise<GenerateImageResponse> => {
    const prompt = data.prompt.trim();
    if (!prompt) throw new Error("Escribe o genera un prompt antes de crear la imagen.");

    const provider = resolveProvider(data.engine);
    if (!provider) throw new Error(notConfiguredMessage(data.engine));

    const images = collectImages(data);
    const mode = images.length > 0 ? "edit" : "create";
    const finalPrompt = buildImagePrompt(data, provider.gateway);

    const image =
      provider.gateway && provider.kind === "gemini"
        ? await generateGeminiViaLovable(finalPrompt, provider.apiKey, provider.model)
        : provider.gateway && provider.kind === "openai"
          ? await generateOpenAiViaLovable(
              finalPrompt,
              data.format,
              provider.apiKey,
              provider.model,
            )
          : mode === "edit"
            ? await editWithOpenAI(
                finalPrompt,
                images,
                data.format,
                provider.apiKey,
                provider.model,
              )
            : await generateWithOpenAI(finalPrompt, data.format, provider.apiKey, provider.model);

    return {
      source: provider.kind,
      mode: provider.gateway ? "create" : mode,
      imageDataUrl: toDataUrl(image.mime, image.base64),
      mime: image.mime,
      model: provider.model,
    };
  });

function resolveProvider(engine: ImageAiEngine): ProviderResolved | null {
  const lovableKey = process.env.LOVABLE_API_KEY?.trim();
  if (engine === "gemini") {
    return lovableKey
      ? {
          kind: "gemini",
          apiKey: lovableKey,
          model: LOVABLE_GEMINI_IMAGE_MODEL,
          gateway: true,
        }
      : null;
  }

  if (lovableKey) {
    return {
      kind: "openai",
      apiKey: lovableKey,
      model: LOVABLE_OPENAI_IMAGE_MODEL,
      gateway: true,
    };
  }

  if (process.env.ENABLE_OPENAI_DIRECT_FALLBACK !== "true") return null;
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  return openAiKey
    ? { kind: "openai", apiKey: openAiKey, model: OPENAI_IMAGE_MODEL, gateway: false }
    : null;
}

function notConfiguredMessage(engine: ImageAiEngine): string {
  if (engine === "gemini") {
    return "Generación de imagen no configurada: falta LOVABLE_API_KEY. Este proyecto usa el mismo gateway de Lovable que ia-contenido-studio para Gemini Imagen.";
  }
  return "Generación de imagen no configurada: falta LOVABLE_API_KEY. OpenAI directo está desactivado para evitar el error de billing; actívalo sólo con ENABLE_OPENAI_DIRECT_FALLBACK=true.";
}

function collectImages(data: GenerateImageRequest): DataUrlImage[] {
  return [
    parseDataUrlImage(data.editImageDataUrl, "imagen-base.jpg"),
    parseDataUrlImage(data.referenceImageDataUrl, "avatar-referencia.jpg"),
    parseDataUrlImage(data.sceneImageDataUrl, "escena-referencia.jpg"),
  ].filter((image): image is DataUrlImage => Boolean(image));
}

function buildImagePrompt(data: GenerateImageRequest, gateway: boolean): string {
  const references = [
    data.editImageDataUrl && !gateway
      ? "Modify the uploaded base image according to the prompt. Preserve useful composition unless the prompt says otherwise."
      : "",
    data.editImageDataUrl && gateway
      ? "The user supplied a base image to modify, but this generation provider receives prompt text only. Recreate the requested edit as a new still image from the prompt."
      : "",
    data.referenceImageDataUrl
      ? "Use the character reference as exact identity intent. Preserve face, age, skin tone, hair, body proportions, distinctive details and overall appearance described in the prompt. Do not redesign the person."
      : "",
    data.sceneImageDataUrl
      ? "Use the scene reference intent only for environment, camera, lighting, mood and composition. Do not copy another person's identity from the scene reference."
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    normalizeResolutionTo4K(data.prompt),
    references,
    `Target platform: ${data.target}.`,
    `Aspect ratio: ${data.format}.`,
    `Visual style: ${data.style}.`,
    "Output a single finished still image. No text overlays, no watermark, no collage, no split-screen, no before-after transition.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function generateGeminiViaLovable(
  prompt: string,
  key: string,
  model: string,
): Promise<{ mime: string; base64: string }> {
  const res = await callProvider(
    LOVABLE_IMAGE_API_URL,
    key,
    {
      model,
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    },
    90_000,
  );
  return extractProviderImage(res, "image/png");
}

async function generateOpenAiViaLovable(
  prompt: string,
  format: string,
  key: string,
  model: string,
): Promise<{ mime: string; base64: string }> {
  const res = await callProvider(
    LOVABLE_IMAGE_API_URL,
    key,
    {
      model,
      prompt,
      size: openAiSize(format),
      n: 1,
      quality: "low",
    },
    90_000,
  );
  return extractProviderImage(res, "image/png");
}

async function generateWithOpenAI(
  prompt: string,
  format: string,
  key: string,
  model: string,
): Promise<{ mime: string; base64: string }> {
  const res = await callProvider(
    OPENAI_GENERATIONS_API_URL,
    key,
    {
      model,
      prompt,
      size: openAiSize(format),
      quality: "low",
      output_format: "jpeg",
      n: 1,
    },
    90_000,
  );
  return extractProviderImage(res, "image/jpeg");
}

async function editWithOpenAI(
  prompt: string,
  images: DataUrlImage[],
  format: string,
  key: string,
  model: string,
): Promise<{ mime: string; base64: string }> {
  if (!images.length) return generateWithOpenAI(prompt, format, key, model);

  const form = new FormData();
  form.append("model", model);
  form.append("prompt", prompt);
  form.append("size", openAiSize(format));
  form.append("quality", "low");
  form.append("output_format", "jpeg");

  for (const image of images.slice(0, 4)) {
    const blob = new Blob([Buffer.from(image.base64, "base64")], { type: image.mime });
    form.append("image[]", blob, image.fileName);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  let response: Response;
  try {
    response = await fetch(OPENAI_EDITS_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      signal: controller.signal,
      body: form,
    });
  } catch {
    clearTimeout(timeout);
    throw new Error("No se pudo contactar con OpenAI Images. Intenta de nuevo.");
  }
  clearTimeout(timeout);

  if (!response.ok) throw await providerError("OpenAI Image", response);
  return extractProviderImage(await response.json(), "image/jpeg");
}

async function callProvider(
  url: string,
  key: string,
  body: Record<string, unknown>,
  timeoutMs: number,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      signal: controller.signal,
      body: JSON.stringify(body),
    });
  } catch {
    clearTimeout(timeout);
    throw new Error("No se pudo contactar con el proveedor de imagen. Intenta de nuevo.");
  }
  clearTimeout(timeout);

  if (!response.ok) throw await providerError("Image provider", response);
  return response.json();
}

async function providerError(prefix: string, response: Response): Promise<Error> {
  const text = await response.text().catch(() => "");
  const requestId =
    response.headers.get("x-request-id") ?? response.headers.get("x-lovable-aig-run-id") ?? "";
  let parsed: { error?: { type?: string; code?: string; message?: string }; message?: string } = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    // Keep raw text below.
  }

  const message = parsed.error?.message ?? parsed.message ?? text.slice(0, 300);
  const code = parsed.error?.code ?? "";
  const type = parsed.error?.type ?? "";
  const lower = `${message} ${code} ${type}`.toLowerCase();

  if (response.status === 401) {
    return new Error("API key inválida o no autorizada para generar imágenes.");
  }
  if (response.status === 402 || lower.includes("quota") || lower.includes("billing")) {
    return new Error("Sin crédito/cuota disponible en el proveedor de imagen.");
  }
  if (response.status === 429) {
    return new Error("Límite de peticiones alcanzado. Espera unos segundos y reintenta.");
  }
  if (
    lower.includes("content_policy") ||
    lower.includes("moderation") ||
    lower.includes("safety")
  ) {
    return new Error("El prompt fue rechazado por políticas de contenido. Reformúlalo.");
  }
  if (lower.includes("model") && (lower.includes("not") || lower.includes("unavailable"))) {
    return new Error("El modelo de imagen no está disponible para este proveedor.");
  }

  return new Error(
    `${prefix} ${response.status}: ${message || "error del proveedor"}${
      requestId ? ` (request ${requestId})` : ""
    }`,
  );
}

function extractProviderImage(
  json: unknown,
  fallbackMime: string,
): { mime: string; base64: string } {
  const dataItem = (json as { data?: { b64_json?: string; mime_type?: string }[] }).data?.[0];
  if (dataItem?.b64_json) {
    return { mime: dataItem.mime_type ?? fallbackMime, base64: dataItem.b64_json };
  }

  const recursive = extractNestedImage(json);
  if (recursive) return recursive;

  throw new Error("El proveedor no devolvió la imagen en base64.");
}

function extractNestedImage(value: unknown): { mime: string; base64: string } | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;

  const directData = typeof obj.data === "string" ? obj.data : undefined;
  const directMime =
    typeof obj.mime_type === "string"
      ? obj.mime_type
      : typeof obj.mimeType === "string"
        ? obj.mimeType
        : typeof obj.mime === "string"
          ? obj.mime
          : undefined;
  if (directData && directMime?.startsWith("image/")) {
    return { mime: directMime, base64: directData };
  }

  for (const item of Object.values(obj)) {
    if (Array.isArray(item)) {
      for (const child of item) {
        const nested = extractNestedImage(child);
        if (nested) return nested;
      }
    } else if (item && typeof item === "object") {
      const nested = extractNestedImage(item);
      if (nested) return nested;
    }
  }

  return null;
}

function parseDataUrlImage(value: string | undefined, fileName: string): DataUrlImage | null {
  if (!value) return null;
  const match = /^data:([^;]+);base64,(.+)$/s.exec(value);
  if (!match || !match[1].startsWith("image/")) return null;
  return { mime: match[1], base64: match[2], fileName };
}

function toDataUrl(mime: string, base64: string): string {
  return `data:${mime};base64,${base64}`;
}

function openAiSize(format: string): string {
  switch (format) {
    case "16:9":
      return "1536x1024";
    case "9:16":
    case "4:5":
      return "1024x1536";
    case "1:1":
    default:
      return "1024x1024";
  }
}

function normalizeResolutionTo4K(value: string): string {
  return value.replace(/\b8k\b/gi, "4k");
}

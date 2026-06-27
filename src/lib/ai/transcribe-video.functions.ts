import { createServerFn } from "@tanstack/react-start";

export type TranscribeVideoRequest = {
  fileDataUrl: string;
  mime: string;
  fileName?: string;
  language?: "auto" | "es" | "en" | "pt-BR";
};

export type DialogueSegment = {
  timestamp: string;
  speaker: string;
  text: string;
};

export type TranscribeVideoResponse = {
  source: "gemini";
  dialogueText: string;
  language: string;
  segments: DialogueSegment[];
  notes: string;
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const GEMINI_MODEL = process.env.LOVABLE_GEMINI_MODEL?.trim() || "google/gemini-3-flash-preview";

const SYSTEM_PROMPT = `Eres un transcriptor profesional para videos cortos de redes sociales.
Responde EXCLUSIVAMENTE con JSON válido y estas claves exactas:
{
  "dialogueText": string,
  "language": string,
  "segments": [{"timestamp": string, "speaker": string, "text": string}],
  "notes": string
}
Transcribe sólo voz, diálogo, narración o texto hablado audible. No describas el escenario visual en dialogueText.
Conserva el idioma original. Si no hay diálogo claro, dialogueText debe ser "" y segments debe ser [].`;

export const transcribeVideoDialogue = createServerFn({ method: "POST" })
  .inputValidator((input: TranscribeVideoRequest) => input)
  .handler(async ({ data }): Promise<TranscribeVideoResponse> => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    if (!lovableKey) throw new Error("LOVABLE_API_KEY no está configurada.");

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": lovableKey,
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extrae el diálogo hablado del video "${data.fileName ?? "video"}".
Idioma esperado: ${data.language ?? "auto"}.
Devuelve el texto listo para editar y reutilizar en un nuevo video.`,
              },
              {
                type: "image_url",
                image_url: { url: data.fileDataUrl },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Lovable Gateway no pudo extraer diálogo (${res.status}): ${body.slice(0, 240)}`,
      );
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    if (!content) throw new Error("Lovable Gateway no devolvió transcripción.");

    return normalizeResponse(content);
  });

function normalizeResponse(content: string): TranscribeVideoResponse {
  const cleaned = content.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
  const parsed = JSON.parse(cleaned) as Partial<TranscribeVideoResponse>;
  const segments = Array.isArray(parsed.segments)
    ? parsed.segments
        .map((segment) => ({
          timestamp: String(segment?.timestamp ?? ""),
          speaker: String(segment?.speaker ?? ""),
          text: String(segment?.text ?? "").trim(),
        }))
        .filter((segment) => segment.text)
        .slice(0, 40)
    : [];

  const dialogueText =
    typeof parsed.dialogueText === "string" && parsed.dialogueText.trim()
      ? parsed.dialogueText.trim()
      : segments.map((segment) => segment.text).join("\n");

  return {
    source: "gemini",
    dialogueText,
    language: typeof parsed.language === "string" ? parsed.language : "unknown",
    segments,
    notes: typeof parsed.notes === "string" ? parsed.notes : "",
  };
}

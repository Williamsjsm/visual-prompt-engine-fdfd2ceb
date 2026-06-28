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

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export const transcribeVideoDialogue = createServerFn({ method: "POST" })
  .inputValidator((input: TranscribeVideoRequest) => input)
  .handler(async ({ data }): Promise<TranscribeVideoResponse> => {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) throw new Error("GEMINI_API_KEY no está configurada.");

    const parsed = parseDataUrl(data.fileDataUrl);
    if (!parsed) throw new Error("El video no llegó en formato válido para transcribir.");

    const res = await fetch(`${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generationConfig: { responseMimeType: "application/json" },
        systemInstruction: {
          parts: [
            {
              text: `Eres un transcriptor profesional para videos cortos de redes sociales.
Responde EXCLUSIVAMENTE con JSON válido y estas claves exactas:
{
  "dialogueText": string,
  "language": string,
  "segments": [{"timestamp": string, "speaker": string, "text": string}],
  "notes": string
}
Transcribe sólo voz, diálogo, narración o texto hablado audible. No describas el escenario visual en dialogueText.
Conserva el idioma original. Si no hay diálogo claro, dialogueText debe ser "" y segments debe ser [].`,
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Extrae el diálogo hablado del video "${data.fileName ?? "video"}".
Idioma esperado: ${data.language ?? "auto"}.
Devuelve el texto listo para editar y reutilizar en un nuevo video.`,
              },
              {
                inline_data: {
                  mime_type: parsed.mime || data.mime,
                  data: parsed.base64,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gemini no pudo extraer diálogo (${res.status}): ${body.slice(0, 240)}`);
    }

    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const content = json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
    if (!content) throw new Error("Gemini no devolvió transcripción.");

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

function parseDataUrl(value: string): { mime: string; base64: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(value);
  if (!match) return null;
  return { mime: match[1], base64: match[2] };
}

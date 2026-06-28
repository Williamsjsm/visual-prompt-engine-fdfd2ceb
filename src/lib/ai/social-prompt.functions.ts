import { createServerFn } from "@tanstack/react-start";
import type { AiModel, IdentityLock, SceneAdaptation } from "@/lib/prompt-store";
import { EXACT_IDENTITY_PROMPT_BLOCK } from "./mock-presets";

export type SocialPreset = "tiktok" | "reels" | "shorts";

export type SocialPromptPack = {
  source: "openai" | "gemini" | "fallback";
  preset: SocialPreset;
  enhancedPrompt: string;
  hook: string;
  caption: string;
  hashtags: string[];
  cta: string;
  sceneBeats: string[];
};

type ImproveRequest = {
  text: string;
  model: AiModel;
  preset: SocialPreset;
  preserveIdentity?: boolean;
  identityLock?: IdentityLock;
  sceneAdaptation?: SceneAdaptation;
  dialogueText?: string;
};

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const FLOW_DEFAULT_VOICE_RULE =
  "Si hay dialogo, no inventes ni fuerces voz masculina, femenina, edad vocal, acento o timbre. Flow debe conservar la voz predeterminada de cada personaje activo; el pack solo aporta el texto hablado.";

export const improveSocialPrompt = createServerFn({ method: "POST" })
  .inputValidator((input: ImproveRequest) => input)
  .handler(async ({ data }): Promise<SocialPromptPack> => {
    const text = sanitizeGeneratedPromptLanguage(data.text.trim());
    if (!text) return fallbackPack("", data.preset);

    const openAiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    try {
      if (data.model === "gem" && geminiKey) {
        return {
          ...(await improveWithGemini(
            text,
            data.preset,
            geminiKey,
            Boolean(data.preserveIdentity),
            data.identityLock,
            data.sceneAdaptation,
            data.dialogueText,
          )),
          source: "gemini",
        };
      }

      if (openAiKey) {
        return {
          ...(await improveWithOpenAI(
            text,
            data.preset,
            openAiKey,
            Boolean(data.preserveIdentity),
            data.identityLock,
            data.sceneAdaptation,
            data.dialogueText,
          )),
          source: "openai",
        };
      }

      if (geminiKey) {
        return {
          ...(await improveWithGemini(
            text,
            data.preset,
            geminiKey,
            Boolean(data.preserveIdentity),
            data.identityLock,
            data.sceneAdaptation,
            data.dialogueText,
          )),
          source: "gemini",
        };
      }
    } catch (err) {
      console.warn("[improveSocialPrompt] provider failed, using fallback:", err);
    }

    return fallbackPack(text, data.preset, Boolean(data.preserveIdentity));
  });

async function improveWithOpenAI(
  text: string,
  preset: SocialPreset,
  key: string,
  preserveIdentity: boolean,
  identityLock?: IdentityLock,
  sceneAdaptation?: SceneAdaptation,
  dialogueText?: string,
): Promise<Omit<SocialPromptPack, "source">> {
  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: socialSystemPrompt },
        {
          role: "user",
          content: buildUserPrompt(
            text,
            preset,
            preserveIdentity,
            identityLock,
            sceneAdaptation,
            dialogueText,
          ),
        },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return safeParse(json.choices?.[0]?.message?.content ?? "", text, preset, preserveIdentity);
}

async function improveWithGemini(
  text: string,
  preset: SocialPreset,
  key: string,
  preserveIdentity: boolean,
  identityLock?: IdentityLock,
  sceneAdaptation?: SceneAdaptation,
  dialogueText?: string,
): Promise<Omit<SocialPromptPack, "source">> {
  const res = await fetch(`${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      generationConfig: { responseMimeType: "application/json" },
      systemInstruction: { parts: [{ text: socialSystemPrompt }] },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: buildUserPrompt(
                text,
                preset,
                preserveIdentity,
                identityLock,
                sceneAdaptation,
                dialogueText,
              ),
            },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const content = json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
  return safeParse(content ?? "", text, preset, preserveIdentity);
}

const socialSystemPrompt = `Eres un estratega creativo para videos virales. Convierte prompts visuales en paquetes listos para redes sociales.
Responde EXCLUSIVAMENTE con JSON válido y estas claves exactas:
{
  "preset": "tiktok" | "reels" | "shorts",
  "enhancedPrompt": string,
  "hook": string,
  "caption": string,
  "hashtags": string[],
  "cta": string,
  "sceneBeats": string[]
}
Mantén el prompt visual en inglés cuando sea útil para modelos generativos, pero escribe hook, caption, CTA y beats en español neutro.
Si el prompt menciona identidad, personaje, facial features, distinctive details o rasgos de persona, NO cambies ni rediseñes al personaje. Mejorar NO significa transformar identidad; sólo puedes mejorar cámara, ritmo, composición, formato, iluminación, edición y claridad técnica.
La calidad objetivo máxima del prompt es 4K. No uses 8K.
En enhancedPrompt no escribas etiquetas sobre archivo de entrada, imagen fuente, identidad fuente, imagen de identidad ni sujeto externo. Usa "same character identity" y "consistent face/body details".
Nunca conviertas una imagen de identidad en una intro, foto animada, morph, collage, split-screen o transición. El personaje debe aparecer integrado directamente en la escena desde el primer frame.
${FLOW_DEFAULT_VOICE_RULE}`;

function buildUserPrompt(
  text: string,
  preset: SocialPreset,
  preserveIdentity: boolean,
  identityLock?: IdentityLock,
  sceneAdaptation?: SceneAdaptation,
  dialogueText?: string,
): string {
  const dialogue = dialogueText?.trim();
  return `Plataforma destino: ${presetLabel(preset)}.
Optimiza este prompt para recrear el video/imagen y publicarlo en redes:
${text}
${dialogue ? `\nDiálogo/voz original editable del video:\n${dialogue}\n` : ""}

Reglas:
- enhancedPrompt: denso, visual, útil para generación de imagen/video, con formato vertical 9:16 cuando aplique.
- Resolución/calidad: usar 4K como objetivo máximo; no escribir 8K.
- Si hay diálogo, NO lo mezcles dentro del prompt visual como descripción de imagen; consérvalo para caption, beats o instrucciones de edición.
- ${FLOW_DEFAULT_VOICE_RULE}
- Escena: ${sceneRule(sceneAdaptation)}.
- Identidad: ${identityRule(identityLock)}.
- Mantén el sujeto/personaje del prompt original sin cambios.
- No cambies rostro, rasgos, proporciones, piel, cabello, cuerpo, edad aparente, ropa distintiva, accesorios ni marcas visuales del personaje.
- No reemplaces el personaje por una versión genérica, más atractiva, más cinematográfica, más joven, diferente o rediseñada.
- Añade mejoras alrededor del prompt original; no reescribas la identidad.
${preserveIdentity ? `- MODO IDENTIDAD BLOQUEADA: conserva literalmente la identidad del personaje y coloca este bloque completo al inicio de enhancedPrompt:\n${EXACT_IDENTITY_PROMPT_BLOCK}` : ""}
- No crear una toma inicial separada ni una transición previa hacia el escenario. Empieza directamente en la escena final.
- hook: primera frase para retener atención en 2 segundos.
- caption: texto breve para publicación.
- hashtags: 8 a 12 hashtags relevantes.
- cta: llamada a la acción natural.
- sceneBeats: 4 a 6 pasos de escena/cámara/edición.`;
}

function sceneRule(mode: SceneAdaptation | undefined): string {
  switch (mode) {
    case "exact":
      return "mantener el escenario lo más parecido posible al contenido original";
    case "style":
      return "mantener sólo estética, luz, color, cámara y ritmo; evitar copiar el escenario";
    case "new":
      return "crear un escenario nuevo y original, conservando sólo la intención visual";
    case "similar":
    default:
      return "mantener ambiente y composición general, pero hacerlo original";
  }
}

function identityRule(mode: IdentityLock | undefined): string {
  switch (mode) {
    case "flex":
      return "parecido general, con pequeñas adaptaciones naturales";
    case "ultra":
      return "máxima continuidad: no cambiar ningún rasgo del personaje";
    case "strict":
    default:
      return "misma persona, sin rediseñar rasgos distintivos";
  }
}

function safeParse(
  content: string,
  original: string,
  preset: SocialPreset,
  preserveIdentity = false,
): Omit<SocialPromptPack, "source"> {
  try {
    const cleaned = content.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
    const parsed = JSON.parse(cleaned) as Partial<SocialPromptPack>;
    return normalizePack(parsed, original, preset, preserveIdentity);
  } catch {
    const pack = fallbackPack(original, preset, preserveIdentity);
    const { source: _source, ...rest } = pack;
    void _source;
    return rest;
  }
}

function normalizePack(
  parsed: Partial<SocialPromptPack>,
  original: string,
  preset: SocialPreset,
  preserveIdentity = false,
): Omit<SocialPromptPack, "source"> {
  const fallback = fallbackPack(original, preset);
  const enhancedPrompt =
    sanitizeGeneratedPromptLanguage(clean(parsed.enhancedPrompt)) || fallback.enhancedPrompt;
  return {
    preset,
    enhancedPrompt: preserveIdentity ? applyExactIdentityBlock(enhancedPrompt) : enhancedPrompt,
    hook: clean(parsed.hook) || fallback.hook,
    caption: clean(parsed.caption) || fallback.caption,
    hashtags: Array.isArray(parsed.hashtags)
      ? parsed.hashtags.map(String).filter(Boolean).slice(0, 12)
      : fallback.hashtags,
    cta: clean(parsed.cta) || fallback.cta,
    sceneBeats: Array.isArray(parsed.sceneBeats)
      ? parsed.sceneBeats.map(String).filter(Boolean).slice(0, 6)
      : fallback.sceneBeats,
  };
}

function fallbackPack(
  text: string,
  preset: SocialPreset,
  preserveIdentity = false,
): SocialPromptPack {
  return buildFallbackPack(text, preset, preserveIdentity);
}

function buildFallbackPack(
  text: string,
  preset: SocialPreset,
  preserveIdentity: boolean,
): SocialPromptPack {
  const base =
    sanitizeGeneratedPromptLanguage(text) ||
    "cinematic visual story, high detail, dramatic lighting";
  const identityLock = preserveIdentity ? EXACT_IDENTITY_PROMPT_BLOCK : "";
  const vertical =
    preset === "shorts"
      ? "YouTube Shorts vertical 9:16"
      : preset === "reels"
        ? "Instagram Reels vertical 9:16"
        : "TikTok vertical 9:16";

  return {
    source: "fallback",
    preset,
    enhancedPrompt: `${identityLock ? `${identityLock}\n\n` : ""}${base}, optimized for ${vertical}, strong opening frame, dynamic camera movement, crisp subject separation, trend-ready pacing, high retention composition, cinematic color grading`,
    hook:
      preset === "shorts"
        ? "Esto parece sacado de una película."
        : preset === "reels"
          ? "Guarda esta idea para tu próximo video."
          : "No vas a creer cómo se recrea este look.",
    caption:
      preset === "shorts"
        ? "Una escena visual lista para transformar en contenido vertical."
        : preset === "reels"
          ? "Inspiración visual para crear una pieza cinematográfica en segundos."
          : "Prompt listo para recrear este estilo y publicarlo en vertical.",
    hashtags: [
      "#prompt",
      "#aiart",
      "#videocreator",
      "#reels",
      "#tiktok",
      "#shorts",
      "#contentcreator",
      "#cinematic",
    ],
    cta: "Pruébalo con tu propio video y ajusta el estilo a tu marca.",
    sceneBeats: [
      "Abrir con el detalle visual más impactante en el primer segundo.",
      "Usar movimiento suave de cámara para revelar el sujeto principal.",
      "Reforzar iluminación, color y textura para crear identidad visual.",
      "Cerrar con una composición limpia que invite a guardar o compartir.",
    ],
  };
}

function presetLabel(preset: SocialPreset): string {
  return preset === "tiktok" ? "TikTok" : preset === "reels" ? "Instagram Reels" : "YouTube Shorts";
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function applyExactIdentityBlock(value: string): string {
  if (/Use the reference image as the exact character reference/i.test(value)) return value;
  return `${EXACT_IDENTITY_PROMPT_BLOCK}\n\n${value}`;
}

function sanitizeGeneratedPromptLanguage(value: string): string {
  return value
    .replace(/the same referenced avatar\/person/gi, "the exact same person")
    .replace(/same referenced avatar\/person/gi, "the exact same person")
    .replace(/referenced avatar\/person/gi, "exact character reference")
    .replace(/referenced avatar/gi, "person")
    .replace(/reference-image/gi, "reference image")
    .replace(/attached image/gi, "reference image")
    .replace(/uploaded image/gi, "reference image")
    .replace(/provided image/gi, "reference image")
    .replace(/input image/gi, "reference image")
    .replace(/source image/gi, "reference image")
    .replace(/identity source/gi, "reference image")
    .replace(/identity-source/gi, "reference image")
    .replace(/referenced person/gi, "exact same person")
    .replace(/\bavatar\/person\b/gi, "person")
    .replace(/\bavatar\b/gi, "person")
    .replace(/\breferenced\b/gi, "exact")
    .replace(/\b8k\b/gi, "4k")
    .replace(/\s{2,}/g, " ")
    .trim();
}

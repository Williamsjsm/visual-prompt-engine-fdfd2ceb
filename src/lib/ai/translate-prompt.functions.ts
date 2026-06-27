import { createServerFn } from "@tanstack/react-start";
import type { AiModel } from "@/lib/prompt-store";

export type TranslationTarget = "es" | "en" | "pt-BR";

type TranslateRequest = {
  text: string;
  model: AiModel;
  target: TranslationTarget;
};

type TranslateResponse = {
  source: "openai" | "gemini" | "fallback";
  text: string;
  target: TranslationTarget;
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const GEMINI_MODEL = process.env.LOVABLE_GEMINI_MODEL?.trim() || "google/gemini-3-flash-preview";
const OPENAI_MODEL = process.env.LOVABLE_OPENAI_MODEL?.trim() || "openai/gpt-5-mini";

export const translatePrompt = createServerFn({ method: "POST" })
  .inputValidator((input: TranslateRequest) => input)
  .handler(async ({ data }): Promise<TranslateResponse> => {
    const text = data.text.trim();
    const target = data.target;
    if (!text) return { source: "fallback", text: "", target };

    const lovableKey = process.env.LOVABLE_API_KEY;
    if (!lovableKey) return { source: "fallback", text: translateLocally(text, target), target };

    try {
      if (data.model === "gem") {
        return {
          source: "gemini",
          text: await translateWithGateway(GEMINI_MODEL, text, target, lovableKey),
          target,
        };
      }

      try {
        return {
          source: "openai",
          text: await translateWithGateway(OPENAI_MODEL, text, target, lovableKey),
          target,
        };
      } catch (err) {
        if (!isQuotaOrRateLimit(err)) throw err;
        console.warn("[translatePrompt] openai quota/rate limit, falling back to gemini");
        return {
          source: "gemini",
          text: await translateWithGateway(GEMINI_MODEL, text, target, lovableKey),
          target,
        };
      }
    } catch (err) {
      console.warn("[translatePrompt] provider failed, using fallback:", err);
    }

    return { source: "fallback", text: translateLocally(text, target), target };
  });

async function translateWithGateway(
  model: string,
  text: string,
  target: TranslationTarget,
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
      messages: [
        {
          role: "system",
          content: `Traduce prompts de generación visual a ${targetLabel(target)}. Mantén parámetros técnicos, flags, nombres de modelos, proporciones, números y comandos como --ar intactos. Devuelve sólo el prompt traducido.`,
        },
        { role: "user", content: text },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gateway ${model} ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return cleanTranslation(json.choices?.[0]?.message?.content ?? text);
}

function isQuotaOrRateLimit(err: unknown) {
  if (!(err instanceof Error)) return false;
  const message = err.message.toLowerCase();
  return (
    message.includes(" 402:") ||
    message.includes(" 429:") ||
    message.includes("quota") ||
    message.includes("credit") ||
    message.includes("rate limit") ||
    message.includes("insufficient")
  );
}

function cleanTranslation(text: string): string {
  return text.trim().replace(/^```(?:txt|text)?\s*|\s*```$/g, "");
}

function targetLabel(target: TranslationTarget): string {
  return target === "pt-BR" ? "português do Brasil" : target === "es" ? "español" : "inglés";
}

function translateLocally(text: string, target: TranslationTarget): string {
  if (target === "en") return text;

  const shared: [RegExp, string][] =
    target === "pt-BR"
      ? [
          [/\btraditional Japanese temple\b/gi, "templo japonês tradicional"],
          [/\bat night\b/gi, "à noite"],
          [/\billuminated by\b/gi, "iluminado por"],
          [/\bwarm lanterns\b/gi, "lanternas quentes"],
          [/\bcherry blossom trees\b/gi, "cerejeiras em flor"],
          [/\bin full bloom\b/gi, "em plena floração"],
          [/\bfull moon\b/gi, "lua cheia"],
          [/\bclear starry sky\b/gi, "céu claro e estrelado"],
          [/\breflection\b/gi, "reflexo"],
          [/\bcalm lake water\b/gi, "água calma do lago"],
          [/\bcinematic lighting\b/gi, "iluminação cinematográfica"],
          [/\bultra realistic\b/gi, "ultrarrealista"],
          [/\bhigh detail\b/gi, "alto nível de detalhe"],
          [/\bwide angle\b/gi, "grande angular"],
          [/\bblurry\b/gi, "desfocado"],
          [/\blow quality\b/gi, "baixa qualidade"],
          [/\bdistorted\b/gi, "distorcido"],
          [/\bdeformed\b/gi, "deformado"],
          [/\bwatermark\b/gi, "marca d'água"],
          [/\btext\b/gi, "texto"],
          [/\blogo\b/gi, "logotipo"],
          [/\boversaturated\b/gi, "supersaturado"],
          [/\blow resolution\b/gi, "baixa resolução"],
          [/\bcinematic shot\b/gi, "tomada cinematográfica"],
          [/\banamorphic lens\b/gi, "lente anamórfica"],
          [/\bshallow depth of field\b/gi, "profundidade de campo rasa"],
          [/\bvolumetric light\b/gi, "luz volumétrica"],
          [/\bcolor graded\b/gi, "colorização"],
          [/\bfilm grain\b/gi, "granulação de filme"],
          [/\bultra detailed photo\b/gi, "foto ultra detalhada"],
          [/\bphotorealistic\b/gi, "fotorrealista"],
          [/\bsharp focus\b/gi, "foco nítido"],
          [/\bsmooth camera motion\b/gi, "movimento suave de câmera"],
        ]
      : [
          [/\btraditional Japanese temple\b/gi, "templo japonés tradicional"],
          [/\bat night\b/gi, "de noche"],
          [/\billuminated by\b/gi, "iluminado por"],
          [/\bwarm lanterns\b/gi, "linternas cálidas"],
          [/\bcherry blossom trees\b/gi, "cerezos en flor"],
          [/\bin full bloom\b/gi, "en plena floración"],
          [/\bfull moon\b/gi, "luna llena"],
          [/\bclear starry sky\b/gi, "cielo despejado y estrellado"],
          [/\breflection\b/gi, "reflejo"],
          [/\bcalm lake water\b/gi, "agua tranquila del lago"],
          [/\bcinematic lighting\b/gi, "iluminación cinematográfica"],
          [/\bultra realistic\b/gi, "ultra realista"],
          [/\bhigh detail\b/gi, "alto nivel de detalle"],
          [/\bwide angle\b/gi, "gran angular"],
          [/\bblurry\b/gi, "borroso"],
          [/\blow quality\b/gi, "baja calidad"],
          [/\bdistorted\b/gi, "distorsionado"],
          [/\bdeformed\b/gi, "deformado"],
          [/\bwatermark\b/gi, "marca de agua"],
          [/\btext\b/gi, "texto"],
          [/\blogo\b/gi, "logo"],
          [/\bphotorealistic\b/gi, "fotorrealista"],
          [/\bsharp focus\b/gi, "enfoque nítido"],
        ];

  return shared.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    text,
  );
}

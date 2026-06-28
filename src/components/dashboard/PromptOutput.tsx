import {
  Copy,
  Sparkles,
  Globe,
  Download,
  Check,
  Languages,
  RotateCcw,
  FileJson,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { usePromptStore, type PromptKey } from "@/lib/prompt-store";
import { translatePrompt, type TranslationTarget } from "@/lib/ai/translate-prompt.functions";
import {
  improveSocialPrompt,
  type SocialPreset,
  type SocialPromptPack,
} from "@/lib/ai/social-prompt.functions";
import { EXACT_IDENTITY_PROMPT_BLOCK } from "@/lib/ai/mock-presets";

const YOUTUBE_CREATE_LIMIT = 900;

const mainTabs: { id: PromptKey; label: string }[] = [
  { id: "principal", label: "Prompt Principal" },
  { id: "negativo", label: "Prompt Negativo" },
  { id: "cinematografico", label: "Prompt Cinematográfico" },
  { id: "video", label: "Prompt para Video" },
  { id: "imagenBase", label: "Imagen base Flow" },
  { id: "imagen", label: "Prompt para Imagen" },
];

const subTabs: { id: PromptKey; label: string }[] = [
  { id: "midjourney", label: "Para Midjourney" },
  { id: "flux", label: "Para Flux" },
  { id: "veo", label: "Para Veo" },
  { id: "kling", label: "Para Kling" },
  { id: "whisk", label: "Para Whisk" },
  { id: "youtubeCreate", label: "Para YouTube Create" },
];

const translationTargets: { id: TranslationTarget; label: string; short: string }[] = [
  { id: "es", label: "Español", short: "ES" },
  { id: "en", label: "Inglés", short: "EN" },
  { id: "pt-BR", label: "Portugués de Brasil", short: "PT-BR" },
];

const socialPresets: { id: SocialPreset; label: string }[] = [
  { id: "tiktok", label: "TikTok" },
  { id: "reels", label: "Reels" },
  { id: "shorts", label: "Shorts" },
];

const FLOW_DEFAULT_VOICE_DIRECTION =
  "Conservar la voz predeterminada que Flow asigna a cada personaje activo. No cambiar genero, timbre, edad vocal ni acento; usar solo el dialogo/texto hablado.";

// Highlight a handful of keywords to keep the syntax-colored look.
function highlight(text: string) {
  const map: Record<string, string> = {
    cinematic: "text-[#a78bfa]",
    cinematográfico: "text-[#a78bfa]",
    realistic: "text-[#a78bfa]",
    ultra: "text-[#a78bfa]",
    night: "text-[#60a5fa]",
    sky: "text-[#60a5fa]",
    moon: "text-[#fbbf24]",
    moonlight: "text-[#fbbf24]",
    lanterns: "text-[#fbbf24]",
    golden: "text-[#fbbf24]",
    "4k": "text-[#22d3ee]",
    "4K": "text-[#22d3ee]",
    "8k": "text-[#22d3ee]",
    "8K": "text-[#22d3ee]",
    lake: "text-[#22d3ee]",
    cyan: "text-[#22d3ee]",
    cherry: "text-[#f472b6]",
    blossom: "text-[#f472b6]",
    pink: "text-[#f472b6]",
    neon: "text-[#f472b6]",
  };
  const parts = text.split(/(\s+|,)/);
  return parts.map((p, i) => {
    const k = p.toLowerCase().replace(/[^a-z0-9]/g, "");
    const cls = map[k] || map[p];
    return cls ? (
      <span key={i} className={cls}>
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    );
  });
}

export function PromptOutput() {
  const { prompts, status, model, reference, sceneAdaptation, identityLock, dialogueText } =
    usePromptStore();
  const [tab, setTab] = useState<PromptKey>("principal");
  const [sub, setSub] = useState<PromptKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedPack, setCopiedPack] = useState(false);
  const [translated, setTranslated] = useState<{
    key: PromptKey;
    text: string;
    source: string;
    target: TranslationTarget;
  } | null>(null);
  const [translating, setTranslating] = useState<TranslationTarget | null>(null);
  const [socialPreset, setSocialPreset] = useState<SocialPreset>("reels");
  const [socialPack, setSocialPack] = useState<(SocialPromptPack & { key: PromptKey }) | null>(
    null,
  );
  const [enhancing, setEnhancing] = useState(false);

  const activeKey = sub ?? tab;
  const isYouTubeCreate = activeKey === "youtubeCreate";
  const sanitizedText = sanitizePromptForGeneration(prompts[activeKey]);
  const shouldPreserveIdentityInPrompt = Boolean(reference) && activeKey !== "negativo";
  const text = shouldPreserveIdentityInPrompt
    ? isYouTubeCreate
      ? sanitizedText
      : applyExactIdentityBlock(sanitizedText)
    : sanitizedText;
  const activeSocialPack = socialPack?.key === activeKey ? socialPack : null;
  const improvedText = activeSocialPack ? activeSocialPack.enhancedPrompt : text;
  const dialogue = dialogueText.trim();
  const shouldAttachDialogue = Boolean(dialogue) && shouldIncludeDialogueInPrompt(activeKey);
  const baseVisibleText = normalizeResolutionTo4K(
    translated?.key === activeKey ? translated.text : improvedText,
  );
  const visibleText = normalizeResolutionTo4K(
    isYouTubeCreate
      ? buildYouTubeCreateOutput(baseVisibleText, dialogue, shouldPreserveIdentityInPrompt)
      : shouldAttachDialogue
        ? appendDialogueToPrompt(baseVisibleText, dialogue)
        : baseVisibleText,
  );
  const characterLimit = isYouTubeCreate ? YOUTUBE_CREATE_LIMIT : 4000;
  const isTranslated = translated?.key === activeKey;
  const hasSocialPack = Boolean(activeSocialPack);
  const analyzing = status === "analyzing";

  const copy = async () => {
    try {
      await copyTextToClipboard(visibleText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* no-op */
    }
  };

  const copyPack = async () => {
    if (!activeSocialPack) return;
    try {
      await copyTextToClipboard(buildSocialPackText(activeSocialPack, visibleText, dialogueText));
      setCopiedPack(true);
      setTimeout(() => setCopiedPack(false), 1400);
    } catch {
      /* no-op */
    }
  };

  const exportTxt = () => {
    const blob = new Blob([visibleText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeKey}-prompt${isTranslated ? `-${translated.target.toLowerCase()}` : ""}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    const payload = {
      promptKey: activeKey,
      preset: activeSocialPack?.preset ?? socialPreset,
      prompt: visibleText,
      originalPrompt: text,
      dialogueText: dialogueText.trim() || null,
      voiceDirection: dialogueText.trim() ? FLOW_DEFAULT_VOICE_DIRECTION : null,
      translation: isTranslated
        ? {
            target: translated.target,
            source: translated.source,
            text: translated.text,
          }
        : null,
      socialPack: activeSocialPack,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeKey}-social-pack.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPackTxt = () => {
    if (!activeSocialPack) return;
    const blob = new Blob([buildSocialPackText(activeSocialPack, visibleText, dialogueText)], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeKey}-${activeSocialPack.preset}-pack.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const enhance = async () => {
    if (enhancing || analyzing) return;
    setEnhancing(true);
    setTranslated(null);
    try {
      const result = await improveSocialPrompt({
        data: {
          text,
          model,
          preset: socialPreset,
          preserveIdentity: shouldPreserveIdentityInPrompt,
          sceneAdaptation,
          identityLock,
          dialogueText,
        },
      });
      setSocialPack({ ...result, key: activeKey });
    } catch {
      setSocialPack({
        ...fallbackSocialPack(text, socialPreset, shouldPreserveIdentityInPrompt),
        key: activeKey,
      });
    } finally {
      setEnhancing(false);
    }
  };

  const translate = async (target: TranslationTarget) => {
    if (translating || analyzing) return;
    if (isTranslated && translated.target === target) {
      setTranslated(null);
      return;
    }
    setTranslating(target);
    try {
      const result = await translatePrompt({ data: { text: improvedText, model, target } });
      setTranslated({
        key: activeKey,
        text: result.text,
        source: result.source,
        target: result.target,
      });
    } catch {
      setTranslated({
        key: activeKey,
        text: translatePromptLocally(improvedText, target),
        source: "fallback",
        target,
      });
    } finally {
      setTranslating(null);
    }
  };

  return (
    <section className="glass-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-[15px] font-semibold text-white">
          <span className="text-slate-400 mr-1">4.</span> Prompt generado
        </h2>
        <div className="flex flex-wrap gap-2">
          <ActionBtn icon={copied ? Check : Copy} onClick={copy}>
            {copied ? "Copiado" : "Copiar"}
          </ActionBtn>
          <ActionBtn icon={Sparkles} highlight onClick={enhance} disabled={enhancing || analyzing}>
            {enhancing ? "Mejorando..." : "Mejorar Prompt"}
          </ActionBtn>
          <div className="inline-flex items-center overflow-hidden rounded-lg bg-white/[0.03] text-[12px] font-medium text-slate-200 ring-1 ring-white/5">
            <span className="hidden items-center gap-1.5 px-2.5 py-1.5 text-slate-400 sm:inline-flex">
              <Languages className="h-3.5 w-3.5" />
              Traducir
            </span>
            {translationTargets.map((target) => {
              const active = isTranslated && translated.target === target.id;
              const loading = translating === target.id;
              return (
                <button
                  key={target.id}
                  onClick={() => translate(target.id)}
                  disabled={Boolean(translating) || analyzing}
                  title={target.label}
                  className={
                    "border-l border-white/5 px-2.5 py-1.5 transition-all " +
                    (active
                      ? "bg-[#7c4dff]/35 text-white"
                      : "text-slate-300 hover:bg-white/[0.06] hover:text-white") +
                    (translating || analyzing ? " cursor-not-allowed opacity-60" : "")
                  }
                >
                  {loading ? "..." : target.short}
                </button>
              );
            })}
          </div>
          {isTranslated && (
            <ActionBtn icon={RotateCcw} onClick={() => setTranslated(null)}>
              Original
            </ActionBtn>
          )}
          <ActionBtn icon={Download} onClick={exportTxt}>
            Exportar TXT
          </ActionBtn>
          {hasSocialPack && (
            <>
              <ActionBtn icon={copiedPack ? Check : Copy} onClick={copyPack}>
                {copiedPack ? "Pack copiado" : "Copiar Pack"}
              </ActionBtn>
              <ActionBtn icon={Download} onClick={exportPackTxt}>
                Pack TXT
              </ActionBtn>
            </>
          )}
          <ActionBtn icon={FileJson} onClick={exportJson}>
            JSON
          </ActionBtn>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {mainTabs.map((t) => {
          const active = t.id === tab && !sub;
          return (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setSub(null);
              }}
              className={
                "rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all " +
                (active
                  ? "text-white bg-gradient-to-r from-[#7c4dff] to-[#5b5eff] shadow-[0_8px_24px_-10px_rgba(124,77,255,0.8)]"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]")
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 px-1">
        {subTabs.map((t) => {
          const active = sub === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSub(active ? null : t.id)}
              className={
                "text-[12px] transition-colors " +
                (active ? "text-[#a78bfa]" : "text-slate-400 hover:text-white")
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-medium text-slate-400">Optimizar para</span>
        <div className="inline-flex overflow-hidden rounded-lg bg-white/[0.03] text-[12px] font-medium ring-1 ring-white/5">
          {socialPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                setSocialPreset(preset.id);
                setSocialPack(null);
                setTranslated(null);
              }}
              className={
                "px-3 py-1.5 transition-all " +
                (socialPreset === preset.id
                  ? "bg-[#7c4dff]/35 text-white"
                  : "text-slate-300 hover:bg-white/[0.06] hover:text-white")
              }
            >
              {preset.label}
            </button>
          ))}
        </div>
        {hasSocialPack && (
          <span className="rounded-md bg-emerald-400/10 px-2 py-1 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-400/20">
            Pack {presetLabel(activeSocialPack!.preset)}
            {activeSocialPack!.source === "fallback" ? " local" : ""}
          </span>
        )}
      </div>

      <div className="glass-inset mt-4 p-5 font-mono text-[13.5px] leading-7 relative min-h-[140px]">
        {isTranslated && (
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-md bg-emerald-400/10 px-2 py-1 text-[11px] font-sans font-medium text-emerald-300 ring-1 ring-emerald-400/20">
            <Globe className="h-3 w-3" />
            {translationTargets.find((target) => target.id === translated.target)?.label}
            {translated.source === "fallback" ? " (local)" : ""}
          </div>
        )}
        {analyzing ? (
          <div className="space-y-2">
            <div className="h-3 w-11/12 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-3 w-10/12 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-3 w-9/12 rounded bg-white/[0.06] animate-pulse" />
          </div>
        ) : (
          <p className="text-slate-300 whitespace-pre-wrap break-words">{highlight(visibleText)}</p>
        )}
        <div className="absolute bottom-3 right-4 text-[11px] text-slate-500">
          {visibleText.length} / {characterLimit}
        </div>
      </div>

      {hasSocialPack && (
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.1fr]">
          <div className="glass-inset p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Copy para redes
            </div>
            <div className="mt-3 space-y-3 text-[12.5px] text-slate-300">
              <InfoLine label="Hook" value={activeSocialPack!.hook} />
              <InfoLine label="Caption" value={activeSocialPack!.caption} />
              <InfoLine label="CTA" value={activeSocialPack!.cta} />
              {dialogueText.trim() && <InfoLine label="Diálogo" value={dialogueText.trim()} />}
              {dialogueText.trim() && (
                <InfoLine label="Voz en Flow" value={FLOW_DEFAULT_VOICE_DIRECTION} />
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <MiniCopyButton text={activeSocialPack!.caption} label="Copiar caption" />
              <MiniCopyButton text={activeSocialPack!.hashtags.join(" ")} label="Copiar hashtags" />
              {dialogueText.trim() && (
                <MiniCopyButton text={dialogueText.trim()} label="Copiar diálogo" />
              )}
              {dialogueText.trim() && (
                <MiniCopyButton text={FLOW_DEFAULT_VOICE_DIRECTION} label="Copiar voz Flow" />
              )}
            </div>
          </div>
          <div className="glass-inset p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Hashtags y beats
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {activeSocialPack!.hashtags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-white/[0.04] px-2 py-1 text-[11.5px] text-[#a78bfa] ring-1 ring-white/5"
                >
                  {tag}
                </span>
              ))}
            </div>
            <ol className="mt-3 space-y-1.5 text-[12.5px] text-slate-300">
              {activeSocialPack!.sceneBeats.map((beat, index) => (
                <li key={beat} className="flex gap-2">
                  <span className="text-slate-500">{index + 1}.</span>
                  <span>{beat}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium text-slate-500">{label}</div>
      <div className="mt-0.5 leading-5">{value}</div>
    </div>
  );
}

function MiniCopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await copyTextToClipboard(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* no-op */
    }
  };

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.04] px-2.5 py-1.5 text-[11.5px] font-medium text-slate-300 ring-1 ring-white/5 hover:bg-white/[0.07] hover:text-white"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copied ? "Copiado" : label}
    </button>
  );
}

function ActionBtn({
  icon: Icon,
  children,
  highlight,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  highlight?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium ring-1 transition-all " +
        (disabled
          ? "cursor-not-allowed text-slate-500 bg-white/[0.02] ring-white/5"
          : highlight
            ? "text-white bg-white/[0.04] ring-[#7c4dff]/40 hover:bg-white/[0.07]"
            : "text-slate-200 bg-white/[0.03] ring-white/5 hover:bg-white/[0.07]")
      }
    >
      {children}
      <Icon className={"h-3.5 w-3.5 " + (highlight ? "text-[#a78bfa]" : "text-slate-400")} />
    </button>
  );
}

function buildSocialPackText(pack: SocialPromptPack, prompt: string, dialogueText = ""): string {
  const dialogue = dialogueText.trim();
  const hasDialogueInPrompt = promptIncludesDialogue(prompt);
  const hasVoiceInPrompt = /VOICE \/ FLOW|VOZ \/ FLOW/i.test(prompt);
  return [
    `PACK PARA ${presetLabel(pack.preset).toUpperCase()}`,
    "",
    "PROMPT OPTIMIZADO",
    prompt,
    "",
    ...(dialogue && !hasDialogueInPrompt ? ["DIÁLOGO / VOZ", dialogue, ""] : []),
    ...(dialogue && !hasVoiceInPrompt ? ["VOZ / FLOW", FLOW_DEFAULT_VOICE_DIRECTION, ""] : []),
    "HOOK",
    pack.hook,
    "",
    "CAPTION",
    pack.caption,
    "",
    "HASHTAGS",
    pack.hashtags.join(" "),
    "",
    "CTA",
    pack.cta,
    "",
    "BEATS DE ESCENA",
    ...pack.sceneBeats.map((beat, index) => `${index + 1}. ${beat}`),
  ].join("\n");
}

async function copyTextToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (!copied) throw new Error("No se pudo copiar al portapapeles");
  }
}

function translatePromptLocally(text: string, target: TranslationTarget): string {
  if (target === "en") return text;

  const phrases: [RegExp, string][] =
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
          [/\blogo\b/gi, "logotipo"],
          [/\bphotorealistic\b/gi, "fotorrealista"],
          [/\bsharp focus\b/gi, "foco nítido"],
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
          [/\blogo\b/gi, "logo"],
          [/\bphotorealistic\b/gi, "fotorrealista"],
          [/\bsharp focus\b/gi, "enfoque nítido"],
        ];

  return phrases.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    text,
  );
}

function fallbackSocialPack(
  text: string,
  preset: SocialPreset,
  preserveIdentity = false,
): SocialPromptPack {
  const base =
    sanitizePromptForGeneration(text) || "cinematic visual story, high detail, dramatic lighting";
  const identityLock = preserveIdentity ? EXACT_IDENTITY_PROMPT_BLOCK : "";
  return {
    source: "fallback",
    preset,
    enhancedPrompt: `${identityLock ? `${identityLock}\n\n` : ""}${base}, optimized for ${presetLabel(preset)}, vertical 9:16, strong first frame, dynamic camera motion, cinematic color grade, high-retention pacing`,
    hook: "No vas a creer cómo se recrea este estilo.",
    caption: "Prompt listo para transformar una referencia visual en contenido vertical.",
    hashtags: [
      "#prompt",
      "#aiart",
      "#contentcreator",
      "#reels",
      "#tiktok",
      "#shorts",
      "#cinematic",
      "#videocreator",
    ],
    cta: "Pruébalo con tu propio video y ajusta el estilo a tu marca.",
    sceneBeats: [
      "Abrir con el detalle visual más fuerte.",
      "Revelar el sujeto con movimiento suave de cámara.",
      "Reforzar luz, color y textura.",
      "Cerrar con una composición limpia para guardar o compartir.",
    ],
  };
}

function presetLabel(preset: SocialPreset): string {
  return preset === "tiktok" ? "TikTok" : preset === "reels" ? "Reels" : "Shorts";
}

function buildYouTubeCreateOutput(
  prompt: string,
  dialogue: string,
  preserveIdentity: boolean,
): string {
  const identity = preserveIdentity
    ? "Use reference image as exact character identity; keep same face, age, body, skin tone, hair, proportions and distinctive details; do not redesign. "
    : "";
  const suffix =
    "YouTube Create vertical 9:16, photorealistic cinematic video, natural motion. Start in final scene, no intro, no photo animation, no morph, no transition.";
  const cleanScene =
    stripYouTubeCreateNoise(prompt) || "cinematic scene with clear subject, setting and action";
  const cleanDialogue = stripYouTubeCreateNoise(dialogue);
  const dialogueBudget = cleanDialogue
    ? Math.min(260, Math.max(80, YOUTUBE_CREATE_LIMIT - identity.length - suffix.length - 180))
    : 0;
  const dialogueBlock = cleanDialogue
    ? ` Dialogue: "${truncateAtWord(cleanDialogue, dialogueBudget)}"`
    : "";
  const scenePrefix = "Scene: ";
  const sceneBudget =
    YOUTUBE_CREATE_LIMIT -
    identity.length -
    scenePrefix.length -
    suffix.length -
    dialogueBlock.length -
    2;
  const scene = truncateAtWord(cleanScene, Math.max(80, sceneBudget));

  return truncateAtWord(`${identity}${scenePrefix}${scene}. ${suffix}${dialogueBlock}`, 900);
}

function stripYouTubeCreateNoise(value: string): string {
  return sanitizePromptForGeneration(value)
    .replace(EXACT_IDENTITY_PROMPT_BLOCK, "")
    .replace(/Use the reference image as the exact character reference\.[\s\S]*?transition\./i, "")
    .replace(/DIALOGUE \/ SPOKEN TEXT:[\s\S]*$/i, "")
    .replace(/DI[ÁA]LOGO \/ VOZ:[\s\S]*$/i, "")
    .replace(/VOICE \/ FLOW:[\s\S]*$/i, "")
    .replace(/VOZ \/ FLOW:[\s\S]*$/i, "")
    .replace(/IMAGE SETTINGS:[\s\S]*$/i, "")
    .replace(/--ar\s+\S+/gi, "")
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function truncateAtWord(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  const limit = Math.max(0, maxLength - 3);
  const cut = value.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : limit).trim()}...`;
}

function normalizeResolutionTo4K(value: string): string {
  return value.replace(/\b8k\b/gi, "4k");
}

function shouldIncludeDialogueInPrompt(key: PromptKey): boolean {
  return (
    key === "principal" ||
    key === "cinematografico" ||
    key === "video" ||
    key === "veo" ||
    key === "kling"
  );
}

function appendDialogueToPrompt(prompt: string, dialogue: string): string {
  if (promptIncludesDialogue(prompt)) return prompt;
  return `${prompt}\n\nDIALOGUE / SPOKEN TEXT:\n${dialogue}\n\nVOICE / FLOW:\n${FLOW_DEFAULT_VOICE_DIRECTION}`;
}

function promptIncludesDialogue(prompt: string): boolean {
  return /DIALOGUE \/ SPOKEN TEXT|DI[ÁA]LOGO \/ VOZ|Dialogue:/i.test(prompt);
}

function applyExactIdentityBlock(value: string): string {
  if (!needsExactIdentityBlock(value)) return value;
  if (/Use the reference image as the exact character reference/i.test(value)) return value;
  return `${EXACT_IDENTITY_PROMPT_BLOCK}\n\n${value}`;
}

function needsExactIdentityBlock(value: string): boolean {
  return /same character identity|identity locked|consistent face|distinctive features|exact identity consistency|exact character reference/i.test(
    value,
  );
}

function sanitizePromptForGeneration(value: string): string {
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

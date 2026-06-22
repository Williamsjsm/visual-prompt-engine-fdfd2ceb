import { Copy, Sparkles, Globe, Download, Check } from "lucide-react";
import { useState } from "react";
import { usePromptStore, type PromptKey } from "@/lib/prompt-store";

const mainTabs: { id: PromptKey; label: string }[] = [
  { id: "principal", label: "Prompt Principal" },
  { id: "negativo", label: "Prompt Negativo" },
  { id: "cinematografico", label: "Prompt Cinematográfico" },
  { id: "video", label: "Prompt para Video" },
  { id: "imagen", label: "Prompt para Imagen" },
];

const subTabs: { id: PromptKey; label: string }[] = [
  { id: "midjourney", label: "Para Midjourney" },
  { id: "flux", label: "Para Flux" },
  { id: "veo", label: "Para Veo" },
  { id: "kling", label: "Para Kling" },
  { id: "whisk", label: "Para Whisk" },
];

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
  const { prompts, status } = usePromptStore();
  const [tab, setTab] = useState<PromptKey>("principal");
  const [sub, setSub] = useState<PromptKey | null>(null);
  const [copied, setCopied] = useState(false);

  const activeKey = sub ?? tab;
  const text = prompts[activeKey];
  const analyzing = status === "analyzing";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* no-op */
    }
  };

  const exportTxt = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeKey}-prompt.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
          <ActionBtn icon={Sparkles} highlight>
            Mejorar Prompt
          </ActionBtn>
          <ActionBtn icon={Globe}>Traducir</ActionBtn>
          <ActionBtn icon={Download} onClick={exportTxt}>
            Exportar TXT
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

      <div className="glass-inset mt-4 p-5 font-mono text-[13.5px] leading-7 relative min-h-[140px]">
        {analyzing ? (
          <div className="space-y-2">
            <div className="h-3 w-11/12 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-3 w-10/12 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-3 w-9/12 rounded bg-white/[0.06] animate-pulse" />
          </div>
        ) : (
          <p className="text-slate-300 whitespace-pre-wrap break-words">{highlight(text)}</p>
        )}
        <div className="absolute bottom-3 right-4 text-[11px] text-slate-500">
          {text.length} / 4000
        </div>
      </div>
    </section>
  );
}

function ActionBtn({
  icon: Icon,
  children,
  highlight,
  onClick,
}: {
  icon: any;
  children: React.ReactNode;
  highlight?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium ring-1 transition-all " +
        (highlight
          ? "text-white bg-white/[0.04] ring-[#7c4dff]/40 hover:bg-white/[0.07]"
          : "text-slate-200 bg-white/[0.03] ring-white/5 hover:bg-white/[0.07]")
      }
    >
      {children}
      <Icon className={"h-3.5 w-3.5 " + (highlight ? "text-[#a78bfa]" : "text-slate-400")} />
    </button>
  );
}

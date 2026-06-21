import { Copy, Sparkles, Globe, Download } from "lucide-react";
import { useState } from "react";

const tabs = [
  "Prompt Principal",
  "Prompt Negativo",
  "Prompt Cinematográfico",
  "Prompt para Video",
  "Prompt para Imagen",
];

const subtabs = ["Para Midjourney", "Para Flux", "Para Veo", "Para Kling", "Para Whisk"];

export function PromptOutput() {
  const [tab, setTab] = useState(tabs[0]);
  return (
    <section className="glass-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-[15px] font-semibold text-white">
          <span className="text-slate-400 mr-1">4.</span> Prompt generado
        </h2>
        <div className="flex flex-wrap gap-2">
          <ActionBtn icon={Copy}>Copiar</ActionBtn>
          <ActionBtn icon={Sparkles} highlight>
            Mejorar Prompt
          </ActionBtn>
          <ActionBtn icon={Globe}>Traducir</ActionBtn>
          <ActionBtn icon={Download}>Exportar TXT</ActionBtn>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                "rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all " +
                (active
                  ? "text-white bg-gradient-to-r from-[#7c4dff] to-[#5b5eff] shadow-[0_8px_24px_-10px_rgba(124,77,255,0.8)]"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]")
              }
            >
              {t}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 px-1">
        {subtabs.map((t) => (
          <button
            key={t}
            className="text-[12px] text-slate-400 hover:text-white transition-colors"
          >
            {t}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="glass-inset mt-4 p-5 font-mono text-[13.5px] leading-7 relative">
        <p className="text-slate-300">
          <span className="text-[#a78bfa]">traditional</span>{" "}
          <span className="text-[#a78bfa]">Japanese</span>{" "}
          <span className="text-[#a78bfa]">temple</span> at{" "}
          <span className="text-[#60a5fa]">night</span>, illuminated by{" "}
          <span className="text-[#fbbf24]">warm lanterns</span>,{" "}
          <span className="text-[#f472b6]">cherry blossom</span> trees in full bloom,{" "}
          <span className="text-[#fbbf24]">full moon</span> in a{" "}
          <span className="text-[#60a5fa]">clear starry sky</span>, reflection in the calm{" "}
          <span className="text-[#22d3ee]">lake water</span>,{" "}
          <span className="text-[#a78bfa]">cinematic lighting</span>, ultra realistic, high detail,
          wide angle, <span className="text-[#22d3ee]">8k</span>{" "}
          <span className="text-[#fbbf24]">--ar 16:9</span>
        </p>
        <div className="absolute bottom-3 right-4 text-[11px] text-slate-500">218 / 4000</div>
      </div>
    </section>
  );
}

function ActionBtn({
  icon: Icon,
  children,
  highlight,
}: {
  icon: any;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <button
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

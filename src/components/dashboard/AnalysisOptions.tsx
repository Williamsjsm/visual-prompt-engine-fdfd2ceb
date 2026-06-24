import { Star, Scale, Lightbulb, AlignLeft, ChevronDown, Sparkles, Loader2 } from "lucide-react";
import { usePromptStore, type AnalysisMode, type AiModel } from "@/lib/prompt-store";

const opts: { id: AnalysisMode; label: string; icon: typeof Star }[] = [
  { id: "max", label: "Detalle Máximo", icon: Star },
  { id: "bal", label: "Equilibrado", icon: Scale },
  { id: "cre", label: "Creativo", icon: Lightbulb },
  { id: "short", label: "Prompt Corto", icon: AlignLeft },
];

const models: { id: AiModel; label: string; dot: string }[] = [
  { id: "gem", label: "Gemini Vision", dot: "bg-sky-400" },
  { id: "gpt", label: "GPT Vision", dot: "bg-emerald-400" },
  { id: "both", label: "Gemini + GPT", dot: "bg-gradient-to-r from-sky-400 to-emerald-400" },
];

export function AnalysisOptions() {
  const { mode, setMode, model, setModel, status, upload, generate } = usePromptStore();
  const analyzing = status === "analyzing";
  const disabled = !upload || analyzing;

  return (
    <section className="glass-panel p-5">
      <h2 className="text-[15px] font-semibold text-white">
        <span className="text-slate-400 mr-1">2.</span> Opciones de análisis
      </h2>
      <p className="mt-0.5 text-[12.5px] text-slate-400">Personaliza cómo quieres generar tu prompt</p>

      <div className="mt-4 grid grid-cols-4 gap-2.5">
        {opts.map((o) => {
          const active = mode === o.id;
          return (
            <button
              key={o.id}
              onClick={() => setMode(o.id)}
              className={
                "flex flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-[11.5px] font-medium transition-all " +
                (active
                  ? "text-white bg-gradient-to-br from-[#7c4dff]/25 to-[#3b82f6]/15 ring-1 ring-[#7c4dff]/60 shadow-[0_10px_30px_-15px_rgba(124,77,255,0.9)]"
                  : "text-slate-300 bg-white/[0.03] ring-1 ring-white/5 hover:bg-white/[0.06]")
              }
            >
              <o.icon className={"h-4 w-4 " + (active ? "text-[#a78bfa]" : "text-slate-400")} />
              {o.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        <div className="text-[12.5px] text-slate-400 mb-2">Modelo IA</div>
        <div className="grid grid-cols-3 gap-2">
          {models.map((m) => {
            const active = model === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setModel(m.id)}
                className={
                  "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-medium transition-all " +
                  (active
                    ? "text-white bg-white/[0.06] ring-1 ring-[#7c4dff]/50"
                    : "text-slate-300 bg-white/[0.03] ring-1 ring-white/5 hover:bg-white/[0.06]")
                }
              >
                <span className={"h-2 w-2 rounded-full " + m.dot} />
                {m.label}
                {active && <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={generate}
        disabled={disabled}
        className={
          "btn-gradient mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[14px] font-semibold transition-opacity " +
          (disabled ? "opacity-60 cursor-not-allowed" : "hover:opacity-95")
        }
      >
        {analyzing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analizando contenido…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generar Prompt
          </>
        )}
      </button>

      {!upload && (
        <p className="mt-2 text-center text-[11.5px] text-slate-500">
          Sube una imagen o video para generar.
        </p>
      )}
    </section>
  );
}

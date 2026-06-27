import {
  Star,
  Scale,
  Lightbulb,
  AlignLeft,
  ChevronDown,
  Sparkles,
  Loader2,
  Film,
  ShieldCheck,
} from "lucide-react";
import {
  usePromptStore,
  type AnalysisMode,
  type AiModel,
  type IdentityLock,
  type SceneAdaptation,
} from "@/lib/prompt-store";

const opts: { id: AnalysisMode; label: string; icon: typeof Star }[] = [
  { id: "max", label: "Detalle Máximo", icon: Star },
  { id: "bal", label: "Equilibrado", icon: Scale },
  { id: "cre", label: "Creativo", icon: Lightbulb },
  { id: "short", label: "Prompt Corto", icon: AlignLeft },
];

const models: { id: AiModel; label: string; dot: string; badge?: string }[] = [
  { id: "gem", label: "Gemini vía Lovable", dot: "bg-sky-400" },
  { id: "gpt", label: "GPT vía Lovable", dot: "bg-emerald-400", badge: "fallback" },
  {
    id: "both",
    label: "Gemini + GPT vía Lovable",
    dot: "bg-gradient-to-r from-sky-400 to-emerald-400",
    badge: "fallback",
  },
];

const sceneOptions: { id: SceneAdaptation; label: string; hint: string }[] = [
  { id: "exact", label: "Exacta", hint: "Muy parecida al video" },
  { id: "similar", label: "Parecida", hint: "Original, mismo ambiente" },
  { id: "style", label: "Solo estilo", hint: "Nueva escena, misma estética" },
  { id: "new", label: "Nueva", hint: "Cambia el escenario" },
];

const identityOptions: { id: IdentityLock; label: string; hint: string }[] = [
  { id: "flex", label: "Flexible", hint: "Permite leves cambios" },
  { id: "strict", label: "Estricta", hint: "Misma persona" },
  { id: "ultra", label: "Ultra", hint: "Máxima continuidad" },
];

export function AnalysisOptions() {
  const {
    mode,
    setMode,
    sceneAdaptation,
    setSceneAdaptation,
    identityLock,
    setIdentityLock,
    model,
    setModel,
    status,
    error,
    upload,
    reference,
    generate,
  } = usePromptStore();
  const analyzing = status === "analyzing";
  const disabled = !upload || analyzing;

  return (
    <section className="glass-panel p-5">
      <h2 className="text-[15px] font-semibold text-white">
        <span className="text-slate-400 mr-1">2.</span> Opciones de análisis
      </h2>
      <p className="mt-0.5 text-[12.5px] text-slate-400">
        Personaliza cómo quieres generar tu prompt con Lovable Gateway
      </p>

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

      <div className="mt-5 space-y-4">
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-[12.5px] text-slate-400">
            <Film className="h-3.5 w-3.5" />
            Adaptación de escena
          </div>
          <div className="grid grid-cols-2 gap-2">
            {sceneOptions.map((option) => {
              const active = sceneAdaptation === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setSceneAdaptation(option.id)}
                  className={
                    "rounded-xl px-3 py-2 text-left transition-all " +
                    (active
                      ? "bg-sky-500/15 text-white ring-1 ring-sky-300/40"
                      : "bg-white/[0.03] text-slate-300 ring-1 ring-white/5 hover:bg-white/[0.06]")
                  }
                >
                  <span className="block text-[12px] font-semibold">{option.label}</span>
                  <span className="mt-0.5 block text-[10.5px] text-slate-500">{option.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[12.5px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Identidad del avatar
            </div>
            {!reference && <span className="text-[10.5px] text-slate-600">sin referencia</span>}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {identityOptions.map((option) => {
              const active = identityLock === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setIdentityLock(option.id)}
                  className={
                    "rounded-xl px-2 py-2 text-center transition-all " +
                    (active
                      ? "bg-emerald-500/15 text-white ring-1 ring-emerald-300/40"
                      : "bg-white/[0.03] text-slate-300 ring-1 ring-white/5 hover:bg-white/[0.06]")
                  }
                >
                  <span className="block text-[11.5px] font-semibold">{option.label}</span>
                  <span className="mt-0.5 block text-[10px] text-slate-500">{option.hint}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-[12.5px] text-slate-400 mb-2">Modelo IA</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {models.map((m) => {
            const active = model === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setModel(m.id)}
                title={m.badge}
                className={
                  "relative flex min-h-[46px] items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-medium transition-all " +
                  (active
                    ? "text-white bg-gradient-to-br from-[#7c4dff]/25 to-[#3b82f6]/15 ring-1 ring-[#7c4dff]/60 shadow-[0_10px_30px_-15px_rgba(124,77,255,0.9)]"
                    : "text-slate-300 bg-white/[0.03] ring-1 ring-white/5 hover:bg-white/[0.06]")
                }
              >
                <span className={"h-2 w-2 rounded-full " + m.dot} />
                <span>{m.label}</span>
                {active && <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                {m.badge && (
                  <span className="absolute -top-2 right-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-semibold text-amber-200 ring-1 ring-amber-300/20">
                    seguro
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-2 rounded-lg bg-sky-500/10 px-3 py-2 text-[11.5px] leading-5 text-sky-100 ring-1 ring-sky-400/15">
          Los modelos pasan por Lovable Gateway. Si GPT llega a cuota o rate limit, el sistema cae
          automáticamente a Gemini y reutiliza resultados cacheados.
        </p>
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

      {error && (
        <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-[12px] leading-5 text-rose-200 ring-1 ring-rose-400/20">
          {error}
        </p>
      )}
    </section>
  );
}

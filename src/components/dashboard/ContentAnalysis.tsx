import {
  User,
  Trees,
  Sun,
  Smile,
  Eye,
  Palette,
  Camera,
  Cloud,
  Shirt,
  Meh,
  Box,
  Activity,
  LayoutGrid,
  Sparkles,
  Gauge,
  Ratio,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePromptStore, type AnalysisFields } from "@/lib/prompt-store";

type Row = { icon: LucideIcon; label: string; value: string; colors?: string[] };

function buildRows(a: AnalysisFields): { left: Row[]; right: Row[] } {
  return {
    left: [
      { icon: User, label: "Sujeto principal", value: a.subject },
      { icon: Trees, label: "Escenario", value: a.setting },
      { icon: Sun, label: "Iluminación", value: a.lighting },
      { icon: Smile, label: "Ambiente", value: a.mood },
      { icon: Eye, label: "Estilo visual", value: a.style },
      { icon: Palette, label: "Colores dominantes", value: "", colors: a.colors },
      { icon: Camera, label: "Cámara", value: a.camera },
      { icon: Cloud, label: "Clima", value: a.weather },
    ],
    right: [
      { icon: Shirt, label: "Vestimenta", value: a.clothing },
      { icon: Meh, label: "Expresión facial", value: a.expression },
      { icon: Box, label: "Objetos", value: a.objects },
      { icon: Activity, label: "Acciones", value: a.actions },
      { icon: LayoutGrid, label: "Composición", value: a.composition },
      { icon: Sparkles, label: "Calidad visual", value: a.quality },
      { icon: Gauge, label: "Nivel de realismo", value: a.realism },
      { icon: Ratio, label: "Formato", value: a.format },
    ],
  };
}

function RowItem({ row, loading }: { row: Row; loading: boolean }) {
  const Icon = row.icon;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/[0.05] last:border-0">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[0.04] ring-1 ring-white/5">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0 text-[12.5px] text-slate-400">{row.label}</div>
      {loading ? (
        <div className="h-3 w-24 rounded bg-white/[0.06] animate-pulse" />
      ) : row.colors ? (
        <div className="flex gap-1.5">
          {row.colors.map((c) => (
            <span
              key={c}
              className="h-4 w-4 rounded-full ring-1 ring-white/20"
              style={{ background: c, boxShadow: `0 0 10px ${c}80` }}
            />
          ))}
        </div>
      ) : (
        <div className="text-[12.5px] text-white text-right truncate max-w-[60%]">{row.value}</div>
      )}
    </div>
  );
}

export function ContentAnalysis() {
  const { analysis, status } = usePromptStore();
  const loading = status === "analyzing";
  const { left, right } = buildRows(analysis);

  return (
    <section className="glass-panel relative p-5 overflow-hidden">
      <div className="absolute -top-1 -right-1 h-24 w-24 rounded-full bg-[radial-gradient(circle_at_center,rgba(124,77,255,0.35),transparent_60%)] pointer-events-none" />
      <div className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-[#a78bfa] shadow-[0_0_18px_4px_rgba(167,139,250,0.7)]" />

      <h2 className="text-[15px] font-semibold text-white mb-3">
        <span className="text-slate-400 mr-1">3.</span> Análisis del contenido
        {loading && <span className="ml-2 text-[12px] text-[#a78bfa]">Analizando…</span>}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <div className="glass-inset px-3.5">
          {left.map((r) => <RowItem key={r.label} row={r} loading={loading} />)}
        </div>
        <div className="glass-inset px-3.5">
          {right.map((r) => <RowItem key={r.label} row={r} loading={loading} />)}
        </div>
      </div>
    </section>
  );
}

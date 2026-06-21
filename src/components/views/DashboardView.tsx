import { motion } from "framer-motion";
import { Sparkles, Image as ImageIcon, Video, History, Star, TrendingUp } from "lucide-react";
import { HistoryStrip } from "@/components/dashboard/HistoryStrip";
import type { SectionKey } from "@/components/layout/Sidebar";

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const stats = [
  { label: "Prompts generados", value: "248", icon: Sparkles, tint: "from-[#7c4dff] to-[#5b5eff]" },
  { label: "Imágenes creadas", value: "112", icon: ImageIcon, tint: "from-[#3b82f6] to-[#00c2ff]" },
  { label: "Videos generados", value: "37", icon: Video, tint: "from-[#ec4899] to-[#7c4dff]" },
  { label: "Favoritos", value: "26", icon: Star, tint: "from-[#f59e0b] to-[#ec4899]" },
];

interface Props {
  onNavigate: (key: SectionKey) => void;
}

export function DashboardView({ onNavigate }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <motion.section
        {...fade}
        transition={{ duration: 0.4 }}
        className="glass-panel relative overflow-hidden p-6"
      >
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[#7c4dff]/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-[#3b82f6]/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] text-slate-300 ring-1 ring-white/10">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              Tu actividad ha crecido un 32% esta semana
            </div>
            <h3 className="mt-3 text-[22px] font-bold text-white">
              Crea tu próximo prompt en segundos
            </h3>
            <p className="mt-1 text-[13px] text-slate-400">
              Sube una imagen o video y deja que la IA genere el prompt perfecto.
            </p>
          </div>
          <button
            onClick={() => onNavigate("generar-prompt")}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5b5eff] via-[#7c4dff] to-[#3b82f6] px-5 py-3 text-[13.5px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(124,77,255,0.9)] ring-1 ring-white/10 hover:brightness-110 transition"
          >
            <Sparkles className="h-4 w-4" />
            Generar Prompt
          </button>
        </div>
      </motion.section>

      <motion.div
        {...fade}
        transition={{ duration: 0.4, delay: 0.06 }}
        className="grid grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {stats.map((s) => (
          <div key={s.label} className="glass-panel p-4">
            <div
              className={
                "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br " +
                s.tint +
                " shadow-[0_8px_22px_-10px_rgba(124,77,255,0.8)]"
              }
            >
              <s.icon className="h-5 w-5 text-white" />
            </div>
            <div className="mt-3 text-[22px] font-bold text-white">{s.value}</div>
            <div className="text-[12px] text-slate-400">{s.label}</div>
          </div>
        ))}
      </motion.div>

      <motion.section
        {...fade}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass-panel p-5"
      >
        <h3 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-white">
          <Sparkles className="h-4 w-4 text-[#7c4dff]" />
          Últimos prompts
        </h3>
        <ul className="divide-y divide-white/5">
          {[
            "Retrato cinematográfico con luz neón violeta",
            "Paisaje épico al amanecer estilo Studio Ghibli",
            "Producto premium sobre fondo de mármol negro",
            "Ciudad cyberpunk lluviosa con reflejos de neón",
          ].map((p) => (
            <li key={p} className="flex items-center justify-between py-2.5">
              <span className="text-[13px] text-slate-200">{p}</span>
              <span className="text-[11px] text-slate-500">hace 2h</span>
            </li>
          ))}
        </ul>
      </motion.section>

      <motion.div {...fade} transition={{ duration: 0.4, delay: 0.16 }}>
        <HistoryStrip />
      </motion.div>
    </div>
  );
}

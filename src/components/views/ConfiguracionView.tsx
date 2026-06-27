import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Cpu,
  Languages,
  FileImage,
  Moon,
  Database,
  CheckCircle2,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { usePromptStore } from "@/lib/prompt-store";

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

export function ConfiguracionView() {
  const { model, setModel, history, favorites, avatars, clearHistory } = usePromptStore();
  const [lang, setLang] = useState("Español");
  const [format, setFormat] = useState("Midjourney");
  const [dark, setDark] = useState(true);
  const storageBytes = useMemo(
    () => new Blob([JSON.stringify({ history, favorites, avatars })]).size,
    [history, favorites, avatars],
  );
  const storageLabel =
    storageBytes > 1024 * 1024
      ? `${(storageBytes / 1024 / 1024).toFixed(1)} MB`
      : `${Math.max(1, Math.round(storageBytes / 1024))} KB`;
  const storagePercent = Math.min(100, Math.round((storageBytes / (4 * 1024 * 1024)) * 100));

  return (
    <motion.section {...fade} transition={{ duration: 0.4 }} className="glass-panel p-6">
      <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white mb-5">
        <Settings className="h-4 w-4 text-[#7c4dff]" />
        Configuración general
      </h3>

      <div className="space-y-4">
        <Row icon={Cpu} label="Modelo de IA" hint="Motor usado para analizar tus archivos.">
          <Select
            value={model}
            onChange={(value) => setModel(value as typeof model)}
            options={[
              { value: "gem", label: "Gemini vía Lovable" },
              { value: "gpt", label: "GPT vía Lovable" },
              { value: "both", label: "Gemini + GPT vía Lovable" },
            ]}
          />
        </Row>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <StatusCard
            icon={CheckCircle2}
            title="Lovable Gateway"
            status="Activo"
            tone="ok"
            text="Motor principal para análisis, traducción y mejora de prompts."
          />
          <StatusCard
            icon={CheckCircle2}
            title="Fallback anti-cuotas"
            status="Activo"
            tone="ok"
            text="Si GPT llega a cuota o rate limit, se reutiliza cache o se cae a Gemini."
          />
        </div>
        <Row icon={Languages} label="Idioma" hint="Idioma de los prompts generados.">
          <Select
            value={lang}
            onChange={setLang}
            options={[
              { value: "Español", label: "Español" },
              { value: "Inglés", label: "Inglés" },
              { value: "Portugués de Brasil", label: "Portugués de Brasil" },
            ]}
          />
        </Row>
        <Row icon={FileImage} label="Formato por defecto" hint="Plataforma objetivo del prompt.">
          <Select
            value={format}
            onChange={setFormat}
            options={[
              { value: "Midjourney", label: "Midjourney" },
              { value: "Flux", label: "Flux" },
              { value: "Veo", label: "Veo" },
              { value: "Kling", label: "Kling" },
              { value: "Whisk", label: "Whisk" },
            ]}
          />
        </Row>
        <Row icon={Moon} label="Modo Oscuro" hint="Apariencia general de la interfaz.">
          <button
            onClick={() => setDark((v) => !v)}
            className={
              "relative h-6 w-11 rounded-full transition-colors " +
              (dark ? "bg-gradient-to-r from-[#5b5eff] to-[#3b82f6]" : "bg-white/10")
            }
          >
            <span
              className={
                "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all " +
                (dark ? "left-[22px]" : "left-0.5")
              }
            />
          </button>
        </Row>
        <Row icon={Database} label="Almacenamiento" hint="Espacio ocupado por tu historial local.">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="h-2 w-40 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#5b5eff] to-[#3b82f6]"
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            <span className="text-[12px] text-slate-400">
              {storagePercent}% · {storageLabel}
            </span>
            <button
              onClick={clearHistory}
              disabled={history.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-2 text-[12px] font-medium text-slate-300 ring-1 ring-white/10 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpiar historial
            </button>
          </div>
        </Row>
      </div>
    </motion.section>
  );
}

function Row({
  icon: Icon,
  label,
  hint,
  children,
}: {
  icon: typeof Settings;
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-inset flex flex-wrap items-center justify-between gap-4 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] ring-1 ring-white/10">
          <Icon className="h-4 w-4 text-[#7c4dff]" />
        </div>
        <div>
          <div className="text-[13.5px] font-medium text-white">{label}</div>
          <div className="text-[11.5px] text-slate-400">{hint}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg bg-white/[0.04] px-3 py-2 text-[13px] text-slate-100 ring-1 ring-white/10 focus:ring-[#7c4dff]/50 outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#0d162b]">
          {o.label}
        </option>
      ))}
    </select>
  );
}

function StatusCard({
  icon: Icon,
  title,
  status,
  text,
  tone,
}: {
  icon: typeof Settings;
  title: string;
  status: string;
  text: string;
  tone: "ok" | "warn";
}) {
  const color =
    tone === "ok"
      ? "text-emerald-300 bg-emerald-400/10 ring-emerald-300/20"
      : "text-amber-200 bg-amber-400/10 ring-amber-300/20";

  return (
    <div className="glass-inset p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13.5px] font-semibold text-white">
          <Icon className={tone === "ok" ? "h-4 w-4 text-emerald-300" : "h-4 w-4 text-amber-200"} />
          {title}
        </div>
        <span className={"rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 " + color}>
          {status}
        </span>
      </div>
      <p className="mt-2 text-[12px] leading-5 text-slate-400">{text}</p>
    </div>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Cpu, Languages, FileImage, Moon, Database } from "lucide-react";

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

export function ConfiguracionView() {
  const [model, setModel] = useState("GPT-4 Vision");
  const [lang, setLang] = useState("Español");
  const [format, setFormat] = useState("Midjourney");
  const [dark, setDark] = useState(true);

  return (
    <motion.section {...fade} transition={{ duration: 0.4 }} className="glass-panel p-6">
      <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white mb-5">
        <Settings className="h-4 w-4 text-[#7c4dff]" />
        Configuración general
      </h3>

      <div className="space-y-4">
        <Row icon={Cpu} label="Modelo de IA" hint="Motor usado para analizar tus archivos.">
          <Select value={model} onChange={setModel} options={["GPT-4 Vision", "Gemini Pro", "Claude 3.5"]} />
        </Row>
        <Row icon={Languages} label="Idioma" hint="Idioma de los prompts generados.">
          <Select value={lang} onChange={setLang} options={["Español", "Inglés", "Portugués", "Francés"]} />
        </Row>
        <Row icon={FileImage} label="Formato por defecto" hint="Plataforma objetivo del prompt.">
          <Select
            value={format}
            onChange={setFormat}
            options={["Midjourney", "Flux", "Veo", "Kling", "Whisk"]}
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
          <div className="flex items-center gap-3">
            <div className="h-2 w-40 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full w-[38%] rounded-full bg-gradient-to-r from-[#5b5eff] to-[#3b82f6]" />
            </div>
            <span className="text-[12px] text-slate-400">38% · 192 MB</span>
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
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg bg-white/[0.04] px-3 py-2 text-[13px] text-slate-100 ring-1 ring-white/10 focus:ring-[#7c4dff]/50 outline-none"
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-[#0d162b]">
          {o}
        </option>
      ))}
    </select>
  );
}

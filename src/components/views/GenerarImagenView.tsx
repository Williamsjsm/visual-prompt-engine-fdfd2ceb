import { useState } from "react";
import { motion } from "framer-motion";
import { Image as ImageIcon, Sparkles, Wand2 } from "lucide-react";

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const models = ["Midjourney", "Flux Pro", "DALL·E 3", "Stable Diffusion", "Ideogram"];
const formats = ["1:1", "16:9", "9:16", "4:5", "3:2"];
const styles = [
  "Cinematográfico",
  "Fotorrealista",
  "Anime",
  "Ilustración",
  "3D Render",
  "Acuarela",
  "Minimalista",
  "Cyberpunk",
];

export function GenerarImagenView() {
  const [model, setModel] = useState(models[0]);
  const [format, setFormat] = useState(formats[1]);
  const [style, setStyle] = useState(styles[0]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-5">
      <motion.section {...fade} transition={{ duration: 0.4 }} className="glass-panel p-5">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white">
          <Wand2 className="h-4 w-4 text-[#7c4dff]" />
          Describe tu imagen
        </h3>
        <textarea
          placeholder="Ej: Retrato cinematográfico de un astronauta caminando entre flores violetas al atardecer, luz dorada, lente 85mm..."
          className="mt-3 w-full h-44 resize-none rounded-xl bg-white/[0.03] p-4 text-[13.5px] text-slate-100 placeholder:text-slate-500 ring-1 ring-white/10 focus:ring-[#7c4dff]/50 outline-none"
        />

        <div className="mt-5 space-y-4">
          <ChipGroup label="Modelo" options={models} value={model} onChange={setModel} />
          <ChipGroup label="Formato" options={formats} value={format} onChange={setFormat} />
          <ChipGroup label="Estilo visual" options={styles} value={style} onChange={setStyle} />
        </div>

        <button className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5b5eff] via-[#7c4dff] to-[#3b82f6] py-3.5 text-[14px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(124,77,255,0.9)] ring-1 ring-white/10 hover:brightness-110 transition">
          <Sparkles className="h-4 w-4" />
          Generar Imagen
        </button>
      </motion.section>

      <motion.section
        {...fade}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass-panel p-5"
      >
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white">
          <ImageIcon className="h-4 w-4 text-[#3b82f6]" />
          Vista previa
        </h3>
        <div className="mt-3 aspect-video rounded-xl bg-gradient-to-br from-[#101a34] to-[#0b1224] ring-1 ring-white/10 flex items-center justify-center">
          <div className="text-center text-slate-500">
            <ImageIcon className="mx-auto h-10 w-10 opacity-50" />
            <p className="mt-2 text-[12.5px]">Tu imagen generada aparecerá aquí</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-white/[0.03] ring-1 ring-white/10"
            />
          ))}
        </div>
      </motion.section>
    </div>
  );
}

function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-[12px] text-slate-400 mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = o === value;
          return (
            <button
              key={o}
              onClick={() => onChange(o)}
              className={
                "px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition " +
                (active
                  ? "bg-gradient-to-r from-[#5b5eff] to-[#3b82f6] text-white ring-1 ring-white/10 shadow-[0_6px_18px_-8px_rgba(91,94,255,0.9)]"
                  : "bg-white/[0.04] text-slate-300 ring-1 ring-white/10 hover:bg-white/[0.08]")
              }
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

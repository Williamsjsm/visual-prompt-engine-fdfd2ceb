import { useState } from "react";
import { motion } from "framer-motion";
import { Video, Sparkles, Upload, Film } from "lucide-react";

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const durations = ["3s", "5s", "8s", "10s", "15s"];
const formats = ["16:9", "9:16", "1:1", "4:5"];
const models = ["Veo 3", "Kling 2.0", "Runway Gen-3", "Pika 1.5", "Luma Dream"];

export function GenerarVideoView() {
  const [duration, setDuration] = useState(durations[1]);
  const [format, setFormat] = useState(formats[0]);
  const [model, setModel] = useState(models[0]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.1fr] gap-5">
      <motion.section {...fade} transition={{ duration: 0.4 }} className="glass-panel p-5">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white">
          <Upload className="h-4 w-4 text-[#7c4dff]" />
          Sube tu imagen o video base
        </h3>
        <div className="mt-3 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c4dff] to-[#3b82f6] shadow-[0_10px_30px_-10px_rgba(124,77,255,0.9)]">
            <Film className="h-5 w-5 text-white" />
          </div>
          <p className="text-[13px] text-slate-300">Arrastra o haz clic para subir</p>
          <p className="text-[11px] text-slate-500">MP4, MOV, JPG, PNG · máx. 100MB</p>
        </div>

        <h3 className="mt-6 flex items-center gap-2 text-[15px] font-semibold text-white">
          <Sparkles className="h-4 w-4 text-[#3b82f6]" />
          Prompt de movimiento
        </h3>
        <textarea
          placeholder="Ej: Cámara orbitando suavemente alrededor del sujeto, luz cinematográfica, partículas flotando..."
          className="mt-3 w-full h-28 resize-none rounded-xl bg-white/[0.03] p-4 text-[13.5px] text-slate-100 placeholder:text-slate-500 ring-1 ring-white/10 focus:ring-[#7c4dff]/50 outline-none"
        />
      </motion.section>

      <motion.section
        {...fade}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="glass-panel p-5 flex flex-col"
      >
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white">
          <Video className="h-4 w-4 text-[#7c4dff]" />
          Configuración
        </h3>

        <div className="mt-4 space-y-4">
          <Chips label="Duración" options={durations} value={duration} onChange={setDuration} />
          <Chips label="Formato" options={formats} value={format} onChange={setFormat} />
          <Chips label="Modelo" options={models} value={model} onChange={setModel} />
        </div>

        <div className="mt-5 aspect-video rounded-xl bg-gradient-to-br from-[#101a34] to-[#0b1224] ring-1 ring-white/10 flex items-center justify-center">
          <div className="text-center text-slate-500">
            <Video className="mx-auto h-10 w-10 opacity-50" />
            <p className="mt-2 text-[12.5px]">Tu video aparecerá aquí</p>
          </div>
        </div>

        <button className="mt-auto pt-5">
          <span className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5b5eff] via-[#7c4dff] to-[#3b82f6] py-3.5 text-[14px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(124,77,255,0.9)] ring-1 ring-white/10 hover:brightness-110 transition">
            <Sparkles className="h-4 w-4" />
            Generar Video
          </span>
        </button>
      </motion.section>
    </div>
  );
}

function Chips({
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

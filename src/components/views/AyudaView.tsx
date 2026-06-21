import { motion } from "framer-motion";
import { HelpCircle, BookOpen, Lightbulb, ChevronDown } from "lucide-react";
import { useState } from "react";

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const faqs = [
  {
    q: "¿Cómo genero mi primer prompt?",
    a: "Ve a la sección 'Generar Prompt', sube una imagen o video y selecciona el modo de análisis. La IA generará el prompt automáticamente.",
  },
  {
    q: "¿Qué modelos de IA están disponibles?",
    a: "Soportamos GPT-4 Vision, Gemini Pro y Claude 3.5 para análisis, y exportación para Midjourney, Flux, Veo, Kling y Whisk.",
  },
  {
    q: "¿Puedo editar los prompts generados?",
    a: "Sí. El editor permite ajustar manualmente el prompt principal, negativo, cinematográfico, de video e imagen antes de copiarlo.",
  },
  {
    q: "¿Dónde se guarda mi historial?",
    a: "Tu historial se guarda localmente en tu dispositivo y puedes verlo o eliminarlo desde la sección 'Historial'.",
  },
];

const tips = [
  "Usa imágenes de alta resolución para análisis más detallados.",
  "Selecciona 'Detalle máximo' cuando necesites máxima fidelidad.",
  "Combina varios estilos visuales para resultados más originales.",
  "Guarda tus prompts favoritos para reutilizarlos rápidamente.",
];

export function AyudaView() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-5">
      <motion.section {...fade} transition={{ duration: 0.4 }} className="glass-panel p-5">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white mb-4">
          <HelpCircle className="h-4 w-4 text-[#7c4dff]" />
          Preguntas frecuentes
        </h3>
        <div className="space-y-2">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="glass-inset overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <span className="text-[13.5px] font-medium text-white">{f.q}</span>
                  <ChevronDown
                    className={
                      "h-4 w-4 text-slate-400 transition-transform " +
                      (isOpen ? "rotate-180" : "")
                    }
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-3 text-[12.5px] text-slate-400">{f.a}</div>
                )}
              </div>
            );
          })}
        </div>
      </motion.section>

      <div className="flex flex-col gap-5">
        <motion.section
          {...fade}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="glass-panel p-5"
        >
          <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white mb-3">
            <BookOpen className="h-4 w-4 text-[#3b82f6]" />
            Guía rápida
          </h3>
          <ol className="space-y-2.5 text-[13px] text-slate-300 list-decimal list-inside">
            <li>Sube tu imagen o video desde la sección "Generar Prompt".</li>
            <li>Elige el modo de análisis y el modelo de IA deseado.</li>
            <li>Revisa el análisis del contenido y el prompt generado.</li>
            <li>Copia el prompt o expórtalo a tu plataforma favorita.</li>
          </ol>
        </motion.section>

        <motion.section
          {...fade}
          transition={{ duration: 0.4, delay: 0.14 }}
          className="glass-panel p-5"
        >
          <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white mb-3">
            <Lightbulb className="h-4 w-4 text-amber-300" />
            Recomendaciones
          </h3>
          <ul className="space-y-2 text-[13px] text-slate-300">
            {tips.map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#7c4dff] to-[#3b82f6]" />
                {t}
              </li>
            ))}
          </ul>
        </motion.section>
      </div>
    </div>
  );
}

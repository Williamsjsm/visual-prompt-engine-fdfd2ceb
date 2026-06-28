import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Copy, Trash2, Check, Pencil } from "lucide-react";
import { usePromptStore, type HistoryItem } from "@/lib/prompt-store";
import { ModelBadge } from "@/components/dashboard/ModelBadge";

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

export function FavoritosView() {
  const { favorites, removeFavorite, loadHistoryItem } = usePromptStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = async (item: HistoryItem) => {
    try {
      await navigator.clipboard.writeText(item.prompts.principal);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {
      /* no-op */
    }
  };

  return (
    <motion.section {...fade} transition={{ duration: 0.4 }} className="glass-panel p-5">
      <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white mb-4">
        <Star className="h-4 w-4 text-amber-300" />
        Prompts favoritos
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {favorites.map((item) => (
          <div key={item.id} className="glass-inset p-4">
            <div className="flex items-start gap-3">
              <img
                src={item.img}
                alt=""
                className="h-20 w-20 rounded-lg object-cover ring-1 ring-white/10"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="text-[13.5px] font-semibold text-white truncate">
                      {item.title}
                    </div>
                    <ModelBadge model={item.model} />
                  </div>
                  <Star className="h-4 w-4 text-amber-300 fill-amber-300" />
                </div>
                <p className="mt-1 text-[12px] text-slate-400 line-clamp-3">
                  {item.prompts.principal}
                </p>
                <div className="mt-2 flex items-center gap-3 text-slate-400">
                  <button
                    onClick={() => copy(item)}
                    className="inline-flex items-center gap-1.5 text-[11.5px] hover:text-white"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" /> Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copiar
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => loadHistoryItem(item)}
                    className="inline-flex items-center gap-1.5 text-[11.5px] hover:text-white"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Cargar
                  </button>
                  <button
                    onClick={() => removeFavorite(item.id)}
                    className="inline-flex items-center gap-1.5 text-[11.5px] hover:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {favorites.length === 0 && (
          <div className="col-span-full rounded-xl bg-white/[0.03] ring-1 ring-white/10 p-8 text-center">
            <Star className="mx-auto h-7 w-7 text-slate-600" />
            <div className="mt-3 text-[13.5px] font-medium text-white">
              Todavía no guardaste favoritos.
            </div>
            <p className="mt-1 text-[12.5px] text-slate-500">
              Marca con estrella los prompts buenos desde Historial o Historial reciente.
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
}

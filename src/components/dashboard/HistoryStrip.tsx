import { History, Copy, Pencil, Files, Trash2, Check, Star } from "lucide-react";
import { useState } from "react";
import templeImg from "@/assets/temple.jpg";
import castleImg from "@/assets/castle.jpg";
import mountainImg from "@/assets/mountain.jpg";
import cyberpunkImg from "@/assets/cyberpunk.jpg";
import { usePromptStore, type HistoryItem } from "@/lib/prompt-store";
import { ModelBadge } from "@/components/dashboard/ModelBadge";

const seed: HistoryItem[] = [
  {
    id: "s1",
    title: "Templo japonés de noche",
    date: "Hoy, 10:45 AM",
    createdAt: Date.now() - 1000 * 60 * 30,
    type: "Imagen",
    img: templeImg,
    model: "both",
    score: 96,
    analysis: {} as never,
    prompts: { principal: "traditional Japanese temple at night" } as never,
  },
  {
    id: "s2",
    title: "Castillo medieval",
    date: "Hoy, 09:32 AM",
    createdAt: Date.now() - 1000 * 60 * 90,
    type: "Imagen",
    img: castleImg,
    model: "gem",
    score: 92,
    analysis: {} as never,
    prompts: { principal: "medieval castle on a cliff at sunset" } as never,
  },
  {
    id: "s3",
    title: "Amanecer en la montaña",
    date: "Ayer, 08:15 PM",
    createdAt: Date.now() - 1000 * 60 * 60 * 16,
    type: "Imagen",
    img: mountainImg,
    model: "gpt",
    score: 89,
    analysis: {} as never,
    prompts: { principal: "snowy mountains at sunrise" } as never,
  },
  {
    id: "s4",
    title: "Ciudad futurista cyberpunk",
    date: "Ayer, 06:42 PM",
    createdAt: Date.now() - 1000 * 60 * 60 * 18,
    type: "Imagen",
    img: cyberpunkImg,
    model: "gpt",
    score: 87,
    analysis: {} as never,
    prompts: { principal: "futuristic cyberpunk city, neon lights" } as never,
  },
];

export function HistoryStrip() {
  const { history, toggleFavorite, isFavorite, removeHistoryItem, loadHistoryItem } =
    usePromptStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const items = [...history, ...seed].slice(0, 4);

  const copy = async (it: HistoryItem) => {
    try {
      await navigator.clipboard.writeText(it.prompts.principal);
      setCopiedId(it.id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {
      /* no-op */
    }
  };

  return (
    <section className="glass-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-white">
          <History className="h-4 w-4 text-slate-400" />
          Historial reciente
        </h2>
        <button className="text-[12px] text-slate-400 hover:text-white transition-colors">
          Ver todo el historial
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {items.map((it) => (
          <div
            key={it.id}
            className="glass-inset flex items-center gap-3 p-2.5 hover:bg-white/[0.04] transition-colors"
          >
            <img
              src={it.img}
              alt={it.title}
              loading="lazy"
              className="h-14 w-14 rounded-lg object-cover ring-1 ring-white/10"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <div className="truncate text-[12.5px] font-medium text-white">{it.title}</div>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <ModelBadge model={it.model} />
                <div className="text-[11px] text-slate-400 truncate">{it.date}</div>
              </div>
              <div className="mt-1.5 flex items-center gap-2.5 text-slate-500">
                {copiedId === it.id ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy
                    className="h-3.5 w-3.5 hover:text-white cursor-pointer"
                    onClick={() => copy(it)}
                  />
                )}
                <Pencil
                  className="h-3.5 w-3.5 hover:text-white cursor-pointer"
                  onClick={() => loadHistoryItem(it)}
                />
                <Files className="h-3.5 w-3.5 hover:text-white cursor-pointer" />
                <Star
                  className={
                    isFavorite(it.id)
                      ? "h-3.5 w-3.5 text-amber-300 fill-amber-300 cursor-pointer"
                      : "h-3.5 w-3.5 hover:text-amber-300 cursor-pointer"
                  }
                  onClick={() => toggleFavorite(it)}
                />
                <Trash2
                  className="h-3.5 w-3.5 text-rose-400/80 hover:text-rose-300 cursor-pointer"
                  onClick={() => removeHistoryItem(it.id)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

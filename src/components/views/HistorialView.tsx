import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Copy, Pencil, Trash2, Filter, GitCompare, Star, Check } from "lucide-react";
import templeImg from "@/assets/temple.jpg";
import castleImg from "@/assets/castle.jpg";
import mountainImg from "@/assets/mountain.jpg";
import cyberpunkImg from "@/assets/cyberpunk.jpg";
import { usePromptStore, type HistoryItem, type AiModel } from "@/lib/prompt-store";
import { ModelBadge } from "@/components/dashboard/ModelBadge";
import { CompareDialog } from "@/components/dashboard/CompareDialog";

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const seed: HistoryItem[] = [
  {
    id: "h1",
    title: "Templo japonés de noche",
    type: "Imagen",
    date: "Hoy, 10:45",
    createdAt: Date.now() - 1000 * 60 * 30,
    img: templeImg,
    model: "both",
    score: 96,
    analysis: { subject: "Templo japonés", setting: "Jardín nocturno" } as never,
    prompts: { principal: "traditional Japanese temple at night" } as never,
  },
  {
    id: "h2",
    title: "Castillo medieval",
    type: "Imagen",
    date: "Hoy, 09:32",
    createdAt: Date.now() - 1000 * 60 * 90,
    img: castleImg,
    model: "gem",
    score: 92,
    analysis: { subject: "Castillo", setting: "Acantilado al atardecer" } as never,
    prompts: { principal: "medieval castle on a cliff at sunset" } as never,
  },
  {
    id: "h3",
    title: "Amanecer en la montaña",
    type: "Video",
    date: "Ayer, 20:15",
    createdAt: Date.now() - 1000 * 60 * 60 * 16,
    img: mountainImg,
    model: "gpt",
    score: 88,
    analysis: { subject: "Montaña nevada", setting: "Amanecer" } as never,
    prompts: { principal: "snowy mountains at sunrise" } as never,
  },
  {
    id: "h4",
    title: "Ciudad cyberpunk",
    type: "Imagen",
    date: "Ayer, 18:42",
    createdAt: Date.now() - 1000 * 60 * 60 * 18,
    img: cyberpunkImg,
    model: "gpt",
    score: 87,
    analysis: { subject: "Ciudad futurista", setting: "Calle con neones" } as never,
    prompts: { principal: "futuristic cyberpunk city, neon lights" } as never,
  },
];

const filters = ["Todos", "Prompt", "Imagen", "Video"];
const modelFilters: { key: "all" | AiModel; label: string }[] = [
  { key: "all", label: "Todos los modelos" },
  { key: "gem", label: "Gemini" },
  { key: "gpt", label: "GPT" },
  { key: "both", label: "Gemini + GPT" },
];

export function HistorialView() {
  const { history, toggleFavorite, isFavorite, removeHistoryItem, loadHistoryItem, clearHistory } =
    usePromptStore();
  const [filter, setFilter] = useState("Todos");
  const [modelFilter, setModelFilter] = useState<"all" | AiModel>("all");
  const [q, setQ] = useState("");
  const [compareOpen, setCompareOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const all = useMemo<HistoryItem[]>(() => [...history, ...seed], [history]);

  const items = useMemo(
    () =>
      all.filter(
        (i) =>
          (filter === "Todos" || i.type === filter) &&
          (modelFilter === "all" || i.model === modelFilter) &&
          i.title.toLowerCase().includes(q.toLowerCase()),
      ),
    [all, filter, modelFilter, q],
  );

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
    <motion.section {...fade} transition={{ duration: 0.4 }} className="glass-panel p-5">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar en tu historial..."
            className="w-full rounded-xl bg-white/[0.03] pl-9 pr-3 py-2.5 text-[13px] text-slate-100 placeholder:text-slate-500 ring-1 ring-white/10 focus:ring-[#7c4dff]/50 outline-none"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="h-4 w-4 text-slate-500 mr-1" />
          {filters.map((f) => {
            const active = f === filter;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={
                  "px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition " +
                  (active
                    ? "bg-gradient-to-r from-[#5b5eff] to-[#3b82f6] text-white ring-1 ring-white/10"
                    : "bg-white/[0.04] text-slate-300 ring-1 ring-white/10 hover:bg-white/[0.08]")
                }
              >
                {f}
              </button>
            );
          })}
          <button
            onClick={() => setCompareOpen(true)}
            className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold text-white bg-gradient-to-r from-[#7c4dff] to-[#3b82f6] ring-1 ring-white/10 shadow-[0_10px_30px_-15px_rgba(124,77,255,0.9)] hover:brightness-110 transition"
          >
            <GitCompare className="h-3.5 w-3.5" />
            Comparar modelos
          </button>
          <button
            onClick={clearHistory}
            disabled={history.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium text-slate-300 bg-white/[0.04] ring-1 ring-white/10 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Limpiar
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
        {modelFilters.map((m) => {
          const active = m.key === modelFilter;
          return (
            <button
              key={m.key}
              onClick={() => setModelFilter(m.key)}
              className={
                "px-2.5 py-1 rounded-md text-[11.5px] font-medium transition ring-1 " +
                (active
                  ? "bg-white/10 text-white ring-white/20"
                  : "bg-white/[0.02] text-slate-400 ring-white/10 hover:text-white")
              }
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {items.map((it) => (
          <div key={it.id} className="glass-inset p-3 flex gap-3">
            <img
              src={it.img}
              alt=""
              className="h-16 w-16 rounded-lg object-cover ring-1 ring-white/10"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <div className="text-[13px] font-medium text-white truncate">{it.title}</div>
                <ModelBadge model={it.model} />
              </div>
              <div className="text-[11px] text-slate-500">
                {it.type} · {it.date} ·{" "}
                <span className="text-emerald-300/90">Fidelidad {it.score}%</span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-slate-400">
                <button
                  onClick={() => copy(it)}
                  className="hover:text-white"
                  aria-label="Copiar prompt"
                >
                  {copiedId === it.id ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  onClick={() => loadHistoryItem(it)}
                  className="hover:text-white"
                  aria-label="Cargar prompt"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => toggleFavorite(it)}
                  className={isFavorite(it.id) ? "text-amber-300" : "hover:text-amber-300"}
                  aria-label={isFavorite(it.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
                >
                  <Star className={isFavorite(it.id) ? "h-3.5 w-3.5 fill-amber-300" : "h-3.5 w-3.5"} />
                </button>
                <button
                  onClick={() => removeHistoryItem(it.id)}
                  className="text-rose-400/80 hover:text-rose-300"
                  aria-label="Eliminar del historial"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full text-center text-slate-500 text-[13px] py-10">
            No hay resultados para tu búsqueda.
          </div>
        )}
      </div>

      <CompareDialog open={compareOpen} onOpenChange={setCompareOpen} />
    </motion.section>
  );
}

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Copy, Pencil, Trash2, Filter } from "lucide-react";
import templeImg from "@/assets/temple.jpg";
import castleImg from "@/assets/castle.jpg";
import mountainImg from "@/assets/mountain.jpg";
import cyberpunkImg from "@/assets/cyberpunk.jpg";

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const all = [
  { title: "Templo japonés de noche", type: "Imagen", date: "Hoy, 10:45", img: templeImg },
  { title: "Castillo medieval", type: "Imagen", date: "Hoy, 09:32", img: castleImg },
  { title: "Amanecer en la montaña", type: "Video", date: "Ayer, 20:15", img: mountainImg },
  { title: "Ciudad cyberpunk", type: "Imagen", date: "Ayer, 18:42", img: cyberpunkImg },
  { title: "Retrato cinematográfico neón", type: "Prompt", date: "12 Jun", img: cyberpunkImg },
  { title: "Paisaje épico al amanecer", type: "Prompt", date: "10 Jun", img: mountainImg },
];

const filters = ["Todos", "Prompt", "Imagen", "Video"];

export function HistorialView() {
  const [filter, setFilter] = useState("Todos");
  const [q, setQ] = useState("");

  const items = useMemo(
    () =>
      all.filter(
        (i) =>
          (filter === "Todos" || i.type === filter) &&
          i.title.toLowerCase().includes(q.toLowerCase()),
      ),
    [filter, q],
  );

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
        <div className="flex items-center gap-1.5">
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
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {items.map((it) => (
          <div key={it.title} className="glass-inset p-3 flex gap-3">
            <img
              src={it.img}
              alt=""
              className="h-16 w-16 rounded-lg object-cover ring-1 ring-white/10"
            />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-white truncate">{it.title}</div>
              <div className="text-[11px] text-slate-500">
                {it.type} · {it.date}
              </div>
              <div className="mt-2 flex items-center gap-3 text-slate-400">
                <Copy className="h-3.5 w-3.5 hover:text-white cursor-pointer" />
                <Pencil className="h-3.5 w-3.5 hover:text-white cursor-pointer" />
                <Trash2 className="h-3.5 w-3.5 text-rose-400/80 hover:text-rose-300 cursor-pointer" />
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
    </motion.section>
  );
}

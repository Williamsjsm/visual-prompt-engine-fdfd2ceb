import { History, Copy, Pencil, Files, Trash2 } from "lucide-react";
import templeImg from "@/assets/temple.jpg";
import castleImg from "@/assets/castle.jpg";
import mountainImg from "@/assets/mountain.jpg";
import cyberpunkImg from "@/assets/cyberpunk.jpg";

const items = [
  { title: "Templo japonés de noche", date: "Hoy, 10:45 AM", img: templeImg },
  { title: "Castillo medieval", date: "Hoy, 09:32 AM", img: castleImg },
  { title: "Amanecer en la montaña", date: "Ayer, 08:15 PM", img: mountainImg },
  { title: "Ciudad futurista cyberpunk", date: "Ayer, 06:42 PM", img: cyberpunkImg },
];

export function HistoryStrip() {
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
            key={it.title}
            className="glass-inset flex items-center gap-3 p-2.5 hover:bg-white/[0.04] transition-colors"
          >
            <img
              src={it.img}
              alt={it.title}
              loading="lazy"
              className="h-14 w-14 rounded-lg object-cover ring-1 ring-white/10"
            />
            <div className="flex-1 min-w-0">
              <div className="truncate text-[12.5px] font-medium text-white">{it.title}</div>
              <div className="text-[11px] text-slate-400">{it.date}</div>
              <div className="mt-1.5 flex items-center gap-2.5 text-slate-500">
                <Copy className="h-3.5 w-3.5 hover:text-white cursor-pointer" />
                <Pencil className="h-3.5 w-3.5 hover:text-white cursor-pointer" />
                <Files className="h-3.5 w-3.5 hover:text-white cursor-pointer" />
                <Trash2 className="h-3.5 w-3.5 text-rose-400/80 hover:text-rose-300 cursor-pointer" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

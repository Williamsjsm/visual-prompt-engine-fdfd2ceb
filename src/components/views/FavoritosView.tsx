import { motion } from "framer-motion";
import { Star, Copy, Trash2 } from "lucide-react";
import templeImg from "@/assets/temple.jpg";
import castleImg from "@/assets/castle.jpg";
import mountainImg from "@/assets/mountain.jpg";
import cyberpunkImg from "@/assets/cyberpunk.jpg";

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const favs = [
  {
    title: "Templo japonés de noche",
    prompt: "Cinematic shot of a traditional Japanese temple at night, glowing lanterns...",
    img: templeImg,
  },
  {
    title: "Castillo medieval épico",
    prompt: "Epic medieval castle on a cliff, golden hour, volumetric light, ultra detailed...",
    img: castleImg,
  },
  {
    title: "Amanecer en la montaña",
    prompt: "Misty mountain sunrise, soft pastel sky, drone shot, hyperrealistic...",
    img: mountainImg,
  },
  {
    title: "Ciudad cyberpunk lluviosa",
    prompt: "Rainy cyberpunk city street, neon reflections, blade runner aesthetic...",
    img: cyberpunkImg,
  },
];

export function FavoritosView() {
  return (
    <motion.section {...fade} transition={{ duration: 0.4 }} className="glass-panel p-5">
      <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white mb-4">
        <Star className="h-4 w-4 text-amber-300" />
        Prompts favoritos
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {favs.map((f) => (
          <div key={f.title} className="glass-inset p-4">
            <div className="flex items-start gap-3">
              <img
                src={f.img}
                alt=""
                className="h-20 w-20 rounded-lg object-cover ring-1 ring-white/10"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-[13.5px] font-semibold text-white truncate">{f.title}</div>
                  <Star className="h-4 w-4 text-amber-300 fill-amber-300" />
                </div>
                <p className="mt-1 text-[12px] text-slate-400 line-clamp-3">{f.prompt}</p>
                <div className="mt-2 flex items-center gap-3 text-slate-400">
                  <button className="inline-flex items-center gap-1.5 text-[11.5px] hover:text-white">
                    <Copy className="h-3.5 w-3.5" /> Copiar
                  </button>
                  <button className="inline-flex items-center gap-1.5 text-[11.5px] hover:text-rose-300">
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

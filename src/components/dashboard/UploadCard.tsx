import { UploadCloud, Trash2 } from "lucide-react";
import templeImg from "@/assets/temple.jpg";

const formats = ["JPG", "PNG", "WEBP", "MP4", "MOV"];

export function UploadCard() {
  return (
    <section className="glass-panel p-5">
      <h2 className="text-[15px] font-semibold text-white mb-4">
        <span className="text-slate-400 mr-1">1.</span> Subir imagen o video
      </h2>

      <div className="glass-inset relative flex flex-col items-center justify-center px-6 py-8 border-dashed">
        <div className="absolute inset-0 rounded-2xl border border-dashed border-white/10 pointer-events-none" />
        <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#7c4dff]/20 to-[#3b82f6]/20 ring-1 ring-white/10">
          <UploadCloud className="h-7 w-7 text-[#a78bfa]" />
        </div>
        <div className="text-[14.5px] font-medium text-white">Arrastra tu imagen o video</div>
        <div className="text-[12px] text-slate-400 mt-1">o haz clic para seleccionar</div>
        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {formats.map((f) => (
            <span
              key={f}
              className="rounded-md bg-white/[0.04] px-2 py-1 text-[10.5px] font-medium text-slate-300 ring-1 ring-white/5"
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-2xl ring-1 ring-white/10">
        <img
          src={templeImg}
          alt="Templo japonés"
          width={896}
          height={512}
          className="h-[210px] w-full object-cover"
        />
        <div className="absolute top-3 left-3 rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium text-white ring-1 ring-white/10 backdrop-blur-sm">
          ⊕ Imagen JPG
        </div>
        <button className="absolute top-3 right-3 grid h-7 w-7 place-items-center rounded-md bg-black/55 text-rose-400 ring-1 ring-white/10 backdrop-blur-sm hover:text-rose-300">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}

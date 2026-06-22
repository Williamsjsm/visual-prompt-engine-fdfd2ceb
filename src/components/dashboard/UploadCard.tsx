import { UploadCloud, Trash2 } from "lucide-react";
import { useRef } from "react";
import { usePromptStore } from "@/lib/prompt-store";

const formats = ["JPG", "PNG", "WEBP", "MP4", "MOV"];

export function UploadCard() {
  const { upload, setUpload, clearUpload } = usePromptStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = () => inputRef.current?.click();

  const onFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const kind: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";
    setUpload({ url, name: file.name, mime: file.type, kind });
  };

  return (
    <section className="glass-panel p-5">
      <h2 className="text-[15px] font-semibold text-white mb-4">
        <span className="text-slate-400 mr-1">1.</span> Subir imagen o video
      </h2>

      <div
        role="button"
        tabIndex={0}
        onClick={onPick}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFiles(e.dataTransfer.files);
        }}
        className="glass-inset relative flex flex-col items-center justify-center px-6 py-8 border-dashed cursor-pointer"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
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

      {upload && (
        <div className="relative mt-4 overflow-hidden rounded-2xl ring-1 ring-white/10">
          {upload.kind === "video" ? (
            <video
              src={upload.url}
              className="h-[210px] w-full object-cover"
              muted
              playsInline
              loop
              autoPlay
            />
          ) : (
            <img
              src={upload.url}
              alt={upload.name}
              className="h-[210px] w-full object-cover"
            />
          )}
          <div className="absolute top-3 left-3 rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium text-white ring-1 ring-white/10 backdrop-blur-sm">
            ⊕ {upload.kind === "video" ? "Video" : "Imagen"}{" "}
            {upload.mime.split("/")[1]?.toUpperCase() || ""}
          </div>
          <button
            onClick={clearUpload}
            aria-label="Quitar archivo"
            className="absolute top-3 right-3 grid h-7 w-7 place-items-center rounded-md bg-black/55 text-rose-400 ring-1 ring-white/10 backdrop-blur-sm hover:text-rose-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </section>
  );
}

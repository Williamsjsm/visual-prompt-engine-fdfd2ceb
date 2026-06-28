import {
  FileText,
  ImagePlus,
  Loader2,
  Mic2,
  Save,
  UploadCloud,
  Trash2,
  UserRound,
} from "lucide-react";
import { useRef } from "react";
import { usePromptStore } from "@/lib/prompt-store";

const formats = ["JPG", "PNG", "WEBP", "MP4", "MOV"];
const MAX_INLINE_TRANSCRIPT_BYTES = 14 * 1024 * 1024;

export function UploadCard() {
  const {
    upload,
    setUpload,
    clearUpload,
    dialogueText,
    setDialogueText,
    clearDialogueText,
    dialogueStatus,
    dialogueError,
    extractDialogue,
    reference,
    setReference,
    clearReference,
    avatars,
    activeAvatarId,
    selectAvatar,
    saveReferenceAsAvatar,
  } = usePromptStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const onPick = () => inputRef.current?.click();
  const onPickReference = () => referenceInputRef.current?.click();

  const onFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const kind: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";
    if (kind === "video") {
      const [frameDataUrls, dataUrl] = await Promise.all([
        extractVideoFrames(url),
        file.size <= MAX_INLINE_TRANSCRIPT_BYTES
          ? imageFileToDataUrl(file)
          : Promise.resolve(undefined),
      ]);
      setUpload({ url, name: file.name, mime: file.type, kind, frameDataUrls, dataUrl, size: file.size });
      return;
    }
    const dataUrl = await imageFileToDataUrl(file);
    setUpload({ url, name: file.name, mime: file.type, kind, dataUrl, size: file.size });
  };

  const onReferenceFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const dataUrl = await imageFileToDataUrl(file);
    setReference({ url, name: file.name, mime: file.type, dataUrl });
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
        <div className="relative mt-4 overflow-hidden rounded-2xl bg-black/40 ring-1 ring-white/10">
          {upload.kind === "video" ? (
            <video
              src={upload.url}
              className="upload-preview-media h-[210px] w-full object-contain"
              muted
              playsInline
              loop
              autoPlay
            />
          ) : (
            <img
              src={upload.url}
              alt={upload.name}
              className="upload-preview-media h-[210px] w-full object-contain"
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

      {(upload?.kind === "video" || dialogueText) && (
        <div className="mt-4 rounded-2xl bg-white/[0.025] p-3 ring-1 ring-white/5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-500/10 ring-1 ring-violet-300/15">
                <FileText className="h-4 w-4 text-violet-200" />
              </div>
              <div className="min-w-0">
                <div className="text-[12.5px] font-semibold text-white">Diálogo del video</div>
                <div className="truncate text-[11px] text-slate-400">
                  Pega o edita la voz/texto para exportarlo con el pack.
                </div>
              </div>
            </div>
            {dialogueText && (
              <button
                onClick={clearDialogueText}
                aria-label="Limpiar diálogo"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/[0.04] text-rose-300 ring-1 ring-white/10 hover:bg-white/[0.08]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <button
              onClick={extractDialogue}
              disabled={!upload?.dataUrl || dialogueStatus === "extracting"}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-400/10 px-3 py-2 text-[12px] font-medium text-violet-100 ring-1 ring-violet-300/20 hover:bg-violet-400/15 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {dialogueStatus === "extracting" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Mic2 className="h-3.5 w-3.5" />
              )}
              {dialogueStatus === "extracting" ? "Extrayendo..." : "Extraer diálogo"}
            </button>
            {!upload?.dataUrl && (
              <span className="text-[11px] text-amber-200/80">
                Video grande: usa el campo manual.
              </span>
            )}
          </div>
          <textarea
            value={dialogueText}
            onChange={(event) => setDialogueText(event.target.value)}
            rows={4}
            placeholder="Ej: Hola, hoy vamos a ver cómo transformar esta idea..."
            className="w-full resize-none rounded-xl bg-black/20 px-3 py-2.5 text-[12.5px] leading-5 text-slate-100 placeholder:text-slate-600 ring-1 ring-white/10 outline-none focus:ring-violet-300/40"
          />
          {dialogueError && (
            <p className="mt-2 rounded-lg bg-amber-400/10 px-3 py-2 text-[11.5px] leading-4 text-amber-100 ring-1 ring-amber-300/15">
              {dialogueError}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-white/[0.025] p-3 ring-1 ring-white/5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sky-500/10 ring-1 ring-sky-300/15">
              <UserRound className="h-4 w-4 text-sky-200" />
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold text-white">Avatar / referencia</div>
              <div className="truncate text-[11px] text-slate-400">
                Bloquea identidad, rasgos y detalles.
              </div>
            </div>
          </div>
          {reference && (
            <button
              onClick={clearReference}
              aria-label="Quitar avatar de referencia"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/[0.04] text-rose-300 ring-1 ring-white/10 hover:bg-white/[0.08]"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <input
          ref={referenceInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onReferenceFiles(e.target.files)}
        />

        {reference ? (
          <div className="space-y-2">
            <button
              onClick={onPickReference}
              className="flex w-full items-center gap-3 rounded-xl bg-black/20 p-2 text-left ring-1 ring-white/10 hover:bg-white/[0.04]"
            >
              <img
                src={reference.url}
                alt={reference.name}
                className="h-14 w-14 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
              />
              <div className="min-w-0">
                <div className="truncate text-[12px] font-medium text-white">
                  {reference.profileName || reference.name}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  {reference.avatarId
                    ? "Avatar guardado activo."
                    : "Referencia temporal para esta generación."}
                </div>
              </div>
            </button>
            {!reference.avatarId && (
              <button
                onClick={() => saveReferenceAsAvatar()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-400/10 px-3 py-2 text-[12px] font-medium text-emerald-200 ring-1 ring-emerald-300/15 hover:bg-emerald-400/15"
              >
                <Save className="h-3.5 w-3.5" />
                Guardar en biblioteca
              </button>
            )}
            {reference.notes && (
              <p className="line-clamp-2 rounded-lg bg-white/[0.03] px-3 py-2 text-[11px] leading-4 text-slate-400 ring-1 ring-white/5">
                {reference.notes}
              </p>
            )}
          </div>
        ) : (
          <button
            onClick={onPickReference}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-black/10 px-3 py-3 text-[12px] font-medium text-slate-300 hover:bg-white/[0.04]"
          >
            <ImagePlus className="h-4 w-4 text-sky-200" />
            Adjuntar imagen de avatar
          </button>
        )}

        {avatars.length > 0 && (
          <div className="mt-3">
            <div className="mb-2 text-[11px] font-medium text-slate-500">Biblioteca rápida</div>
            <div className="grid grid-cols-2 gap-2">
              {avatars.slice(0, 4).map((avatar) => {
                const active = activeAvatarId === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    onClick={() => selectAvatar(avatar.id)}
                    className={
                      "flex items-center gap-2 rounded-lg p-1.5 text-left ring-1 transition " +
                      (active
                        ? "bg-sky-400/10 ring-sky-300/35"
                        : "bg-white/[0.025] ring-white/5 hover:bg-white/[0.05]")
                    }
                  >
                    <img
                      src={avatar.imageUrl}
                      alt={avatar.name}
                      className="h-8 w-8 shrink-0 rounded-md object-cover ring-1 ring-white/10"
                    />
                    <span className="min-w-0 truncate text-[11.5px] font-medium text-slate-200">
                      {avatar.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function imageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function extractVideoFrames(url: string): Promise<string[]> {
  const video = document.createElement("video");
  video.src = url;
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("No se pudo leer el video"));
  });

  const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
  const times = [0.05, 0.33, 0.66, 0.92].map((p) =>
    Math.max(0, Math.min(duration - 0.05, duration * p)),
  );
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];

  const frames: string[] = [];
  for (const time of times) {
    video.currentTime = time;
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
    });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    frames.push(canvas.toDataURL("image/jpeg", 0.82));
  }
  return frames;
}

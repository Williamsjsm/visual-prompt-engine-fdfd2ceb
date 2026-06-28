import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, ImagePlus, Save, Trash2, UserRound } from "lucide-react";
import { usePromptStore, type AvatarProfile } from "@/lib/prompt-store";

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const DEFAULT_NOTES =
  "Preservar rostro, rasgos faciales, proporciones, tono de piel, cabello, complexión, estilo, accesorios y detalles distintivos. No rediseñar ni embellecer.";

export function AvataresView() {
  const { avatars, addAvatar, activeAvatarId, selectAvatar, removeAvatar, updateAvatar } =
    usePromptStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState(DEFAULT_NOTES);
  const [filePreview, setFilePreview] = useState<{
    dataUrl: string;
    fileName: string;
    mime: string;
  } | null>(null);

  const onFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const dataUrl = await imageFileToDataUrl(file);
    setFilePreview({ dataUrl, fileName: file.name, mime: file.type });
    if (!name.trim()) setName(file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
  };

  const save = () => {
    if (!filePreview) return;
    addAvatar({
      name: name.trim() || filePreview.fileName.replace(/\.[^.]+$/, ""),
      fileName: filePreview.fileName,
      mime: filePreview.mime,
      imageUrl: filePreview.dataUrl,
      notes: notes.trim() || DEFAULT_NOTES,
    });
    setName("");
    setNotes(DEFAULT_NOTES);
    setFilePreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <motion.section {...fade} transition={{ duration: 0.4 }} className="space-y-5">
      <div className="glass-panel p-5">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white">
          <UserRound className="h-4 w-4 text-sky-200" />
          Nueva identidad
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
          <button
            onClick={() => inputRef.current?.click()}
            className="flex min-h-[220px] flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/10 bg-black/20 text-center ring-1 ring-white/5 hover:bg-white/[0.04]"
          >
            {filePreview ? (
              <img
                src={filePreview.dataUrl}
                alt={filePreview.fileName}
                className="h-full max-h-[260px] w-full object-contain"
              />
            ) : (
              <>
                <ImagePlus className="h-8 w-8 text-sky-200" />
                <span className="mt-3 text-[13px] font-medium text-slate-200">
                  Subir referencia
                </span>
                <span className="mt-1 text-[11.5px] text-slate-500">JPG, PNG o WEBP</span>
              </>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => onFile(event.target.files)}
          />

          <div className="space-y-3">
            <label className="block">
              <span className="text-[12px] font-medium text-slate-400">Nombre del avatar</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej: Karen Brasil"
                className="mt-1 w-full rounded-xl bg-white/[0.04] px-3 py-2.5 text-[13px] text-slate-100 placeholder:text-slate-600 ring-1 ring-white/10 outline-none focus:ring-sky-300/40"
              />
            </label>
            <label className="block">
              <span className="text-[12px] font-medium text-slate-400">
                Notas fijas de identidad
              </span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={5}
                className="mt-1 w-full resize-none rounded-xl bg-white/[0.04] px-3 py-2.5 text-[13px] leading-5 text-slate-100 placeholder:text-slate-600 ring-1 ring-white/10 outline-none focus:ring-sky-300/40"
              />
            </label>
            <button
              onClick={save}
              disabled={!filePreview}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-400/10 px-4 py-2.5 text-[13px] font-semibold text-emerald-200 ring-1 ring-emerald-300/20 hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save className="h-4 w-4" />
              Guardar avatar
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel p-5">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white">
          <UserRound className="h-4 w-4 text-[#a78bfa]" />
          Biblioteca
        </h3>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {avatars.map((avatar) => (
            <AvatarCard
              key={avatar.id}
              avatar={avatar}
              active={avatar.id === activeAvatarId}
              onSelect={() => selectAvatar(avatar.id)}
              onDelete={() => removeAvatar(avatar.id)}
              onSave={(patch) => updateAvatar(avatar.id, patch)}
            />
          ))}

          {avatars.length === 0 && (
            <div className="col-span-full rounded-xl bg-white/[0.03] p-8 text-center ring-1 ring-white/10">
              <UserRound className="mx-auto h-8 w-8 text-slate-600" />
              <div className="mt-3 text-[13.5px] font-medium text-white">
                Todavía no tienes avatares guardados.
              </div>
              <p className="mt-1 text-[12.5px] text-slate-500">
                Sube una referencia y guárdala para reutilizarla en todos tus prompts.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

function AvatarCard({
  avatar,
  active,
  onSelect,
  onDelete,
  onSave,
}: {
  avatar: AvatarProfile;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onSave: (patch: Partial<Pick<AvatarProfile, "name" | "notes">>) => void;
}) {
  const [name, setName] = useState(avatar.name);
  const [notes, setNotes] = useState(avatar.notes);
  const [saved, setSaved] = useState(false);

  const save = () => {
    onSave({ name: name.trim() || avatar.name, notes: notes.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  return (
    <div className={"glass-inset p-4 " + (active ? "ring-1 ring-sky-300/40" : "")}>
      <div className="flex items-start gap-3">
        <img
          src={avatar.imageUrl}
          alt={avatar.name}
          className="h-20 w-20 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
        />
        <div className="min-w-0 flex-1">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-lg bg-white/[0.04] px-2 py-1.5 text-[13px] font-semibold text-white ring-1 ring-white/10 outline-none focus:ring-sky-300/40"
          />
          <div className="mt-1 text-[11px] text-slate-500">
            {active ? "Activo para generar" : "Disponible"}
          </div>
          <button
            onClick={onSelect}
            className={
              "mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium ring-1 " +
              (active
                ? "bg-sky-400/10 text-sky-100 ring-sky-300/20"
                : "bg-white/[0.04] text-slate-300 ring-white/10 hover:text-white")
            }
          >
            <Check className="h-3.5 w-3.5" />
            {active ? "Seleccionado" : "Usar avatar"}
          </button>
        </div>
      </div>

      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={4}
        className="mt-3 w-full resize-none rounded-xl bg-black/20 px-3 py-2 text-[12px] leading-5 text-slate-300 ring-1 ring-white/10 outline-none focus:ring-sky-300/40"
      />

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          onClick={save}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-[11.5px] font-medium text-slate-300 ring-1 ring-white/10 hover:text-white"
        >
          <Save className="h-3.5 w-3.5" />
          {saved ? "Guardado" : "Guardar cambios"}
        </button>
        <button
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-[11.5px] font-medium text-rose-200 ring-1 ring-rose-300/15 hover:bg-rose-500/15"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Eliminar
        </button>
      </div>
    </div>
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

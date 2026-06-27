import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Copy,
  Download,
  Image as ImageIcon,
  RefreshCw,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";
import { usePromptStore } from "@/lib/prompt-store";

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const models = ["Nano Banana web", "Flow", "Midjourney", "Flux Pro", "Ideogram"];
const formats = ["9:16", "4:5", "1:1", "16:9"];
const styles = ["Fotorrealista", "Cinematográfico", "Documental", "Editorial"];

export function GenerarImagenView() {
  const { prompts, upload, reference } = usePromptStore();
  const [model, setModel] = useState(models[0]);
  const [format, setFormat] = useState(formats[0]);
  const [style, setStyle] = useState(styles[0]);
  const sourcePrompt = prompts.imagenBase || prompts.imagen;
  const [draft, setDraft] = useState(sourcePrompt);
  const [copied, setCopied] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedImageName, setGeneratedImageName] = useState("");

  useEffect(() => {
    setDraft(sourcePrompt);
  }, [sourcePrompt]);

  const outputPrompt = useMemo(
    () => buildOutputPrompt(draft, model, format, style),
    [draft, model, format, style],
  );

  const copy = async () => {
    await copyTextToClipboard(outputPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const exportTxt = () => {
    const blob = new Blob([outputPrompt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "imagen-base-flow.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const a = document.createElement("a");
    a.href = generatedImage;
    a.download = `imagen-base-flow.${imageExtension(generatedImage)}`;
    a.click();
  };

  const onGeneratedImagePicked = async (file: File | undefined) => {
    if (!file) return;
    const dataUrl = await readAsDataUrl(file);
    setGeneratedImage(dataUrl);
    setGeneratedImageName(file.name);
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <motion.section {...fade} transition={{ duration: 0.4 }} className="glass-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white">
            <Wand2 className="h-4 w-4 text-[#7c4dff]" />
            Imagen base Flow
          </h3>
          <button
            onClick={() => setDraft(sourcePrompt)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.03] px-3 py-1.5 text-[12px] font-medium text-slate-300 ring-1 ring-white/10 transition hover:bg-white/[0.07] hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </button>
        </div>

        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="mt-3 h-[360px] w-full resize-none rounded-xl bg-white/[0.03] p-4 font-mono text-[13px] leading-6 text-slate-100 placeholder:text-slate-500 outline-none ring-1 ring-white/10 focus:ring-[#7c4dff]/50"
        />

        <div className="mt-5 space-y-4">
          <ChipGroup label="Destino" options={models} value={model} onChange={setModel} />
          <ChipGroup label="Formato" options={formats} value={format} onChange={setFormat} />
          <ChipGroup label="Estilo" options={styles} value={style} onChange={setStyle} />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={copy}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5b5eff] via-[#7c4dff] to-[#3b82f6] px-4 py-3.5 text-[14px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(124,77,255,0.9)] ring-1 ring-white/10 transition hover:brightness-110"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado" : "Copiar para generar"}
          </button>
          <button
            onClick={() => imageInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.04] px-4 py-3.5 text-[13px] font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Upload className="h-4 w-4" />
            Subir imagen base
          </button>
          <button
            onClick={exportTxt}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.04] px-4 py-3.5 text-[13px] font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Download className="h-4 w-4" />
            TXT
          </button>
        </div>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void onGeneratedImagePicked(event.target.files?.[0])}
        />
      </motion.section>

      <motion.section
        {...fade}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass-panel p-5"
      >
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white">
          <ImageIcon className="h-4 w-4 text-[#3b82f6]" />
          Imagen base
        </h3>

        <div className="mt-3 overflow-hidden rounded-xl bg-[#071123] ring-1 ring-white/10">
          <div className="flex aspect-[9/16] max-h-[520px] items-center justify-center bg-white/[0.02]">
            {generatedImage ? (
              <img
                src={generatedImage}
                alt="Imagen base generada"
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="text-center text-slate-600">
                <ImageIcon className="mx-auto h-10 w-10 opacity-60" />
                <p className="mt-2 text-[12px]">Sube aquí la imagen generada externamente</p>
              </div>
            )}
          </div>
        </div>

        {generatedImage && (
          <div className="mt-3 flex flex-wrap gap-2">
            <div className="min-w-0 flex-1 rounded-xl bg-white/[0.03] px-3 py-2 text-[12px] text-slate-400 ring-1 ring-white/10">
              <span className="block truncate">{generatedImageName || "imagen-base-flow"}</span>
            </div>
            <button
              onClick={downloadImage}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.04] px-4 py-2.5 text-[13px] font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-white/[0.08] hover:text-white"
            >
              <Download className="h-4 w-4" />
              Descargar
            </button>
          </div>
        )}

        <div className="mt-4 grid gap-3">
          <PreviewTile title="Avatar" src={reference?.url} kind="image" />
          <PreviewTile title="Escena" src={upload?.url} kind={upload?.kind} />
        </div>

        <div className="mt-4 rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/10">
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
            <Sparkles className="h-3.5 w-3.5" />
            Prompt final
          </div>
          <p className="mt-3 max-h-[320px] overflow-auto whitespace-pre-wrap font-mono text-[12.5px] leading-6 text-slate-300">
            {outputPrompt}
          </p>
        </div>
      </motion.section>
    </div>
  );
}

function PreviewTile({
  title,
  src,
  kind,
}: {
  title: string;
  src?: string;
  kind?: "image" | "video";
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-[#071123] ring-1 ring-white/10">
      <div className="border-b border-white/10 px-3 py-2 text-[12px] font-medium text-slate-300">
        {title}
      </div>
      <div className="flex aspect-video items-center justify-center bg-white/[0.02]">
        {src ? (
          kind === "video" ? (
            <video src={src} className="h-full w-full object-contain" controls muted />
          ) : (
            <img src={src} alt={title} className="h-full w-full object-contain" />
          )
        ) : (
          <div className="text-center text-slate-600">
            <ImageIcon className="mx-auto h-9 w-9 opacity-60" />
            <p className="mt-2 text-[12px]">Sin referencia</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-[12px] text-slate-400">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option === value;
          return (
            <button
              key={option}
              onClick={() => onChange(option)}
              className={
                "rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition " +
                (active
                  ? "bg-gradient-to-r from-[#5b5eff] to-[#3b82f6] text-white shadow-[0_6px_18px_-8px_rgba(91,94,255,0.9)] ring-1 ring-white/10"
                  : "bg-white/[0.04] text-slate-300 ring-1 ring-white/10 hover:bg-white/[0.08]")
              }
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function buildOutputPrompt(prompt: string, model: string, format: string, style: string): string {
  return [
    prompt.trim(),
    "",
    "IMAGE SETTINGS:",
    `Target: ${model}`,
    `Format: ${format}`,
    `Style: ${style}`,
  ].join("\n");
}

function imageExtension(dataUrl: string): "jpg" | "png" | "webp" {
  if (dataUrl.startsWith("data:image/png")) return "png";
  if (dataUrl.startsWith("data:image/webp")) return "webp";
  return "jpg";
}

async function copyTextToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (!copied) throw new Error("No se pudo copiar al portapapeles");
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
}

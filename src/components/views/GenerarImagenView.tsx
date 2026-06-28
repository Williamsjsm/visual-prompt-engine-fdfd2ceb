import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  CircleAlert,
  Copy,
  Download,
  Image as ImageIcon,
  RefreshCw,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";
import { generateImageWithAi, type ImageAiEngine } from "@/lib/ai/generate-image.functions";
import { usePromptStore } from "@/lib/prompt-store";

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

type EngineId = ImageAiEngine | "external";

const aiEngines: { value: EngineId; label: string; hint: string }[] = [
  { value: "gemini", label: "Gemini / Nano Banana", hint: "Usa Lovable Gateway" },
  { value: "openai", label: "ChatGPT Image", hint: "Usa Lovable Gateway" },
  { value: "external", label: "Modo asistido", hint: "Copia el prompt para otra web" },
];
const targets = ["Flow", "Whisk", "Midjourney", "Flux Pro", "Ideogram"];
const formats = ["9:16", "4:5", "1:1", "16:9"];
const styles = ["Fotorrealista", "Cinematográfico", "Documental", "Editorial"];

export function GenerarImagenView() {
  const { prompts, upload, reference } = usePromptStore();
  const [engine, setEngine] = useState<EngineId>("gemini");
  const [target, setTarget] = useState(targets[0]);
  const [format, setFormat] = useState(formats[0]);
  const [style, setStyle] = useState(styles[0]);
  const sourcePrompt = prompts.imagenBase || prompts.imagen;
  const [draft, setDraft] = useState(sourcePrompt);
  const [copied, setCopied] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationNotice, setGenerationNotice] = useState("");
  const [generationError, setGenerationError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [editImage, setEditImage] = useState<string | null>(null);
  const [editImageName, setEditImageName] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedImageName, setGeneratedImageName] = useState("");
  const sceneReference =
    upload?.kind === "image" ? upload.dataUrl : upload?.frameDataUrls?.[0] || undefined;

  useEffect(() => {
    setDraft(sourcePrompt);
  }, [sourcePrompt]);

  const outputPrompt = useMemo(
    () => buildOutputPrompt(draft, target, format, style),
    [draft, target, format, style],
  );

  const copy = async () => {
    await copyTextToClipboard(outputPrompt);
    setCopied(true);
    setGenerated(false);
    setGenerationError("");
    setTimeout(() => setCopied(false), 1400);
  };

  const generateImage = async () => {
    setGenerationNotice("");
    setGenerationError("");
    setCopied(false);

    if (engine === "external") {
      await copyTextToClipboard(outputPrompt);
      setGenerated(true);
      setGenerationNotice(`Prompt listo para usar en ${target}.`);
      setTimeout(() => setGenerated(false), 1600);
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateImageWithAi({
        data: {
          engine,
          prompt: outputPrompt,
          format,
          style,
          target,
          editImageDataUrl: editImage ?? undefined,
          referenceImageDataUrl: reference?.dataUrl,
          sceneImageDataUrl: sceneReference,
        },
      });
      setGeneratedImage(result.imageDataUrl);
      setGeneratedImageName(
        `imagen-${result.source}-${Date.now()}.${imageExtension(result.imageDataUrl)}`,
      );
      setGenerated(true);
      setGenerationNotice(
        result.mode === "edit"
          ? `Imagen modificada con ${engineLabel(result.source)}.`
          : `Imagen generada con ${engineLabel(result.source)}.`,
      );
      setTimeout(() => setGenerated(false), 1600);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo generar la imagen.";
      setGenerationError(message);
      setGenerationNotice(
        "No se pudo generar desde la API. El prompt sigue listo para copiar o usar en modo asistido.",
      );
    } finally {
      setIsGenerating(false);
    }
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
    a.download = generatedImageName || `imagen-generada.${imageExtension(generatedImage)}`;
    a.click();
  };

  const onEditImagePicked = async (file: File | undefined) => {
    if (!file) return;
    const dataUrl = await readAsDataUrl(file);
    setEditImage(dataUrl);
    setEditImageName(file.name);
    setGenerationError("");
    setGenerationNotice("Imagen lista para modificar con el prompt actual.");
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <motion.section {...fade} transition={{ duration: 0.4 }} className="glass-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white">
            <Wand2 className="h-4 w-4 text-[#7c4dff]" />
            Crear o modificar imagen
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
          <EngineGroup value={engine} onChange={setEngine} />
          <ChipGroup label="Destino" options={targets} value={target} onChange={setTarget} />
          <ChipGroup label="Formato" options={formats} value={format} onChange={setFormat} />
          <ChipGroup label="Estilo" options={styles} value={style} onChange={setStyle} />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={generateImage}
            disabled={isGenerating}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5b5eff] via-[#7c4dff] to-[#3b82f6] px-4 py-3.5 text-[14px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(124,77,255,0.9)] ring-1 ring-white/10 transition hover:brightness-110"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : generated ? (
              <Check className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isGenerating
              ? "Generando..."
              : generated
                ? "Listo"
                : engine === "external"
                  ? "Preparar prompt"
                  : editImage || reference || sceneReference
                    ? "Crear / modificar imagen"
                    : "Generar imagen"}
          </button>
          <button
            onClick={copy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.04] px-4 py-3.5 text-[13px] font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-white/[0.08] hover:text-white"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado" : "Copiar prompt"}
          </button>
          <button
            onClick={() => imageInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.04] px-4 py-3.5 text-[13px] font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Upload className="h-4 w-4" />
            Subir imagen a editar
          </button>
          <button
            onClick={exportTxt}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.04] px-4 py-3.5 text-[13px] font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Download className="h-4 w-4" />
            TXT
          </button>
        </div>
        {generationNotice && (
          <div className="mt-3 rounded-xl bg-emerald-400/10 px-3 py-2 text-[12px] font-medium text-emerald-200 ring-1 ring-emerald-300/20">
            {generationNotice}
          </div>
        )}
        {generationError && (
          <div className="mt-3 flex gap-2 rounded-xl bg-amber-400/10 px-3 py-2 text-[12px] leading-5 text-amber-100 ring-1 ring-amber-300/20">
            <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{generationError}</span>
          </div>
        )}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void onEditImagePicked(event.target.files?.[0])}
        />
      </motion.section>

      <motion.section
        {...fade}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass-panel p-5"
      >
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white">
          <ImageIcon className="h-4 w-4 text-[#3b82f6]" />
          Resultado
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
                <p className="mt-2 text-[12px]">La imagen generada aparecerá aquí</p>
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
          <PreviewTile title="Imagen a editar" src={editImage} kind="image" note={editImageName} />
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
  note,
}: {
  title: string;
  src?: string;
  kind?: "image" | "video";
  note?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-[#071123] ring-1 ring-white/10">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2 text-[12px] font-medium text-slate-300">
        <span>{title}</span>
        {note && <span className="min-w-0 truncate text-[11px] text-slate-500">{note}</span>}
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

function EngineGroup({ value, onChange }: { value: EngineId; onChange: (v: EngineId) => void }) {
  return (
    <div>
      <div className="mb-2 text-[12px] text-slate-400">Motor IA</div>
      <div className="grid gap-2 md:grid-cols-3">
        {aiEngines.map((engine) => {
          const active = engine.value === value;
          return (
            <button
              key={engine.value}
              onClick={() => onChange(engine.value)}
              className={
                "rounded-xl px-3 py-2 text-left transition ring-1 " +
                (active
                  ? "bg-gradient-to-r from-[#5b5eff]/85 to-[#3b82f6]/80 text-white shadow-[0_8px_22px_-12px_rgba(91,94,255,0.9)] ring-white/10"
                  : "bg-white/[0.04] text-slate-300 ring-white/10 hover:bg-white/[0.08]")
              }
            >
              <span className="block text-[12.5px] font-semibold">{engine.label}</span>
              <span
                className={
                  active
                    ? "mt-1 block text-[11px] text-blue-100"
                    : "mt-1 block text-[11px] text-slate-500"
                }
              >
                {engine.hint}
              </span>
            </button>
          );
        })}
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
    normalizeResolutionTo4K(prompt.trim()),
    "",
    "IMAGE SETTINGS:",
    `Target: ${model}`,
    `Format: ${format}`,
    `Style: ${style}`,
  ].join("\n");
}

function engineLabel(engine: ImageAiEngine): string {
  return engine === "gemini" ? "Gemini / Nano Banana" : "ChatGPT Image";
}

function normalizeResolutionTo4K(value: string): string {
  return value.replace(/\b8k\b/gi, "4k");
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

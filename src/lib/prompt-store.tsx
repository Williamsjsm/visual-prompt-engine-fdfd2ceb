import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import templeImg from "@/assets/temple.jpg";
import {
  analyzeCombined,
  analyzeWithGemini,
  analyzeWithOpenAI,
} from "@/lib/ai/prompt-analyzer";

export type AnalysisMode = "max" | "bal" | "cre" | "short";
export type AiModel = "gpt" | "gem" | "both";

export type AnalysisFields = {
  subject: string;
  setting: string;
  lighting: string;
  mood: string;
  style: string;
  colors: string[];
  camera: string;
  weather: string;
  clothing: string;
  expression: string;
  objects: string;
  actions: string;
  composition: string;
  quality: string;
  realism: string;
  format: string;
};

export type PromptKey =
  | "principal"
  | "negativo"
  | "cinematografico"
  | "video"
  | "imagen"
  | "midjourney"
  | "flux"
  | "veo"
  | "kling"
  | "whisk";

export type Prompts = Record<PromptKey, string>;

export type HistoryItem = {
  id: string;
  title: string;
  date: string;
  createdAt: number;
  type: "Imagen" | "Video" | "Prompt";
  img: string;
  model: AiModel;
  score: number;
  analysis: AnalysisFields;
  prompts: Prompts;
};

export const MODEL_LABEL: Record<AiModel, string> = {
  gpt: "GPT vía Lovable",
  gem: "Gemini vía Lovable",
  both: "Gemini + GPT vía Lovable",
};

export type UploadInfo = {
  url: string;
  name: string;
  mime: string;
  kind: "image" | "video";
} | null;

export type Status = "idle" | "analyzing" | "ready";

type Ctx = {
  upload: UploadInfo;
  setUpload: (u: UploadInfo) => void;
  clearUpload: () => void;
  mode: AnalysisMode;
  setMode: (m: AnalysisMode) => void;
  model: AiModel;
  setModel: (m: AiModel) => void;
  status: Status;
  analysis: AnalysisFields;
  prompts: Prompts;
  history: HistoryItem[];
  generate: () => Promise<void>;
};

const PromptCtx = createContext<Ctx | null>(null);

// ---------- Defaults (keep current visuals identical on first paint) ----------
const DEFAULT_ANALYSIS: AnalysisFields = {
  subject: "Templo japonés tradicional",
  setting: "Jardín con lago y cerezos en flor",
  lighting: "Luz de luna, linternas cálidas",
  mood: "Nocturno, tranquilo, místico",
  style: "Cinemático, ultra realista",
  colors: ["#22d3ee", "#3b82f6", "#ec4899", "#f97316"],
  camera: "Gran angular, vista panorámica",
  weather: "Noche despejada",
  clothing: "Tradicional japonesa",
  expression: "No aplica",
  objects: "Linternas, puente, lago",
  actions: "Sin movimiento",
  composition: "Simétrica, reflejos perfectos",
  quality: "Alta definición, 8K",
  realism: "Ultra realista",
  format: "16:9 Horizontal",
};

const DEFAULT_PROMPTS: Prompts = {
  principal:
    "traditional Japanese temple at night, illuminated by warm lanterns, cherry blossom trees in full bloom, full moon in a clear starry sky, reflection in the calm lake water, cinematic lighting, ultra realistic, high detail, wide angle, 8k --ar 16:9",
  negativo:
    "blurry, low quality, distorted, deformed, watermark, text, logo, oversaturated, bad anatomy, extra limbs, jpeg artifacts, low resolution",
  cinematografico:
    "cinematic wide shot of a traditional Japanese temple at night, anamorphic lens, shallow depth of field, volumetric moonlight, soft fog rolling across the lake, golden lantern bokeh, color graded teal & orange, 35mm film grain, ultra detailed, 8k",
  video:
    "slow cinematic dolly-in towards a Japanese temple at night, gentle wind moving the cherry blossom petals, subtle ripples on the lake, glowing lanterns flickering, 24fps, cinematic motion, 5 second shot",
  imagen:
    "ultra detailed photo of a traditional Japanese temple at night, soft moonlight, warm lantern glow, cherry blossom trees, mirror-like lake reflection, photorealistic, sharp focus, 8k",
  midjourney:
    "traditional Japanese temple at night, warm lanterns, cherry blossoms, full moon, lake reflection, cinematic lighting, ultra realistic, 8k --ar 16:9 --style raw --v 6",
  flux:
    "A traditional Japanese temple at night, illuminated by warm lanterns, surrounded by cherry blossom trees, full moon, perfect reflection on a calm lake, cinematic, ultra-realistic, hyper-detailed, 8K",
  veo: "Cinematic 5s shot, slow dolly-in on a Japanese temple at night, lanterns glowing, cherry petals drifting, lake ripples, moonlight, photorealistic, 24fps",
  kling:
    "Realistic cinematic video, Japanese temple at night, soft camera push-in, falling cherry blossoms, lake reflection shimmering, warm lantern light, 5 seconds",
  whisk:
    "Subject: traditional Japanese temple. Scene: night garden with cherry blossoms and lake. Style: cinematic, ultra realistic, warm lanterns, full moon.",
};

// Mock presets, pickPreset and buildPromptsFromBase live in
// `src/lib/ai/mock-presets.ts` so both the analyzer service and any
// future server-side fallback share a single source of truth.


function shortTitle(name: string) {
  const stem = name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
  return stem.length > 40 ? stem.slice(0, 40) + "…" : stem || "Prompt generado";
}

function nowLabel() {
  const d = new Date();
  return `Hoy, ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

// ---------- Provider ----------
export function PromptProvider({ children }: { children: ReactNode }) {
  const [upload, setUploadState] = useState<UploadInfo>({
    url: templeImg,
    name: "templo-japones.jpg",
    mime: "image/jpeg",
    kind: "image",
  });
  const [mode, setMode] = useState<AnalysisMode>("max");
  const [model, setModel] = useState<AiModel>("gpt");
  const [status, setStatus] = useState<Status>("ready");
  const [analysis, setAnalysis] = useState<AnalysisFields>(DEFAULT_ANALYSIS);
  const [prompts, setPrompts] = useState<Prompts>(DEFAULT_PROMPTS);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const setUpload = useCallback((u: UploadInfo) => {
    setUploadState(u);
  }, []);

  const clearUpload = useCallback(() => {
    setUploadState((prev) => {
      if (prev && prev.url.startsWith("blob:")) URL.revokeObjectURL(prev.url);
      return null;
    });
  }, []);

  const generate = useCallback(async () => {
    if (!upload) {
      // soft validation; UI surfaces this via button state
      return;
    }
    setStatus("analyzing");

    const analyzer =
      model === "gem"
        ? analyzeWithGemini
        : model === "both"
          ? analyzeCombined
          : analyzeWithOpenAI;

    const result = await analyzer(upload, { mode });

    setAnalysis(result.analysis);
    setPrompts(result.prompts);
    setStatus("ready");

    const principalLen = result.prompts.principal?.length ?? 0;
    const baseScore =
      model === "both" ? 96 : model === "gem" ? 91 : 88;
    const score = Math.min(
      99,
      Math.max(70, baseScore + Math.round((principalLen % 60) / 12) - 2),
    );

    const item: HistoryItem = {
      id: crypto.randomUUID(),
      title: shortTitle(upload.name),
      date: nowLabel(),
      createdAt: Date.now(),
      type: upload.kind === "video" ? "Video" : "Imagen",
      img: upload.url,
      model,
      score,
      analysis: result.analysis,
      prompts: result.prompts,
    };
    setHistory((h) => [item, ...h].slice(0, 24));
  }, [upload, mode, model]);

  const value = useMemo<Ctx>(
    () => ({
      upload,
      setUpload,
      clearUpload,
      mode,
      setMode,
      model,
      setModel,
      status,
      analysis,
      prompts,
      history,
      generate,
    }),
    [upload, setUpload, clearUpload, mode, model, status, analysis, prompts, history, generate],
  );

  return <PromptCtx.Provider value={value}>{children}</PromptCtx.Provider>;
}

export function usePromptStore() {
  const ctx = useContext(PromptCtx);
  if (!ctx) throw new Error("usePromptStore must be used within PromptProvider");
  return ctx;
}

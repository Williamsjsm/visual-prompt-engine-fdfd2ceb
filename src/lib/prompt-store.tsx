import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import templeImg from "@/assets/temple.jpg";

export type AnalysisMode = "max" | "bal" | "cre" | "short";
export type AiModel = "gpt" | "gem" | "cla";

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
  type: "Imagen" | "Video" | "Prompt";
  img: string;
  analysis: AnalysisFields;
  prompts: Prompts;
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

// ---------- Mock presets keyed by filename hints ----------
type Preset = { analysis: AnalysisFields; base: string };

const PRESETS: Record<string, Preset> = {
  castle: {
    analysis: {
      subject: "Castillo medieval imponente",
      setting: "Acantilado sobre el mar al atardecer",
      lighting: "Luz dorada del crepúsculo",
      mood: "Épico, misterioso, majestuoso",
      style: "Fantasía cinemática, ultra detallado",
      colors: ["#f59e0b", "#b45309", "#1e293b", "#64748b"],
      camera: "Plano general aéreo, drone",
      weather: "Nubes dramáticas",
      clothing: "No aplica",
      expression: "No aplica",
      objects: "Torres, banderas, murallas",
      actions: "Banderas ondeando",
      composition: "Regla de tercios, horizonte bajo",
      quality: "Alta definición, 8K",
      realism: "Foto realista",
      format: "21:9 Cinemascope",
    },
    base: "imposing medieval castle on a sea cliff at golden hour, dramatic clouds, banners waving, epic cinematic lighting",
  },
  mountain: {
    analysis: {
      subject: "Cordillera nevada al amanecer",
      setting: "Valle alpino con lago glacial",
      lighting: "Primera luz cálida, niebla baja",
      mood: "Sereno, vasto, contemplativo",
      style: "Paisajismo épico, hiperrealista",
      colors: ["#fef3c7", "#fb923c", "#1e3a8a", "#0ea5e9"],
      camera: "Telefoto comprimido, trípode",
      weather: "Despejado, viento ligero",
      clothing: "No aplica",
      expression: "No aplica",
      objects: "Pinos, lago, rocas",
      actions: "Niebla deslizándose",
      composition: "Capas en profundidad, horizonte alto",
      quality: "8K HDR",
      realism: "Foto realista",
      format: "16:9 Horizontal",
    },
    base: "snowy mountain range at sunrise, alpine valley with glacial lake, warm first light, low fog, hyper-realistic landscape",
  },
  cyberpunk: {
    analysis: {
      subject: "Ciudad cyberpunk futurista",
      setting: "Calle lluviosa con rascacielos y neones",
      lighting: "Neón rosa y cian, reflejos húmedos",
      mood: "Futurista, distópico, vibrante",
      style: "Cyberpunk cinemático, Blade Runner",
      colors: ["#ec4899", "#22d3ee", "#a855f7", "#0f172a"],
      camera: "Lente anamórfico, ángulo bajo",
      weather: "Lluvia intensa",
      clothing: "Abrigos largos futuristas",
      expression: "Anónima, capucha",
      objects: "Letreros holográficos, autos voladores",
      actions: "Multitud caminando bajo la lluvia",
      composition: "Punto de fuga central",
      quality: "8K, ray tracing",
      realism: "Foto realista estilizado",
      format: "21:9 Cinemascope",
    },
    base: "futuristic cyberpunk city, rainy neon street, pink and cyan signs, wet reflections, anamorphic low angle, Blade Runner mood",
  },
  portrait: {
    analysis: {
      subject: "Retrato de persona joven",
      setting: "Estudio con fondo neutro",
      lighting: "Luz suave de ventana",
      mood: "Íntimo, sereno",
      style: "Fotografía editorial",
      colors: ["#f5f5f4", "#a8a29e", "#292524", "#facc15"],
      camera: "85mm f/1.4, plano medio",
      weather: "Interior",
      clothing: "Casual moderna",
      expression: "Mirada directa, leve sonrisa",
      objects: "Ninguno",
      actions: "Pose estática",
      composition: "Centrada, fondo desenfocado",
      quality: "Alta definición",
      realism: "Foto realista",
      format: "4:5 Vertical",
    },
    base: "editorial portrait of a young person, soft window light, 85mm f/1.4, intimate mood, neutral background",
  },
};

function pickPreset(name: string): Preset {
  const n = name.toLowerCase();
  if (n.includes("castle") || n.includes("castillo")) return PRESETS.castle;
  if (n.includes("mount") || n.includes("monta")) return PRESETS.mountain;
  if (n.includes("cyber") || n.includes("neon") || n.includes("city"))
    return PRESETS.cyberpunk;
  if (n.includes("portrait") || n.includes("retrato") || n.includes("face"))
    return PRESETS.portrait;
  return { analysis: DEFAULT_ANALYSIS, base: DEFAULT_PROMPTS.principal };
}

function buildPrompts(base: string, mode: AnalysisMode, kind: "image" | "video"): Prompts {
  const len =
    mode === "max" ? ", hyper detailed, 8k, masterpiece"
    : mode === "cre" ? ", surreal, artistic, dreamlike"
    : mode === "short" ? "" : ", high quality";

  const principal = `${base}${len}, cinematic lighting, ultra realistic --ar 16:9`;
  return {
    principal,
    negativo:
      "blurry, low quality, distorted, deformed, watermark, text, logo, oversaturated, bad anatomy, extra limbs, jpeg artifacts, low resolution",
    cinematografico: `cinematic shot, ${base}, anamorphic lens, shallow depth of field, volumetric light, color graded teal & orange, 35mm film grain, ultra detailed, 8k`,
    video: `slow cinematic dolly-in, ${base}, subtle motion, 24fps, ${kind === "video" ? "5 second clip" : "cinematic motion"}`,
    imagen: `ultra detailed photo, ${base}, photorealistic, sharp focus, 8k`,
    midjourney: `${base}${len} --ar 16:9 --style raw --v 6`,
    flux: `${base.charAt(0).toUpperCase() + base.slice(1)}${len}, hyper-detailed, 8K`,
    veo: `Cinematic 5s shot, ${base}, photorealistic, 24fps`,
    kling: `Realistic cinematic video, ${base}, smooth camera motion, 5 seconds`,
    whisk: `Subject and scene: ${base}. Style: cinematic, ultra realistic.`,
  };
}

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
    // Simulate AI latency. Swap this for a real Gemini/GPT Vision call.
    await new Promise((r) => setTimeout(r, 1200));

    const preset = pickPreset(upload.name);
    const built = buildPrompts(preset.base, mode, upload.kind);
    setAnalysis(preset.analysis);
    setPrompts(built);
    setStatus("ready");

    const item: HistoryItem = {
      id: crypto.randomUUID(),
      title: shortTitle(upload.name),
      date: nowLabel(),
      type: upload.kind === "video" ? "Video" : "Imagen",
      img: upload.url,
      analysis: preset.analysis,
      prompts: built,
    };
    setHistory((h) => [item, ...h].slice(0, 24));
  }, [upload, mode]);

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

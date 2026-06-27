import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import templeImg from "@/assets/temple.jpg";
import { analyzeCombined, analyzeWithGemini, analyzeWithOpenAI } from "@/lib/ai/prompt-analyzer";
import { transcribeVideoDialogue } from "@/lib/ai/transcribe-video.functions";

export type AnalysisMode = "max" | "bal" | "cre" | "short";
export type AiModel = "gpt" | "gem" | "both";
export type SceneAdaptation = "exact" | "similar" | "style" | "new";
export type IdentityLock = "flex" | "strict" | "ultra";

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
  | "imagenBase"
  | "imagen"
  | "midjourney"
  | "flux"
  | "veo"
  | "kling"
  | "whisk"
  | "youtubeCreate";

export type Prompts = Record<PromptKey, string>;

export type HistoryItem = {
  id: string;
  title: string;
  date: string;
  createdAt: number;
  type: "Imagen" | "Video" | "Prompt";
  img: string;
  dialogueText?: string;
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
  size?: number;
  dataUrl?: string;
  frameDataUrls?: string[];
} | null;

export type ReferenceInfo = {
  url: string;
  name: string;
  mime: string;
  dataUrl: string;
  avatarId?: string;
  profileName?: string;
  notes?: string;
} | null;

export type AvatarProfile = {
  id: string;
  name: string;
  fileName: string;
  mime: string;
  imageUrl: string;
  notes: string;
  createdAt: number;
  updatedAt: number;
};

export type Status = "idle" | "analyzing" | "ready";
export type DialogueStatus = "idle" | "extracting" | "ready";

type Ctx = {
  upload: UploadInfo;
  setUpload: (u: UploadInfo) => void;
  clearUpload: () => void;
  dialogueText: string;
  setDialogueText: (text: string) => void;
  clearDialogueText: () => void;
  dialogueStatus: DialogueStatus;
  dialogueError: string | null;
  extractDialogue: () => Promise<void>;
  reference: ReferenceInfo;
  setReference: (r: ReferenceInfo) => void;
  clearReference: () => void;
  avatars: AvatarProfile[];
  activeAvatarId: string | null;
  activeAvatar: AvatarProfile | null;
  addAvatar: (avatar: Omit<AvatarProfile, "id" | "createdAt" | "updatedAt">) => AvatarProfile;
  updateAvatar: (id: string, patch: Partial<Pick<AvatarProfile, "name" | "notes">>) => void;
  removeAvatar: (id: string) => void;
  selectAvatar: (id: string) => void;
  saveReferenceAsAvatar: (name?: string, notes?: string) => AvatarProfile | null;
  mode: AnalysisMode;
  setMode: (m: AnalysisMode) => void;
  sceneAdaptation: SceneAdaptation;
  setSceneAdaptation: (m: SceneAdaptation) => void;
  identityLock: IdentityLock;
  setIdentityLock: (m: IdentityLock) => void;
  model: AiModel;
  setModel: (m: AiModel) => void;
  status: Status;
  error: string | null;
  analysis: AnalysisFields;
  prompts: Prompts;
  history: HistoryItem[];
  favorites: HistoryItem[];
  toggleFavorite: (item: HistoryItem) => void;
  isFavorite: (id: string) => boolean;
  removeHistoryItem: (id: string) => void;
  removeFavorite: (id: string) => void;
  clearHistory: () => void;
  loadHistoryItem: (item: HistoryItem) => void;
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
  imagenBase:
    "single still image for Flow, traditional Japanese temple at night, warm lantern glow, cherry blossom trees, mirror-like lake reflection, photorealistic first frame, no motion, no transition, vertical 9:16",
  imagen:
    "ultra detailed photo of a traditional Japanese temple at night, soft moonlight, warm lantern glow, cherry blossom trees, mirror-like lake reflection, photorealistic, sharp focus, 8k",
  midjourney:
    "traditional Japanese temple at night, warm lanterns, cherry blossoms, full moon, lake reflection, cinematic lighting, ultra realistic, 8k --ar 16:9 --style raw --v 6",
  flux: "A traditional Japanese temple at night, illuminated by warm lanterns, surrounded by cherry blossom trees, full moon, perfect reflection on a calm lake, cinematic, ultra-realistic, hyper-detailed, 8K",
  veo: "Cinematic 5s shot, slow dolly-in on a Japanese temple at night, lanterns glowing, cherry petals drifting, lake ripples, moonlight, photorealistic, 24fps",
  kling:
    "Realistic cinematic video, Japanese temple at night, soft camera push-in, falling cherry blossoms, lake reflection shimmering, warm lantern light, 5 seconds",
  whisk:
    "Subject: traditional Japanese temple. Scene: night garden with cherry blossoms and lake. Style: cinematic, ultra realistic, warm lanterns, full moon.",
  youtubeCreate:
    "YouTube Create vertical 9:16 video: photorealistic Japanese temple at night, warm lanterns, cherry blossoms, full moon and calm lake reflection. Natural camera motion, cinematic light, realistic texture. Start directly in the final scene, no intro, no morph, no transition. Dialogue: none.",
};

// Mock presets, pickPreset and buildPromptsFromBase live in
// `src/lib/ai/mock-presets.ts` so both the analyzer service and any
// future server-side fallback share a single source of truth.

function shortTitle(name: string) {
  const stem = name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
  return stem.length > 40 ? stem.slice(0, 40) + "…" : stem || "Prompt generado";
}

function normalizePrompts(prompts: Partial<Prompts> | undefined): Prompts {
  return {
    ...DEFAULT_PROMPTS,
    ...(prompts ?? {}),
  };
}

function nowLabel() {
  const d = new Date();
  return `Hoy, ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

const HISTORY_STORAGE_KEY = "visual-prompt-engine.history.v1";
const FAVORITES_STORAGE_KEY = "visual-prompt-engine.favorites.v1";
const AVATARS_STORAGE_KEY = "visual-prompt-engine.avatars.v1";

function readStoredItems<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredItems(key: string, items: HistoryItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Storage can fail if previews are too large; keeping the session state is still useful.
  }
}

function writeStoredAvatarItems(key: string, items: AvatarProfile[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Avatar images are data URLs; if storage fills up, keep the current session usable.
  }
}

function previewFor(upload: NonNullable<UploadInfo>) {
  return upload.dataUrl ?? upload.frameDataUrls?.[0] ?? upload.url;
}

// ---------- Provider ----------
export function PromptProvider({ children }: { children: ReactNode }) {
  const [upload, setUploadState] = useState<UploadInfo>({
    url: templeImg,
    name: "templo-japones.jpg",
    mime: "image/jpeg",
    kind: "image",
  });
  const [dialogueText, setDialogueText] = useState("");
  const [dialogueStatus, setDialogueStatus] = useState<DialogueStatus>("idle");
  const [dialogueError, setDialogueError] = useState<string | null>(null);
  const [reference, setReferenceState] = useState<ReferenceInfo>(null);
  const [mode, setMode] = useState<AnalysisMode>("max");
  const [sceneAdaptation, setSceneAdaptation] = useState<SceneAdaptation>("similar");
  const [identityLock, setIdentityLock] = useState<IdentityLock>("strict");
  const [model, setModel] = useState<AiModel>("gem");
  const [status, setStatus] = useState<Status>("ready");
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisFields>(DEFAULT_ANALYSIS);
  const [prompts, setPrompts] = useState<Prompts>(DEFAULT_PROMPTS);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [favorites, setFavorites] = useState<HistoryItem[]>([]);
  const [avatars, setAvatars] = useState<AvatarProfile[]>([]);
  const [activeAvatarId, setActiveAvatarId] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    setHistory(readStoredItems<HistoryItem>(HISTORY_STORAGE_KEY));
    setFavorites(readStoredItems<HistoryItem>(FAVORITES_STORAGE_KEY));
    setAvatars(readStoredItems<AvatarProfile>(AVATARS_STORAGE_KEY));
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    writeStoredItems(HISTORY_STORAGE_KEY, history);
  }, [history, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    writeStoredItems(FAVORITES_STORAGE_KEY, favorites);
  }, [favorites, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    writeStoredAvatarItems(AVATARS_STORAGE_KEY, avatars);
  }, [avatars, storageReady]);

  const setSafeModel = useCallback((m: AiModel) => {
    setError(null);
    setModel(m);
  }, []);

  const setUpload = useCallback((u: UploadInfo) => {
    setUploadState(u);
    setDialogueText("");
    setDialogueStatus("idle");
    setDialogueError(null);
  }, []);

  const clearUpload = useCallback(() => {
    setUploadState((prev) => {
      if (prev && prev.url.startsWith("blob:")) URL.revokeObjectURL(prev.url);
      return null;
    });
    setDialogueText("");
    setDialogueStatus("idle");
    setDialogueError(null);
  }, []);

  const clearDialogueText = useCallback(() => {
    setDialogueText("");
    setDialogueStatus("idle");
    setDialogueError(null);
  }, []);

  const extractDialogue = useCallback(async () => {
    if (!upload || upload.kind !== "video") return;
    if (!upload.dataUrl) {
      setDialogueError(
        "Este video es muy grande para transcripción inline. Pega el diálogo manualmente por ahora.",
      );
      return;
    }
    setDialogueStatus("extracting");
    setDialogueError(null);
    try {
      const result = await transcribeVideoDialogue({
        data: {
          fileDataUrl: upload.dataUrl,
          mime: upload.mime,
          fileName: upload.name,
          language: "auto",
        },
      });
      setDialogueText(result.dialogueText);
      setDialogueStatus("ready");
      if (!result.dialogueText.trim()) {
        setDialogueError("No se detectó diálogo claro en el audio del video.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo extraer el diálogo";
      setDialogueStatus("idle");
      setDialogueError(message);
    }
  }, [upload]);

  const setReference = useCallback((r: ReferenceInfo) => {
    setReferenceState((prev) => {
      if (prev && prev.url.startsWith("blob:")) URL.revokeObjectURL(prev.url);
      return r;
    });
    setActiveAvatarId(r?.avatarId ?? null);
  }, []);

  const clearReference = useCallback(() => {
    setReferenceState((prev) => {
      if (prev && prev.url.startsWith("blob:")) URL.revokeObjectURL(prev.url);
      return null;
    });
    setActiveAvatarId(null);
  }, []);

  const activeAvatar = useMemo(
    () => avatars.find((avatar) => avatar.id === activeAvatarId) ?? null,
    [avatars, activeAvatarId],
  );

  const addAvatar = useCallback((avatar: Omit<AvatarProfile, "id" | "createdAt" | "updatedAt">) => {
    const now = Date.now();
    const item: AvatarProfile = {
      ...avatar,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    setAvatars((current) => [item, ...current].slice(0, 30));
    setReferenceState({
      url: item.imageUrl,
      dataUrl: item.imageUrl,
      name: item.fileName,
      mime: item.mime,
      avatarId: item.id,
      profileName: item.name,
      notes: item.notes,
    });
    setActiveAvatarId(item.id);
    return item;
  }, []);

  const updateAvatar = useCallback(
    (id: string, patch: Partial<Pick<AvatarProfile, "name" | "notes">>) => {
      setAvatars((current) =>
        current.map((avatar) =>
          avatar.id === id ? { ...avatar, ...patch, updatedAt: Date.now() } : avatar,
        ),
      );
      setReferenceState((current) =>
        current?.avatarId === id
          ? {
              ...current,
              profileName: patch.name ?? current.profileName,
              notes: patch.notes ?? current.notes,
            }
          : current,
      );
    },
    [],
  );

  const removeAvatar = useCallback((id: string) => {
    setAvatars((current) => current.filter((avatar) => avatar.id !== id));
    setReferenceState((current) => (current?.avatarId === id ? null : current));
    setActiveAvatarId((current) => (current === id ? null : current));
  }, []);

  const selectAvatar = useCallback(
    (id: string) => {
      const avatar = avatars.find((item) => item.id === id);
      if (!avatar) return;
      setReferenceState({
        url: avatar.imageUrl,
        dataUrl: avatar.imageUrl,
        name: avatar.fileName,
        mime: avatar.mime,
        avatarId: avatar.id,
        profileName: avatar.name,
        notes: avatar.notes,
      });
      setActiveAvatarId(avatar.id);
    },
    [avatars],
  );

  const saveReferenceAsAvatar = useCallback(
    (name?: string, notes?: string) => {
      if (!reference) return null;
      const existing = reference.avatarId
        ? avatars.find((avatar) => avatar.id === reference.avatarId)
        : null;
      if (existing) {
        updateAvatar(existing.id, {
          name: name?.trim() || existing.name,
          notes: notes?.trim() || existing.notes,
        });
        return existing;
      }
      return addAvatar({
        name: name?.trim() || shortTitle(reference.name),
        fileName: reference.name,
        mime: reference.mime,
        imageUrl: reference.dataUrl,
        notes:
          notes?.trim() ||
          "Preservar rostro, rasgos, proporciones, tono de piel, cabello, estilo y detalles distintivos. No rediseñar.",
      });
    },
    [addAvatar, avatars, reference, updateAvatar],
  );

  const isFavorite = useCallback(
    (id: string) => favorites.some((item) => item.id === id),
    [favorites],
  );

  const toggleFavorite = useCallback((item: HistoryItem) => {
    setFavorites((current) => {
      const exists = current.some((fav) => fav.id === item.id);
      if (exists) return current.filter((fav) => fav.id !== item.id);
      return [item, ...current].slice(0, 48);
    });
  }, []);

  const removeHistoryItem = useCallback((id: string) => {
    setHistory((current) => current.filter((item) => item.id !== id));
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((current) => current.filter((item) => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const loadHistoryItem = useCallback((item: HistoryItem) => {
    setAnalysis(item.analysis);
    setPrompts(normalizePrompts(item.prompts));
    setModel("gem");
    setStatus("ready");
    setError(null);
    setDialogueText(item.dialogueText ?? "");
    setDialogueStatus(item.dialogueText ? "ready" : "idle");
    setDialogueError(null);
    setUploadState({
      url: item.img,
      name: item.title,
      mime: "image/jpeg",
      kind: "image",
      dataUrl: item.img,
    });
  }, []);

  const generate = useCallback(async () => {
    if (!upload) {
      // soft validation; UI surfaces this via button state
      return;
    }
    setStatus("analyzing");
    setError(null);

    const analyzer =
      model === "gem" ? analyzeWithGemini : model === "both" ? analyzeCombined : analyzeWithOpenAI;

    let result: Awaited<ReturnType<typeof analyzer>>;
    try {
      result = await analyzer(upload, {
        mode,
        identityReference: reference,
        sceneAdaptation,
        identityLock,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo analizar el contenido";
      const quotaMessage = message.includes("429") || message.toLowerCase().includes("quota");
      setError(
        quotaMessage
          ? "El proveedor llegó a cuota o rate limit. El sistema intentará usar cache o Gemini vía Lovable."
          : message,
      );
      setStatus("ready");
      return;
    }

    setAnalysis(result.analysis);
    setPrompts(result.prompts);
    setStatus("ready");

    const principalLen = result.prompts.principal?.length ?? 0;
    const baseScore = model === "both" ? 96 : model === "gem" ? 91 : 88;
    const score = Math.min(99, Math.max(70, baseScore + Math.round((principalLen % 60) / 12) - 2));

    const item: HistoryItem = {
      id: crypto.randomUUID(),
      title: shortTitle(upload.name),
      date: nowLabel(),
      createdAt: Date.now(),
      type: upload.kind === "video" ? "Video" : "Imagen",
      img: previewFor(upload),
      dialogueText: dialogueText.trim() || undefined,
      model,
      score,
      analysis: result.analysis,
      prompts: result.prompts,
    };
    setHistory((h) => [item, ...h].slice(0, 24));
  }, [upload, mode, model, reference, sceneAdaptation, identityLock, dialogueText]);

  const value = useMemo<Ctx>(
    () => ({
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
      activeAvatar,
      addAvatar,
      updateAvatar,
      removeAvatar,
      selectAvatar,
      saveReferenceAsAvatar,
      mode,
      setMode,
      sceneAdaptation,
      setSceneAdaptation,
      identityLock,
      setIdentityLock,
      model,
      setModel: setSafeModel,
      status,
      error,
      analysis,
      prompts,
      history,
      favorites,
      toggleFavorite,
      isFavorite,
      removeHistoryItem,
      removeFavorite,
      clearHistory,
      loadHistoryItem,
      generate,
    }),
    [
      upload,
      setUpload,
      clearUpload,
      dialogueText,
      dialogueStatus,
      dialogueError,
      clearDialogueText,
      extractDialogue,
      reference,
      setReference,
      clearReference,
      avatars,
      activeAvatarId,
      activeAvatar,
      addAvatar,
      updateAvatar,
      removeAvatar,
      selectAvatar,
      saveReferenceAsAvatar,
      mode,
      sceneAdaptation,
      identityLock,
      model,
      setSafeModel,
      status,
      error,
      analysis,
      prompts,
      history,
      favorites,
      toggleFavorite,
      isFavorite,
      removeHistoryItem,
      removeFavorite,
      clearHistory,
      loadHistoryItem,
      generate,
    ],
  );

  return <PromptCtx.Provider value={value}>{children}</PromptCtx.Provider>;
}

export function usePromptStore() {
  const ctx = useContext(PromptCtx);
  if (!ctx) throw new Error("usePromptStore must be used within PromptProvider");
  return ctx;
}

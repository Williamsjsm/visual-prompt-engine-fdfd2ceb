import type { AnalysisFields, AnalysisMode, Prompts } from "@/lib/prompt-store";

export type Preset = { analysis: AnalysisFields; base: string };

export const DEFAULT_ANALYSIS: AnalysisFields = {
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
  quality: "Alta definición, 4K",
  realism: "Ultra realista",
  format: "16:9 Horizontal",
};

export const DEFAULT_BASE =
  "traditional Japanese temple at night, illuminated by warm lanterns, cherry blossom trees in full bloom, full moon, calm lake reflection";

export const EXACT_IDENTITY_PROMPT_BLOCK = `Use the reference image as the exact character reference.

Keep the exact same person, identical facial identity, face shape, eyes, eyebrows, nose, lips, smile, skin tone, hairstyle, hair color, body proportions and overall appearance.

Do not modify facial features.
Do not change age.
Do not change body shape.
Do not change facial expression style.
Maintain exact identity consistency.

Start directly in the target scene from the first frame. No separate intro shot, no photo animation, no morph, no before-after transformation, no transition.`;

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
      quality: "Alta definición, 4K",
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
      quality: "4K HDR",
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
      quality: "4K, ray tracing",
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

export function pickPreset(name: string): Preset {
  const n = name.toLowerCase();
  if (n.includes("castle") || n.includes("castillo")) return PRESETS.castle;
  if (n.includes("mount") || n.includes("monta")) return PRESETS.mountain;
  if (n.includes("cyber") || n.includes("neon") || n.includes("city")) return PRESETS.cyberpunk;
  if (n.includes("portrait") || n.includes("retrato") || n.includes("face"))
    return PRESETS.portrait;
  return { analysis: DEFAULT_ANALYSIS, base: DEFAULT_BASE };
}

export function buildPromptsFromBase(
  base: string,
  mode: AnalysisMode,
  kind: "image" | "video",
): Prompts {
  const cleanBase = applyExactIdentityBlock(sanitizePromptForGeneration(base));
  const len =
    mode === "max"
      ? ", hyper detailed, 4k, masterpiece"
      : mode === "cre"
        ? ", surreal, artistic, dreamlike"
        : mode === "short"
          ? ""
          : ", high quality";
  const directScene =
    /same character identity|identity locked|consistent face|distinctive features/i.test(cleanBase)
      ? ", start directly in the target scene, no standalone intro shot, no intro photo animation, no morph, no transition"
      : "";

  return {
    principal: `${cleanBase}${len}, cinematic lighting, ultra realistic --ar 16:9`,
    negativo:
      "blurry, low quality, distorted, deformed, watermark, text, logo, oversaturated, bad anatomy, extra limbs, jpeg artifacts, low resolution",
    cinematografico: `cinematic shot, ${cleanBase}, anamorphic lens, shallow depth of field, volumetric light, color graded teal & orange, 35mm film grain, ultra detailed, 4k`,
    video: `slow cinematic dolly-in, ${cleanBase}${directScene}, subtle motion, 24fps, ${kind === "video" ? "5 second clip" : "cinematic motion"}`,
    imagenBase: `FLOW BASE IMAGE / FIRST FRAME: create one static photorealistic image, ${cleanBase}, already inside the final target scene, matching the original camera angle and composition, selfie-style framing when present, natural skin texture, visible pores, realistic hair strands, detailed eyes, cinematic depth of field, vertical 9:16, no motion, no transition, no split-screen, no collage`,
    imagen: `ultra detailed photo, ${cleanBase}, photorealistic, sharp focus, 4k`,
    midjourney: `${cleanBase}${len} --ar 16:9 --style raw --v 6`,
    flux: `${cleanBase.charAt(0).toUpperCase() + cleanBase.slice(1)}${len}, hyper-detailed, 4K`,
    veo: `Cinematic 5s shot, ${cleanBase}${directScene}, photorealistic, 24fps`,
    kling: `Realistic cinematic video, ${cleanBase}${directScene}, smooth camera motion, 5 seconds`,
    whisk: `Subject and scene: ${cleanBase}. Style: cinematic, ultra realistic.`,
    youtubeCreate: buildYouTubeCreatePrompt(cleanBase),
  };
}

function buildYouTubeCreatePrompt(value: string): string {
  const hasIdentity = needsExactIdentityBlock(value);
  const scene = stripExactIdentityBlock(value)
    .replace(/--ar\s+\S+/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  const identity = hasIdentity
    ? "Use reference image as exact character identity; keep same face, age, body, skin tone, hair, proportions and distinctive details; do not redesign. "
    : "";
  return truncateAtWord(
    `${identity}YouTube Create vertical 9:16 video: ${scene}. Photorealistic cinematic light, natural camera motion, realistic texture. Start directly in the final scene, no intro, no photo animation, no morph, no transition.`,
    900,
  );
}

function stripExactIdentityBlock(value: string): string {
  return value
    .replace(EXACT_IDENTITY_PROMPT_BLOCK, "")
    .replace(/Use the reference image as the exact character reference\.[\s\S]*?transition\./i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function truncateAtWord(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  const limit = Math.max(0, maxLength - 3);
  const cut = value.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : limit).trim()}...`;
}

function applyExactIdentityBlock(value: string): string {
  if (!needsExactIdentityBlock(value)) return value;
  if (/Use the reference image as the exact character reference/i.test(value)) return value;
  return `${EXACT_IDENTITY_PROMPT_BLOCK}\n\n${value}`;
}

function needsExactIdentityBlock(value: string): boolean {
  return /same character identity|identity locked|consistent face|distinctive features|exact identity consistency|exact character reference/i.test(
    value,
  );
}

function sanitizePromptForGeneration(value: string): string {
  return value
    .replace(/the same referenced avatar\/person/gi, "the exact same person")
    .replace(/same referenced avatar\/person/gi, "the exact same person")
    .replace(/referenced avatar\/person/gi, "exact character reference")
    .replace(/referenced avatar/gi, "person")
    .replace(/reference-image/gi, "reference image")
    .replace(/attached image/gi, "reference image")
    .replace(/uploaded image/gi, "reference image")
    .replace(/provided image/gi, "reference image")
    .replace(/input image/gi, "reference image")
    .replace(/source image/gi, "reference image")
    .replace(/identity source/gi, "reference image")
    .replace(/identity-source/gi, "reference image")
    .replace(/referenced person/gi, "exact same person")
    .replace(/\bavatar\/person\b/gi, "person")
    .replace(/\bavatar\b/gi, "person")
    .replace(/\breferenced\b/gi, "exact")
    .replace(/\b8k\b/gi, "4k")
    .replace(/\s{2,}/g, " ")
    .trim();
}

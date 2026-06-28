import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Cpu,
  Languages,
  FileImage,
  Database,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  User,
  Upload,
  MapPin,
  Cloud,
  RotateCcw,
  Save,
} from "lucide-react";
import { usePromptStore, type UserProfile } from "@/lib/prompt-store";

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };
const CONFIG_PREFERENCES_STORAGE_KEY = "visual-prompt-engine.config-preferences.v1";

type ConfigPreferences = {
  language: string;
  targetFormat: string;
};

const DEFAULT_CONFIG_PREFERENCES: ConfigPreferences = {
  language: "Español",
  targetFormat: "Midjourney",
};

export function ConfiguracionView() {
  const {
    model,
    setModel,
    history,
    favorites,
    avatars,
    clearHistory,
    userProfile,
    updateUserProfile,
  } = usePromptStore();
  const profileInputRef = useRef<HTMLInputElement>(null);
  const [draftProfile, setDraftProfile] = useState<UserProfile>(userProfile);
  const [savedPreferences, setSavedPreferences] = useState<ConfigPreferences>(
    DEFAULT_CONFIG_PREFERENCES,
  );
  const [draftPreferences, setDraftPreferences] = useState<ConfigPreferences>(
    DEFAULT_CONFIG_PREFERENCES,
  );
  const [saveMessage, setSaveMessage] = useState("Todo guardado");
  const storageBytes = useMemo(
    () => new Blob([JSON.stringify({ history, favorites, avatars })]).size,
    [history, favorites, avatars],
  );
  const storageLabel =
    storageBytes > 1024 * 1024
      ? `${(storageBytes / 1024 / 1024).toFixed(1)} MB`
      : `${Math.max(1, Math.round(storageBytes / 1024))} KB`;
  const storagePercent = Math.min(100, Math.round((storageBytes / (4 * 1024 * 1024)) * 100));
  const hasChanges =
    !sameProfile(draftProfile, userProfile) ||
    draftPreferences.language !== savedPreferences.language ||
    draftPreferences.targetFormat !== savedPreferences.targetFormat;

  useEffect(() => {
    const storedPreferences = readStoredPreferences();
    setSavedPreferences(storedPreferences);
    setDraftPreferences(storedPreferences);
  }, []);

  useEffect(() => {
    setDraftProfile(userProfile);
  }, [userProfile]);

  const setProfileDraft = (patch: Partial<UserProfile>) => {
    setDraftProfile((current) => ({ ...current, ...patch }));
    setSaveMessage("Cambios sin guardar");
  };

  const setPreferenceDraft = (patch: Partial<ConfigPreferences>) => {
    setDraftPreferences((current) => ({ ...current, ...patch }));
    setSaveMessage("Cambios sin guardar");
  };

  const saveChanges = () => {
    const normalizedProfile = normalizeProfile(draftProfile);
    updateUserProfile(normalizedProfile);
    writeStoredPreferences(draftPreferences);
    setSavedPreferences(draftPreferences);
    setDraftProfile(normalizedProfile);
    setSaveMessage("Cambios guardados");
  };

  const resetChanges = () => {
    setDraftProfile(userProfile);
    setDraftPreferences(savedPreferences);
    setSaveMessage("Cambios restablecidos");
    if (profileInputRef.current) profileInputRef.current.value = "";
  };

  return (
    <motion.section {...fade} transition={{ duration: 0.4 }} className="glass-panel p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-white">
          <Settings className="h-4 w-4 text-[#7c4dff]" />
          Configuración general
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={
              "rounded-full px-3 py-1 text-[11.5px] font-semibold ring-1 " +
              (hasChanges
                ? "bg-amber-400/10 text-amber-200 ring-amber-300/20"
                : "bg-emerald-400/10 text-emerald-200 ring-emerald-300/20")
            }
          >
            {hasChanges ? "Cambios sin guardar" : saveMessage}
          </span>
          <button
            onClick={resetChanges}
            disabled={!hasChanges}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-2 text-[12px] font-medium text-slate-300 ring-1 ring-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restablecer
          </button>
          <button
            onClick={saveChanges}
            disabled={!hasChanges}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#5b5eff] to-[#3b82f6] px-3 py-2 text-[12px] font-semibold text-white shadow-[0_12px_25px_-16px_rgba(59,130,246,0.9)] ring-1 ring-white/10 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Save className="h-3.5 w-3.5" />
            Guardar cambios
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <Row icon={User} label="Perfil del creador" hint="Nombre y foto usados en el dashboard.">
          <div className="flex w-full flex-wrap items-center justify-end gap-3 md:w-auto">
            <button
              onClick={() => profileInputRef.current?.click()}
              className="relative h-14 w-14 overflow-hidden rounded-full bg-white/[0.04] ring-2 ring-[#7c4dff]/40"
              title="Subir foto de perfil"
            >
              {draftProfile.photoUrl ? (
                <img
                  src={draftProfile.photoUrl}
                  alt={draftProfile.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[18px] font-bold text-white">
                  {initials(draftProfile.name)}
                </span>
              )}
            </button>
            <div className="grid min-w-[240px] gap-2 sm:grid-cols-2">
              <input
                value={draftProfile.name}
                onChange={(event) => setProfileDraft({ name: event.target.value })}
                className="rounded-lg bg-white/[0.04] px-3 py-2 text-[13px] text-slate-100 ring-1 ring-white/10 outline-none focus:ring-[#7c4dff]/50"
                placeholder="Nombre"
              />
              <input
                value={draftProfile.role}
                onChange={(event) => setProfileDraft({ role: event.target.value })}
                className="rounded-lg bg-white/[0.04] px-3 py-2 text-[13px] text-slate-100 ring-1 ring-white/10 outline-none focus:ring-[#7c4dff]/50"
                placeholder="Rol"
              />
            </div>
            <button
              onClick={() => profileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-2 text-[12px] font-medium text-slate-300 ring-1 ring-white/10 hover:text-white"
            >
              <Upload className="h-3.5 w-3.5" />
              Foto
            </button>
            <input
              ref={profileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => void pickProfilePhoto(event.target.files?.[0], setProfileDraft)}
            />
          </div>
        </Row>
        <Row
          icon={MapPin}
          label="Widget del dashboard"
          hint="Datos mostrados en la tarjeta de clima."
        >
          <div className="grid w-full gap-2 md:w-auto md:min-w-[560px] md:grid-cols-[1.4fr_0.6fr_0.8fr]">
            <input
              value={draftProfile.location}
              onChange={(event) => setProfileDraft({ location: event.target.value })}
              className="rounded-lg bg-white/[0.04] px-3 py-2 text-[13px] text-slate-100 ring-1 ring-white/10 outline-none focus:ring-[#7c4dff]/50"
              placeholder="Ciudad, Estado - País"
            />
            <input
              value={draftProfile.temperature}
              onChange={(event) => setProfileDraft({ temperature: event.target.value })}
              className="rounded-lg bg-white/[0.04] px-3 py-2 text-[13px] text-slate-100 ring-1 ring-white/10 outline-none focus:ring-[#7c4dff]/50"
              placeholder="22°C"
            />
            <div className="relative">
              <Cloud className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                value={draftProfile.weather}
                onChange={(event) => setProfileDraft({ weather: event.target.value })}
                className="w-full rounded-lg bg-white/[0.04] py-2 pl-9 pr-3 text-[13px] text-slate-100 ring-1 ring-white/10 outline-none focus:ring-[#7c4dff]/50"
                placeholder="Nublado"
              />
            </div>
          </div>
        </Row>
        <Row icon={Cpu} label="Modelo de IA" hint="Motor usado para analizar tus archivos.">
          <Select value={model} onChange={setModel} options={[{ value: "gem", label: "Gemini" }]} />
        </Row>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <StatusCard
            icon={CheckCircle2}
            title="Gemini API"
            status="Activo"
            tone="ok"
            text="Motor principal para análisis, traducción y mejora de prompts."
          />
          <StatusCard
            icon={AlertTriangle}
            title="ChatGPT API"
            status="Sin cuota"
            tone="warn"
            text="La conexión existe, pero OpenAI Platform requiere saldo API para responder."
          />
        </div>
        <Row icon={Languages} label="Idioma" hint="Idioma de los prompts generados.">
          <Select
            value={draftPreferences.language}
            onChange={(language) => setPreferenceDraft({ language })}
            options={[
              { value: "Español", label: "Español" },
              { value: "Inglés", label: "Inglés" },
              { value: "Portugués de Brasil", label: "Portugués de Brasil" },
            ]}
          />
        </Row>
        <Row icon={FileImage} label="Formato por defecto" hint="Plataforma objetivo del prompt.">
          <Select
            value={draftPreferences.targetFormat}
            onChange={(targetFormat) => setPreferenceDraft({ targetFormat })}
            options={[
              { value: "Midjourney", label: "Midjourney" },
              { value: "Flux", label: "Flux" },
              { value: "Veo", label: "Veo" },
              { value: "Kling", label: "Kling" },
              { value: "Whisk", label: "Whisk" },
            ]}
          />
        </Row>
        <Row icon={Database} label="Almacenamiento" hint="Espacio ocupado por tu historial local.">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="h-2 w-40 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#5b5eff] to-[#3b82f6]"
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            <span className="text-[12px] text-slate-400">
              {storagePercent}% · {storageLabel}
            </span>
            <button
              onClick={clearHistory}
              disabled={history.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-2 text-[12px] font-medium text-slate-300 ring-1 ring-white/10 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpiar historial
            </button>
          </div>
        </Row>
      </div>
    </motion.section>
  );
}

function readStoredPreferences(): ConfigPreferences {
  if (typeof window === "undefined") return DEFAULT_CONFIG_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(CONFIG_PREFERENCES_STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG_PREFERENCES;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? { ...DEFAULT_CONFIG_PREFERENCES, ...parsed }
      : DEFAULT_CONFIG_PREFERENCES;
  } catch {
    return DEFAULT_CONFIG_PREFERENCES;
  }
}

function writeStoredPreferences(preferences: ConfigPreferences) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONFIG_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Preferences are nice-to-have; the current session can continue without persistence.
  }
}

function normalizeProfile(profile: UserProfile): UserProfile {
  return {
    ...profile,
    name: profile.name.trim() || "Williams",
    role: profile.role.trim() || "Creator",
    location: profile.location.trim() || "Curitiba, Paraná - Brasil",
    temperature: profile.temperature.trim() || "22°C",
    weather: profile.weather.trim() || "Nublado",
  };
}

function sameProfile(a: UserProfile, b: UserProfile): boolean {
  return (
    a.name === b.name &&
    a.role === b.role &&
    a.photoUrl === b.photoUrl &&
    a.location === b.location &&
    a.temperature === b.temperature &&
    a.weather === b.weather
  );
}

function initials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "PG";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

async function pickProfilePhoto(
  file: File | undefined,
  updateProfileDraft: (patch: { photoUrl: string }) => void,
) {
  if (!file) return;
  const dataUrl = await readAsDataUrl(file);
  updateProfileDraft({ photoUrl: dataUrl });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
}

function Row({
  icon: Icon,
  label,
  hint,
  children,
}: {
  icon: typeof Settings;
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-inset flex flex-wrap items-center justify-between gap-4 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] ring-1 ring-white/10">
          <Icon className="h-4 w-4 text-[#7c4dff]" />
        </div>
        <div>
          <div className="text-[13.5px] font-medium text-white">{label}</div>
          <div className="text-[11.5px] text-slate-400">{hint}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg bg-white/[0.04] px-3 py-2 text-[13px] text-slate-100 ring-1 ring-white/10 focus:ring-[#7c4dff]/50 outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#0d162b]">
          {o.label}
        </option>
      ))}
    </select>
  );
}

function StatusCard({
  icon: Icon,
  title,
  status,
  text,
  tone,
}: {
  icon: typeof Settings;
  title: string;
  status: string;
  text: string;
  tone: "ok" | "warn";
}) {
  const color =
    tone === "ok"
      ? "text-emerald-300 bg-emerald-400/10 ring-emerald-300/20"
      : "text-amber-200 bg-amber-400/10 ring-amber-300/20";

  return (
    <div className="glass-inset p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13.5px] font-semibold text-white">
          <Icon className={tone === "ok" ? "h-4 w-4 text-emerald-300" : "h-4 w-4 text-amber-200"} />
          {title}
        </div>
        <span className={"rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 " + color}>
          {status}
        </span>
      </div>
      <p className="mt-2 text-[12px] leading-5 text-slate-400">{text}</p>
    </div>
  );
}

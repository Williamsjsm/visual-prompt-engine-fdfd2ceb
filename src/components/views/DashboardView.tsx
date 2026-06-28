import { motion } from "framer-motion";
import {
  Sparkles,
  Image as ImageIcon,
  Video,
  Star,
  UsersRound,
  MapPin,
  Cloud,
  type LucideIcon,
} from "lucide-react";
import { HistoryStrip } from "@/components/dashboard/HistoryStrip";
import type { SectionKey } from "@/components/layout/Sidebar";
import { usePromptStore } from "@/lib/prompt-store";

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };
type DayPhase = "morning" | "day" | "evening" | "night";
type WeatherMode = "clear" | "cloudy" | "rainy";

interface Props {
  onNavigate: (key: SectionKey) => void;
}

export function DashboardView({ onNavigate }: Props) {
  const { history, favorites, avatars, userProfile } = usePromptStore();
  const imageCount = history.filter((item) => item.type === "Imagen").length;
  const videoCount = history.filter((item) => item.type === "Video").length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const dayPhase = getDayPhase(hour);
  const weatherMode = getWeatherMode(userProfile.weather);
  const widgetClassName = [
    "weather-widget relative overflow-hidden rounded-[1.35rem] border border-white/10 p-6 shadow-[0_20px_45px_-25px_rgba(0,0,0,0.75)]",
    `weather-phase-${dayPhase}`,
    `weather-mode-${weatherMode}`,
  ].join(" ");
  const stats = [
    {
      label: "Prompts generados",
      value: String(history.length),
      icon: Sparkles,
      tint: "from-[#7c4dff] to-[#5b5eff]",
    },
    {
      label: "Imágenes analizadas",
      value: String(imageCount),
      icon: ImageIcon,
      tint: "from-[#3b82f6] to-[#00c2ff]",
    },
    {
      label: "Videos analizados",
      value: String(videoCount),
      icon: Video,
      tint: "from-[#ec4899] to-[#7c4dff]",
    },
    {
      label: "Favoritos",
      value: String(favorites.length),
      icon: Star,
      tint: "from-[#f59e0b] to-[#ec4899]",
    },
    {
      label: "Avatares",
      value: String(avatars.length),
      icon: UsersRound,
      tint: "from-[#22c55e] to-[#00c2ff]",
    },
  ];
  const latestPrompts =
    history.length > 0
      ? history.slice(0, 4).map((item) => ({ title: item.title, date: item.date }))
      : [
          { title: "Retrato cinematográfico con luz neón violeta", date: "Ejemplo" },
          { title: "Paisaje épico al amanecer estilo Studio Ghibli", date: "Ejemplo" },
          { title: "Producto premium sobre fondo de mármol negro", date: "Ejemplo" },
          { title: "Ciudad cyberpunk lluviosa con reflejos de neón", date: "Ejemplo" },
        ];

  return (
    <div className="flex flex-col gap-5">
      <motion.section {...fade} transition={{ duration: 0.4 }} className={widgetClassName}>
        <WeatherAtmosphere dayPhase={dayPhase} weatherMode={weatherMode} />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.25))]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-20 bg-[linear-gradient(174deg,transparent_30%,rgba(11,17,28,0.72)_31%,rgba(3,7,15,0.95)_72%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-1 z-[3] h-16 opacity-60">
          <span className="absolute bottom-1 left-[7%] h-4 w-4 bg-[#060b14] [clip-path:polygon(50%_0,0_100%,100%_100%)]" />
          <span className="absolute bottom-2 left-[36%] h-7 w-7 bg-[#060b14] [clip-path:polygon(50%_0,0_100%,100%_100%)]" />
          <span className="absolute bottom-2 left-[58%] h-6 w-6 bg-[#060b14] [clip-path:polygon(50%_0,0_100%,100%_100%)]" />
          <span className="absolute bottom-3 right-[12%] h-5 w-5 bg-[#060b14] [clip-path:polygon(50%_0,0_100%,100%_100%)]" />
        </div>
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h1 className="text-[26px] font-bold leading-tight text-white md:text-[30px]">
              {greeting}, {userProfile.name} <span className="inline-block">👋</span>
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] font-semibold text-slate-100">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {userProfile.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Cloud className="h-3.5 w-3.5 text-slate-200" />
                {userProfile.temperature}
              </span>
              <span>{userProfile.weather}</span>
            </div>
            <p className="mt-4 text-[12.5px] font-semibold text-slate-200">
              0 tendencias · {imageCount} imágenes · {avatars.length} personajes · {history.length}{" "}
              publicaciones
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <DashboardAction
              icon={Sparkles}
              label="Crear prompt"
              onClick={() => onNavigate("generar-prompt")}
            />
            <DashboardAction
              icon={ImageIcon}
              label="Generar imagen"
              onClick={() => onNavigate("generar-imagen")}
            />
          </div>
        </div>
      </motion.section>

      <motion.div
        {...fade}
        transition={{ duration: 0.4, delay: 0.06 }}
        className="grid grid-cols-2 xl:grid-cols-5 gap-4"
      >
        {stats.map((s) => (
          <div key={s.label} className="glass-panel p-4">
            <div
              className={
                "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br " +
                s.tint +
                " shadow-[0_8px_22px_-10px_rgba(124,77,255,0.8)]"
              }
            >
              <s.icon className="h-5 w-5 text-white" />
            </div>
            <div className="mt-3 text-[22px] font-bold text-white">{s.value}</div>
            <div className="text-[12px] text-slate-400">{s.label}</div>
          </div>
        ))}
      </motion.div>

      <motion.section
        {...fade}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass-panel p-5"
      >
        <h3 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-white">
          <Sparkles className="h-4 w-4 text-[#7c4dff]" />
          Últimos prompts
        </h3>
        <ul className="divide-y divide-white/5">
          {latestPrompts.map((p) => (
            <li key={p.title} className="flex items-center justify-between py-2.5 gap-3">
              <span className="min-w-0 truncate text-[13px] text-slate-200">{p.title}</span>
              <span className="shrink-0 text-[11px] text-slate-500">{p.date}</span>
            </li>
          ))}
        </ul>
      </motion.section>

      <motion.div {...fade} transition={{ duration: 0.4, delay: 0.16 }}>
        <HistoryStrip />
      </motion.div>
    </div>
  );
}

function getDayPhase(hour: number): DayPhase {
  if (hour < 6 || hour >= 20) return "night";
  if (hour < 11) return "morning";
  if (hour < 18) return "day";
  return "evening";
}

function getWeatherMode(weather: string): WeatherMode {
  const normalized = weather
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (/(lluv|rain|torment|storm|chuva)/.test(normalized)) return "rainy";
  if (/(nubl|cloud|overcast|nebl|fog|nuvem)/.test(normalized)) return "cloudy";
  return "clear";
}

function DashboardAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-full bg-[#2f6df6] px-5 py-3 text-[13px] font-semibold text-white shadow-[0_14px_28px_-16px_rgba(47,109,246,0.9)] ring-1 ring-white/10 transition hover:bg-[#3f7cff]"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function WeatherAtmosphere({
  dayPhase,
  weatherMode,
}: {
  dayPhase: DayPhase;
  weatherMode: WeatherMode;
}) {
  const isNight = dayPhase === "night";

  return (
    <div className="weather-atmosphere" aria-hidden="true">
      <div className="weather-stars">
        {Array.from({ length: 14 }).map((_, index) => (
          <span key={index} />
        ))}
      </div>
      {isNight ? <div className="weather-moon" /> : <div className="weather-sun" />}
      <WeatherCloud className="weather-cloud-a" />
      <WeatherCloud className="weather-cloud-b" />
      <WeatherCloud className="weather-cloud-c" />
      {weatherMode === "rainy" && <div className="weather-rain" />}
    </div>
  );
}

function WeatherCloud({ className }: { className: string }) {
  return (
    <div className={`weather-cloud ${className}`}>
      <span className="weather-cloud-puff weather-cloud-puff-1" />
      <span className="weather-cloud-puff weather-cloud-puff-2" />
      <span className="weather-cloud-puff weather-cloud-puff-3" />
      <span className="weather-cloud-puff weather-cloud-puff-4" />
      <span className="weather-cloud-puff weather-cloud-puff-5" />
      <span className="weather-cloud-puff weather-cloud-puff-6" />
    </div>
  );
}

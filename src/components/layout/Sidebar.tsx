import {
  Home,
  Sparkles,
  Image as ImageIcon,
  History,
  Star,
  UsersRound,
  Settings,
  HelpCircle,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import avatarImg from "@/assets/avatar.jpg";
import { usePromptStore } from "@/lib/prompt-store";

export type SectionKey =
  | "dashboard"
  | "generar-prompt"
  | "generar-imagen"
  | "historial"
  | "favoritos"
  | "avatares"
  | "configuracion"
  | "ayuda";

const items: { key: SectionKey; label: string; icon: LucideIcon }[] = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "generar-prompt", label: "Generar Prompt", icon: Sparkles },
  { key: "generar-imagen", label: "Generar Imagen", icon: ImageIcon },
  { key: "historial", label: "Historial", icon: History },
  { key: "favoritos", label: "Favoritos", icon: Star },
  { key: "avatares", label: "Avatares", icon: UsersRound },
  { key: "configuracion", label: "Configuración", icon: Settings },
  { key: "ayuda", label: "Ayuda", icon: HelpCircle },
];

interface SidebarProps {
  active: SectionKey;
  onChange: (key: SectionKey) => void;
}

export function Sidebar({ active, onChange }: SidebarProps) {
  const { userProfile } = usePromptStore();
  return (
    <aside className="app-sidebar hidden lg:flex w-[260px] shrink-0 flex-col gap-6 p-5">
      {/* Logo */}
      <div className="flex items-center gap-3 px-1 pt-1">
        <div className="relative h-12 w-12 rounded-xl p-[1px] bg-gradient-to-br from-[#7c4dff] to-[#3b82f6] shadow-[0_0_20px_-2px_rgba(124,77,255,0.6)]">
          <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#0d162b]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold text-white">Prompt</div>
          <div className="text-[15px] font-semibold gradient-text">Generator</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1.5">
        {items.map((it) => {
          const isActive = it.key === active;
          return (
            <button
              key={it.key}
              onClick={() => onChange(it.key)}
              className={
                "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition-all text-left " +
                (isActive
                  ? "text-white bg-gradient-to-r from-[#5b5eff]/80 via-[#7c4dff]/80 to-[#3b82f6]/70 shadow-[0_10px_30px_-12px_rgba(124,77,255,0.9)] ring-1 ring-white/10"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]")
              }
            >
              <it.icon className="h-[18px] w-[18px]" />
              {it.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        {/* User card */}
        <div className="glass-panel flex items-center gap-3 px-3 py-2.5">
          <img
            src={userProfile.photoUrl || avatarImg}
            alt={userProfile.name}
            className="h-10 w-10 rounded-full object-cover ring-2 ring-[#7c4dff]/40"
          />
          <div className="flex-1 min-w-0 leading-tight">
            <div className="truncate text-[13.5px] font-semibold text-white">
              {userProfile.name}
            </div>
            <div className="truncate text-[11.5px] text-slate-400">{userProfile.role}</div>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </div>

        <div className="flex items-center gap-2 px-1 text-[11px] text-slate-500">
          <Sparkles className="h-3 w-3 text-[#7c4dff]" />
          <div className="leading-tight">
            © 2024 Prompt Generator
            <br />
            Todos los derechos reservados.
          </div>
        </div>
      </div>
    </aside>
  );
}

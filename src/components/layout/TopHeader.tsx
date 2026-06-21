import { Bell, Gift, Moon, Sun } from "lucide-react";

export function TopHeader() {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 px-1 pt-2 pb-4">
      <div className="min-w-0">
        <h1 className="text-2xl md:text-[26px] font-bold text-white tracking-tight">
          ¡Hola, Creator! <span className="inline-block">👋</span>
        </h1>
        <p className="mt-1 text-[13.5px] text-slate-400">
          Genera el prompt perfecto para recrear cualquier imagen o video.
        </p>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="glass-panel flex items-center gap-1 p-1">
          <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-200">
            <Moon className="h-4 w-4" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400">
            <Sun className="h-4 w-4" />
          </button>
        </div>
        <button className="glass-panel flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white">
          <Gift className="h-4 w-4 text-[#7c4dff]" />
          100% Gratis
        </button>
        <button className="glass-panel relative flex h-9 w-9 items-center justify-center">
          <Bell className="h-4 w-4 text-slate-200" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0d162b]" />
        </button>
      </div>
    </header>
  );
}

import { Bell } from "lucide-react";

export function TopHeader() {
  return (
    <header className="flex justify-end px-1 pt-2 pb-4">
      <div className="flex items-center gap-2.5 shrink-0">
        <button className="glass-panel relative flex h-9 w-9 items-center justify-center">
          <Bell className="h-4 w-4 text-slate-200" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0d162b]" />
        </button>
      </div>
    </header>
  );
}

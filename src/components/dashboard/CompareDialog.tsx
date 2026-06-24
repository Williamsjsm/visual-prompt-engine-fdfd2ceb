import { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MODEL_LABEL, usePromptStore, type AiModel, type HistoryItem } from "@/lib/prompt-store";
import { ModelBadge } from "./ModelBadge";

const ORDER: AiModel[] = ["gem", "gpt", "both"];

function pickLatestPerModel(history: HistoryItem[]) {
  const map = new Map<AiModel, HistoryItem>();
  for (const it of history) {
    if (!map.has(it.model)) map.set(it.model, it);
  }
  return map;
}

export function CompareDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { history } = usePromptStore();
  const latest = useMemo(() => pickLatestPerModel(history), [history]);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      /* no-op */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl bg-[#0b1020] border-white/10 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-white">Comparar modelos</DialogTitle>
          <DialogDescription className="text-slate-400">
            Últimos prompts generados por cada modelo, lado a lado.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
          {ORDER.map((m) => {
            const it = latest.get(m);
            return (
              <div
                key={m}
                className="rounded-xl bg-white/[0.03] ring-1 ring-white/10 p-3 flex flex-col"
              >
                <div className="flex items-center justify-between mb-2">
                  <ModelBadge model={m} />
                  {it && (
                    <span className="text-[11px] text-slate-400">
                      Fidelidad{" "}
                      <span className="text-emerald-300 font-semibold">{it.score}%</span>
                    </span>
                  )}
                </div>

                {it ? (
                  <>
                    <div className="text-[12.5px] font-medium text-white truncate">
                      {it.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mb-2">{it.date}</div>

                    <div className="text-[11px] uppercase tracking-wide text-slate-500 mt-1">
                      Análisis
                    </div>
                    <div className="text-[12px] text-slate-300 line-clamp-3 mb-2">
                      {it.analysis?.subject
                        ? `${it.analysis.subject} · ${it.analysis.setting}`
                        : "—"}
                    </div>

                    <div className="text-[11px] uppercase tracking-wide text-slate-500">
                      Prompt principal
                    </div>
                    <div className="mt-1 text-[12.5px] leading-relaxed text-slate-100 bg-black/30 rounded-lg p-2.5 ring-1 ring-white/5 max-h-56 overflow-auto">
                      {it.prompts.principal}
                    </div>

                    <button
                      onClick={() => copy(it.id, it.prompts.principal)}
                      className="mt-2 self-start inline-flex items-center gap-1.5 text-[12px] text-slate-300 hover:text-white"
                    >
                      {copied === it.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copiar
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="text-[12.5px] text-slate-500 py-8 text-center">
                    Sin resultados de {MODEL_LABEL[m]} todavía.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

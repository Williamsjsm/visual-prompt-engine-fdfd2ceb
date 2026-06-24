import { MODEL_LABEL, type AiModel } from "@/lib/prompt-store";

const styles: Record<AiModel, string> = {
  gpt: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  gem: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  both: "bg-gradient-to-r from-sky-500/20 to-emerald-500/20 text-white ring-white/20",
};

export function ModelBadge({ model, className = "" }: { model: AiModel; className?: string }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 " +
        styles[model] +
        " " +
        className
      }
    >
      {MODEL_LABEL[model]}
    </span>
  );
}

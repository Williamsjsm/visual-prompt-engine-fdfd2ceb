import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { UploadCard } from "@/components/dashboard/UploadCard";
import { AnalysisOptions } from "@/components/dashboard/AnalysisOptions";
import { ContentAnalysis } from "@/components/dashboard/ContentAnalysis";
import { PromptOutput } from "@/components/dashboard/PromptOutput";
import { HistoryStrip } from "@/components/dashboard/HistoryStrip";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prompt Generator — Genera prompts perfectos con IA" },
      {
        name: "description",
        content:
          "Sube imágenes o videos y obtén el prompt perfecto al instante. Análisis profundo, exportación y compatibilidad con Midjourney, Flux, Veo, Kling y más.",
      },
    ],
  }),
  component: DashboardPage,
});

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function DashboardPage() {
  return (
    <div className="min-h-screen w-full flex text-white">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 lg:px-6 pb-10 pt-2">
        <TopHeader />
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.18fr] gap-5">
          {/* Left column */}
          <div className="flex flex-col gap-5">
            <motion.div {...fade} transition={{ duration: 0.4 }}>
              <UploadCard />
            </motion.div>
            <motion.div {...fade} transition={{ duration: 0.4, delay: 0.08 }}>
              <AnalysisOptions />
            </motion.div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            <motion.div {...fade} transition={{ duration: 0.4, delay: 0.05 }}>
              <ContentAnalysis />
            </motion.div>
            <motion.div {...fade} transition={{ duration: 0.4, delay: 0.12 }}>
              <PromptOutput />
            </motion.div>
            <motion.div {...fade} transition={{ duration: 0.4, delay: 0.18 }}>
              <HistoryStrip />
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

import { motion } from "framer-motion";
import { UploadCard } from "@/components/dashboard/UploadCard";
import { AnalysisOptions } from "@/components/dashboard/AnalysisOptions";
import { ContentAnalysis } from "@/components/dashboard/ContentAnalysis";
import { PromptOutput } from "@/components/dashboard/PromptOutput";
import { HistoryStrip } from "@/components/dashboard/HistoryStrip";

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

export function GenerarPromptView() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.18fr] gap-5">
      <div className="flex flex-col gap-5">
        <motion.div {...fade} transition={{ duration: 0.4 }}>
          <UploadCard />
        </motion.div>
        <motion.div {...fade} transition={{ duration: 0.4, delay: 0.08 }}>
          <AnalysisOptions />
        </motion.div>
      </div>
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
  );
}

import { motion } from "framer-motion";
import {
  Upload,
  Clock,
  GitBranch,
  Archive,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  FileSearch
} from "lucide-react";

type IngestionStatus = "uploaded" | "queued" | "cloning" | "extracting" | "scanning" | "completed" | "failed" | string;

interface Stage {
  id: IngestionStatus;
  label: string;
  icon: typeof Upload;
  description: string;
}

const stages: Stage[] = [
  { id: "uploaded", label: "Uploaded", icon: Upload, description: "Codebase received" },
  { id: "queued", label: "Queued", icon: Clock, description: "Waiting for queue worker" },
  { id: "cloning", label: "Cloning", icon: GitBranch, description: "Fetching Git repository" },
  { id: "extracting", label: "Extracting", icon: Archive, description: "Decompressing ZIP package" },
  { id: "scanning", label: "Scanning", icon: Search, description: "Running AST parsing pipeline" },
  { id: "completed", label: "Completed", icon: CheckCircle2, description: "Analysis successful" }
];

interface ProgressTrackerProps {
  status: IngestionStatus;
  progress: number;
  jobId?: string | null;
  error?: string | null;
}

export default function ProgressTracker({
  status,
  progress,
  jobId,
  error
}: ProgressTrackerProps) {
  const currentStageIndex = stages.findIndex((s) => s.id === status);
  const isFailed = status === "failed";
  const isComplete = status === "completed";

  const getStageStatus = (stageId: IngestionStatus): "pending" | "active" | "completed" | "failed" => {
    if (isFailed) return "failed";
    const idx = stages.findIndex((s) => s.id === stageId);
    if (idx < currentStageIndex || isComplete) return "completed";
    if (idx === currentStageIndex) return "active";
    return "pending";
  };

  return (
    <div className="w-full max-w-[760px] mx-auto select-none">
      <div className="bg-[#131A1D] border border-white/[0.08] rounded-2xl p-6 sm:p-7 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-[18px] sm:text-[20px] font-bold text-[#F4F7F7] leading-tight">
              Analysis Pipeline
            </h3>
            <p className="text-[14px] text-[#B4C1C4] mt-1 font-normal">
              {isFailed
                ? "Pipeline execution failed"
                : isComplete
                ? "Intelligence pipeline complete!"
                : "Parsing codebase syntax trees..."}
            </p>
          </div>
          {jobId && (
            <div className="h-[30px] px-3 bg-[#111417] border border-white/[0.08] rounded-lg text-[11px] font-mono text-[#78858A] flex items-center justify-center shrink-0">
              Job: {jobId.slice(0, 10)}...
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-[12px] font-bold text-[#78858A] uppercase tracking-[0.1em]">
              PROGRESS
            </span>
            <span className="text-[13px] font-bold text-[#16C7A1]">{progress}%</span>
          </div>
          <div className="w-full h-[7px] bg-[#25282B] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#16C7A1] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
        </div>

        {/* Pipeline Vertical Timeline */}
        <div className="relative py-1 space-y-2">
          {/* Continuous vertical connector line */}
          <div className="absolute left-[19px] top-[20px] bottom-[20px] w-[1.5px] bg-[#16C7A1]/35 pointer-events-none z-0" />

          {stages.map((stage, index) => {
            const stageStatus = getStageStatus(stage.id);
            const isActive = stageStatus === "active";
            const isStageCompleted = stageStatus === "completed";

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`relative z-10 flex items-center gap-4 px-3 py-2 rounded-xl transition-colors duration-200 ${
                  isActive ? "bg-white/[0.025]" : "hover:bg-white/[0.015]"
                }`}
              >
                {/* Status Circle (40px x 40px) */}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 transition-colors ${
                    isStageCompleted
                      ? "border-[#16C7A1]/40 bg-[#16C7A1]/10 text-[#16C7A1]"
                      : isActive
                      ? "border-[#16C7A1]/60 bg-[#16C7A1]/15 text-[#16C7A1]"
                      : stageStatus === "failed"
                      ? "border-red-500/40 bg-red-500/10 text-red-400"
                      : "border-[#3A454B] bg-[#11181B] text-[#78858C]"
                  }`}
                >
                  {isStageCompleted ? (
                    <CheckCircle2 size={18} className="text-[#16C7A1]" />
                  ) : isActive ? (
                    <Loader2 size={18} className="animate-spin text-[#16C7A1]" />
                  ) : stageStatus === "failed" ? (
                    <XCircle size={18} className="text-red-400" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-[#53616A]" />
                  )}
                </div>

                {/* Step Details */}
                <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[15px] sm:text-[16px] font-semibold text-[#F4F7F7]">
                        {stage.label}
                      </span>
                      {isActive && (
                        <span className="h-[22px] px-2.5 rounded-full text-[11px] font-bold bg-[#16C7A1]/20 text-[#16C7A1] border border-[#16C7A1]/40 flex items-center shrink-0">
                          In Progress
                        </span>
                      )}
                      {isStageCompleted && (
                        <span className="h-[22px] px-2.5 rounded-full text-[11px] font-bold bg-[#16C7A1]/12 text-[#16C7A1]/90 border border-[#16C7A1]/25 flex items-center shrink-0">
                          Completed
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] sm:text-[13px] text-[#B0BEC1] mt-0.5 font-normal">
                      {stage.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* AST Checklist Section */}
        <div className="mt-6 pt-5 border-t border-white/[0.08]">
          <div className="flex items-center gap-2 mb-3">
            <FileSearch size={14} className="text-[#16C7A1]" />
            <h4 className="text-[12px] font-bold text-[#16C7A1] uppercase tracking-[0.08em]">
              AST ANALYSIS CHECKLIST
            </h4>
          </div>
          <div className="bg-[#11181B] border border-white/[0.08] rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-4">
            <CheckItem label="AST Parser Pipeline" isComplete={progress >= 70 || isComplete} isActive={status === "scanning" && progress < 70} />
            <CheckItem label="Framework Classifier" isComplete={progress >= 80 || isComplete} isActive={status === "scanning" && progress >= 70 && progress < 80} />
            <CheckItem label="Route Decorator Engine" isComplete={progress >= 90 || isComplete} isActive={status === "scanning" && progress >= 80 && progress < 90} />
            <CheckItem label="Static Import Graph" isComplete={isComplete || progress >= 98} isActive={status === "scanning" && progress >= 90} />
          </div>
        </div>

        {/* Error Display */}
        {isFailed && error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 p-4 rounded-xl bg-red-950/20 border border-red-900/50"
          >
            <div className="flex items-start gap-3">
              <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-red-400 font-semibold text-sm">Analysis Pipeline Failed</p>
                <p className="text-red-300/80 text-xs mt-1 leading-relaxed">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function CheckItem({ label, isComplete, isActive }: { label: string; isComplete?: boolean; isActive?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-[12px] sm:text-[13px] font-medium">
      {isComplete ? (
        <CheckCircle2 size={14} className="text-[#16C7A1] shrink-0" />
      ) : isActive ? (
        <Loader2 size={14} className="text-[#16C7A1] animate-spin shrink-0" />
      ) : (
        <div className="w-3.5 h-3.5 rounded-full border border-[#53616A] shrink-0" />
      )}
      <span className={isComplete || isActive ? "text-[#F4F7F7]" : "text-[#78858C]"}>
        {label}
      </span>
    </div>
  );
}
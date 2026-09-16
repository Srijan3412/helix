"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Layers,
  GitBranch,
  Package,
  FileSearch,
  Flag,
  Monitor,
  ListChecks,
  Activity,
  Check,
  XCircle,
  Loader2,
  LucideIcon
} from "lucide-react";

type IngestionStatus =
  | "uploaded"
  | "queued"
  | "cloning"
  | "extracting"
  | "scanning"
  | "completed"
  | "failed"
  | string;

interface Stage {
  id: IngestionStatus;
  label: string;
  icon: LucideIcon;
  description: string;
  defaultTime: string;
}

const stages: Stage[] = [
  {
    id: "uploaded",
    label: "Uploaded",
    icon: FileText,
    description: "Codebase received",
    defaultTime: "2s ago"
  },
  {
    id: "queued",
    label: "Queued",
    icon: Layers,
    description: "Waiting for queue worker",
    defaultTime: "6s ago"
  },
  {
    id: "cloning",
    label: "Cloning",
    icon: GitBranch,
    description: "Fetching Git repository",
    defaultTime: "18s ago"
  },
  {
    id: "extracting",
    label: "Extracting",
    icon: Package,
    description: "Decompressing ZIP package",
    defaultTime: "32s ago"
  },
  {
    id: "scanning",
    label: "Scanning",
    icon: FileSearch,
    description: "Running AST parsing pipeline",
    defaultTime: "active"
  },
  {
    id: "completed",
    label: "Completed",
    icon: Flag,
    description: "Analysis successful",
    defaultTime: "—"
  }
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

  const getStageStatus = (
    stageId: IngestionStatus
  ): "pending" | "active" | "completed" | "failed" => {
    if (isFailed) return "failed";
    const idx = stages.findIndex((s) => s.id === stageId);
    if (idx < currentStageIndex || isComplete) return "completed";
    if (idx === currentStageIndex) return "active";
    return "pending";
  };

  // Count completed stages for "X of Y steps"
  const completedStagesCount = stages.filter(
    (s) => getStageStatus(s.id) === "completed"
  ).length;
  const totalSteps = stages.length - 1; // 5 pipeline operational steps
  const displayStepCount = isComplete
    ? `${totalSteps} of ${totalSteps} steps`
    : `${Math.min(Math.max(completedStagesCount, 1), totalSteps)} of ${totalSteps} steps`;

  return (
    <div className="w-full max-w-[1000px] mx-auto select-none py-6 px-3 sm:px-4">
      <div className="bg-[#032C33]/95 border border-[#125B66]/60 rounded-[22px] p-6 sm:p-9 shadow-[0_25px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Red Code Branded Icon Container */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#EF394C] rounded-[18px] flex items-center justify-center shadow-lg shadow-[#EF394C]/25 shrink-0">
              <span className="text-white font-extrabold text-[22px] sm:text-[26px] font-mono tracking-tighter leading-none">
                &lt;/&gt;
              </span>
            </div>

            <div>
              <h2 className="text-[26px] sm:text-[32px] font-extrabold text-[#F4F8F8] tracking-tight leading-tight">
                Analysis Pipeline
              </h2>
              <p className="text-[14px] sm:text-[15px] text-[#7EA8AD] mt-0.5 font-normal">
                {isFailed
                  ? "Pipeline execution encountered an error"
                  : isComplete
                  ? "Codebase analysis completed successfully"
                  : "Parsing codebase syntax trees..."}
              </p>
            </div>
          </div>

          {/* Job Badge */}
          <div className="h-[38px] px-4 bg-[#063B43]/70 border border-[#146772]/70 rounded-xl text-xs sm:text-[13px] font-mono text-[#5CD0CC] flex items-center gap-2.5 shrink-0 self-start sm:self-auto shadow-inner">
            <Monitor size={16} className="text-[#5CD0CC] shrink-0" />
            <span className="text-[#7EA8AD]">Job:</span>
            <span className="text-[#F4F8F8] font-mono font-medium">
              {jobId ? `${jobId.slice(0, 10)}...` : "wup14bukk..."}
            </span>
          </div>
        </div>

        {/* ── Progress Section ───────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-end justify-between mb-2">
            <span className="text-xs sm:text-[13px] font-extrabold text-[#7EA8AD] uppercase tracking-[0.14em]">
              PROGRESS
            </span>
            <span className="text-2xl sm:text-[26px] font-black text-[#5CD0CC] leading-none">
              {progress}%
            </span>
          </div>

          {/* Capsule Progress Bar */}
          <div className="w-full h-[15px] sm:h-[16px] bg-[#073942] rounded-full overflow-hidden p-[1px] border border-[#0E4F5A]/40">
            <div
              className="h-full bg-[#5CD0CC] rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(92,208,204,0.45)]"
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>

          {/* Step Count */}
          <div className="text-right text-xs sm:text-[13px] font-medium text-[#7EA8AD] mt-1.5">
            {displayStepCount}
          </div>
        </div>

        {/* ── Pipeline Timeline ──────────────────────────────────── */}
        <div className="relative space-y-3.5 sm:space-y-4">
          {/* Continuous vertical connector line */}
          <div className="absolute left-[15px] sm:left-[17px] top-[26px] bottom-[26px] w-[2px] bg-[#114D56] pointer-events-none z-0" />

          {stages.map((stage, index) => {
            const stageStatus = getStageStatus(stage.id);
            const isActive = stageStatus === "active";
            const isStageCompleted = stageStatus === "completed";
            const IconComponent = stage.icon;

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="relative z-10 flex items-center gap-3.5 sm:gap-4.5"
              >
                {/* Timeline Node (Outside Card) */}
                <div className="shrink-0 flex items-center justify-center">
                  {isStageCompleted ? (
                    <div className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-full bg-[#EF394C] flex items-center justify-center shadow-md shadow-[#EF394C]/30 text-white">
                      <Check size={16} className="text-white stroke-[3.5]" />
                    </div>
                  ) : isActive ? (
                    <div className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-full border-[3px] border-[#5CD0CC] bg-[#032C33] flex items-center justify-center shadow-[0_0_14px_rgba(92,208,204,0.5)]">
                      <div className="w-2 h-2 rounded-full bg-[#5CD0CC] animate-ping" />
                    </div>
                  ) : stageStatus === "failed" ? (
                    <div className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-full bg-red-600 flex items-center justify-center text-white">
                      <XCircle size={16} className="text-white" />
                    </div>
                  ) : (
                    <div className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-full border-2 border-[#18515B] bg-[#032C33]" />
                  )}
                </div>

                {/* Step Card */}
                <div
                  className={`flex-1 rounded-[16px] transition-all duration-200 min-h-[72px] sm:min-h-[78px] flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border ${
                    isActive
                      ? "bg-[#B7E7E5] border-[#5CD0CC] text-[#05373F] shadow-[0_8px_24px_rgba(92,208,204,0.2)]"
                      : isStageCompleted
                      ? "bg-[#032C34]/65 border-[#10525C]/70 text-[#F4F8F8]"
                      : "bg-[#03282F]/40 border-[#0E424B]/50 text-[#DCE8EA] opacity-75"
                  }`}
                >
                  {/* Left: Icon + Name & Description */}
                  <div className="flex items-center gap-3.5 sm:gap-4.5 min-w-0">
                    {/* Icon Container */}
                    <div
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-[14px] flex items-center justify-center shrink-0 ${
                        isActive
                          ? "bg-[#5CD0CC] text-[#05373F] shadow-sm"
                          : isStageCompleted
                          ? "bg-[#FCEAEB] text-[#EF394C] shadow-sm"
                          : "bg-[#06333B] border border-[#0F434C] text-[#6A9196]"
                      }`}
                    >
                      <IconComponent
                        size={21}
                        className={isActive ? "stroke-[2.5]" : "stroke-[2]"}
                      />
                    </div>

                    <div className="min-w-0">
                      <h4
                        className={`text-[16px] sm:text-[18px] font-bold leading-tight ${
                          isActive ? "text-[#05373F]" : "text-[#F4F8F8]"
                        }`}
                      >
                        {stage.label}
                      </h4>
                      <p
                        className={`text-xs sm:text-[13px] mt-0.5 truncate font-normal ${
                          isActive
                            ? "text-[#125862] font-semibold"
                            : isStageCompleted
                            ? "text-[#7EA8AD]"
                            : "text-[#5C8287]"
                        }`}
                      >
                        {stage.description}
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Status Badge + Timestamp / Indicator */}
                  <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                    {/* Status Badge */}
                    {isStageCompleted && (
                      <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#073E47] text-[#5CD0CC] border border-[#135E6A]/50">
                        Completed
                      </span>
                    )}
                    {isActive && (
                      <span className="px-3.5 py-1 rounded-full text-xs font-extrabold bg-[#5CD0CC] text-[#05373F] shadow-sm">
                        In Progress
                      </span>
                    )}
                    {stageStatus === "pending" && (
                      <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-[#062F36] text-[#6A9196] border border-[#0E424B]">
                        Pending
                      </span>
                    )}
                    {stageStatus === "failed" && (
                      <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-red-950/60 text-red-300 border border-red-800/60">
                        Failed
                      </span>
                    )}

                    {/* Timestamp / Active Dots */}
                    <div className="w-[60px] sm:w-[70px] text-right flex justify-end">
                      {isActive ? (
                        <div className="flex items-center gap-1.5 py-1">
                          <span className="w-2 h-2 rounded-full bg-[#125862] animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-2 h-2 rounded-full bg-[#125862] animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-2 h-2 rounded-full bg-[#125862] animate-bounce" />
                        </div>
                      ) : isStageCompleted ? (
                        <span className="text-xs sm:text-[13px] font-medium text-[#7EA8AD] font-mono">
                          {stage.defaultTime}
                        </span>
                      ) : (
                        <span className="text-xs sm:text-[13px] text-[#486B70]">
                          —
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── AST Analysis Checklist Section ─────────────────────── */}
        <div className="bg-[#02262C]/90 border border-[#10525C]/70 rounded-[18px] p-4 sm:p-5 mt-7">
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#0F4A53]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#EF394C] flex items-center justify-center text-white shrink-0 shadow-sm">
                <ListChecks size={18} className="stroke-[2.5]" />
              </div>
              <h3 className="text-xs sm:text-[13px] font-extrabold text-[#DCE8EA] uppercase tracking-[0.09em]">
                AST ANALYSIS CHECKLIST
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <Activity size={18} className="text-[#EF394C] animate-pulse shrink-0" />
              <span className="text-xs sm:text-[13px] font-medium text-[#7EA8AD]">
                Running analysis...
              </span>
            </div>
          </div>

          {/* 2-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 sm:gap-y-4 gap-x-8 pt-3.5 px-1 sm:px-2">
            <ChecklistItem
              label="AST Parser Pipeline"
              isComplete={progress >= 70 || isComplete}
              isActive={status === "scanning" && progress < 70}
            />
            <ChecklistItem
              label="Framework Classifier"
              isComplete={progress >= 80 || isComplete}
              isActive={status === "scanning" && progress >= 70 && progress < 80}
            />
            <ChecklistItem
              label="Route Decorator Engine"
              isComplete={progress >= 90 || isComplete}
              isActive={status === "scanning" && progress >= 80 && progress < 90}
            />
            <ChecklistItem
              label="Static Import Graph"
              isComplete={isComplete || progress >= 98}
              isActive={status === "scanning" && progress >= 90}
            />
          </div>
        </div>

        {/* Error Display */}
        {isFailed && error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-xl bg-red-950/30 border border-red-800/60"
          >
            <div className="flex items-start gap-3">
              <XCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-red-300 font-semibold text-sm">
                  Analysis Pipeline Failed
                </p>
                <p className="text-red-300/80 text-xs mt-1 leading-relaxed">
                  {error}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function ChecklistItem({
  label,
  isComplete,
  isActive
}: {
  label: string;
  isComplete?: boolean;
  isActive?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {isComplete ? (
        <div className="w-5 h-5 rounded-full bg-[#EF394C] flex items-center justify-center text-white shrink-0 shadow-sm">
          <Check size={12} className="stroke-[3.5]" />
        </div>
      ) : isActive ? (
        <div className="w-5 h-5 rounded-full border-2 border-[#5CD0CC] bg-[#032C33] flex items-center justify-center shrink-0">
          <div className="w-2 h-2 rounded-full bg-[#5CD0CC] animate-ping" />
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-[#164F58] bg-[#02262C] shrink-0" />
      )}
      <span
        className={`text-[14px] leading-tight ${
          isComplete || isActive
            ? "text-[#F4F8F8] font-bold"
            : "text-[#6A9196] font-medium"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
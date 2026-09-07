import React from "react";
import { motion } from "framer-motion";
import { FileCode, ArrowRight, ChevronRight, File } from "lucide-react";

interface RelatedFilesProps {
  files?: Array<{ path: string; lineCount?: number }>;
  onViewAll?: () => void;
  onSelectFile?: (file: string) => void;
}

export default function RelatedFiles({
  files = [],
  onViewAll,
  onSelectFile,
}: RelatedFilesProps) {
  // Key configuration and core files
  const displayFiles = React.useMemo(() => {
    if (files && files.length > 0) {
      const priority = files.filter((f) => {
        const p = f.path.toLowerCase();
        return (
          p.includes("workflow") ||
          p.includes("docker") ||
          p.includes("config") ||
          p.includes("package.json") ||
          p.includes(".env") ||
          p.includes(".gitignore") ||
          p.endsWith(".ts") ||
          p.endsWith(".tsx") ||
          p.endsWith(".js")
        );
      });
      if (priority.length > 0) {
        return priority.slice(0, 3).map((f) => f.path);
      }
      return files.slice(0, 3).map((f) => f.path);
    }
    return [".github/workflows/ci.yml", ".gitignore", "package.json"];
  }, [files]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.24 }}
      className="w-full rounded-[16px] bg-[rgba(8,70,80,0.75)] backdrop-blur-md border border-[rgba(155,232,224,0.18)] p-5 relative overflow-hidden shadow-md text-left flex flex-col justify-between min-h-[220px] sm:min-h-[235px]"
    >
      <div>
        {/* ── Top Header: Document Icon + Title + View All Button ── */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#084C58] text-[#9BE8E0] flex items-center justify-center shrink-0 shadow-xs">
              <FileCode size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-[15px] font-bold text-[#F7FAFA] leading-snug uppercase tracking-wider">
                Related Files
              </h3>
              <p className="text-[11px] text-[#C3D5D8] leading-tight">
                Key configuration and core repository files.
              </p>
            </div>
          </div>

          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-[#9BE8E0] hover:text-white flex items-center gap-1 transition shrink-0 cursor-pointer"
          >
            View All <ArrowRight size={12} />
          </button>
        </div>

        {/* ── Files List ── */}
        <div className="space-y-2 mt-2">
          {displayFiles.map((file, idx) => (
            <div
              key={idx}
              onClick={() => onSelectFile?.(file)}
              className="flex items-center justify-between gap-3 py-1.5 px-3 rounded-[8px] bg-[rgba(6,47,56,0.60)] border border-[rgba(155,232,224,0.08)] hover:border-[rgba(155,232,224,0.25)] hover:bg-[rgba(8,76,88,0.75)] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <File size={14} className="text-[#9BE8E0] shrink-0" />
                <span className="text-xs font-mono text-[#E1F1F3] truncate group-hover:text-white">
                  {file}
                </span>
              </div>

              <ChevronRight size={14} className="text-[#8EA9AE] group-hover:text-[#9BE8E0] group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

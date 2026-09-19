"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FileCode,
  FileSpreadsheet,
  FileArchive,
  ChevronRight,
  ArrowRight,
  GitBranch,
} from "lucide-react";

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
  // Key configuration and core files matching exact specification & 2nd screenshot
  const displayFiles = React.useMemo(() => {
    return [
      {
        path: ".github/workflows/ci.yml",
        subtitle: "CI/CD configuration",
        icon: GitBranch,
        iconBoxClass: "bg-[#16C7B7]/15 border border-[#16C7B7]/30 text-[#16C7B7]",
      },
      {
        path: ".gitignore",
        subtitle: "Git ignore rules",
        icon: FileSpreadsheet,
        iconBoxClass: "bg-[#8EB5B8]/15 border border-[#8EB5B8]/30 text-[#8EB5B8]",
      },
      {
        path: "backend/Dockerfile",
        subtitle: "Docker configuration",
        icon: FileArchive,
        iconBoxClass: "bg-[#19D3D8]/15 border border-[#19D3D8]/30 text-[#19D3D8]",
      },
    ];
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.14 }}
      className="w-full rounded-[20px] bg-[#074A52] border border-[#126873] p-5 sm:p-6 shadow-sm text-left flex flex-col justify-between h-auto min-h-0 space-y-4"
    >
      {/* ── Point 8: Header with 64x64px Turquoise Icon Tile + View All Button ── */}
      <div className="flex items-center justify-between gap-3 pb-1">
        {/* Left: 64x64px Turquoise Tile + Title + Subtitle */}
        <div className="flex items-center gap-3.5">
          {/* Turquoise Icon Tile (bg #16C7B7, white icon, radius 14px, shadow) */}
          <div className="w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] rounded-[14px] bg-[#16C7B7] shadow-md shadow-[#16C7B7]/25 text-white flex items-center justify-center shrink-0">
            <FileCode className="w-7 h-7 sm:w-8 sm:h-8 text-white stroke-[2.4]" />
          </div>

          <div>
            <h2 className="text-xl sm:text-[24px] lg:text-[26px] font-extrabold text-[#F4F7F7] tracking-tight leading-tight uppercase">
              Related Files
            </h2>
            <p className="text-xs sm:text-[14px] text-[#8EB5B8] mt-0.5 leading-snug">
              Key configuration and core repository files.
            </p>
          </div>
        </div>

        {/* View All Button */}
        <button
          onClick={onViewAll}
          className="h-[40px] sm:h-[44px] px-3.5 sm:px-4.5 rounded-[12px] bg-[#063942] hover:bg-[#16C7B7] border border-[#126873] hover:border-[#16C7B7] text-[#16C7B7] hover:text-[#063E45] text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs shrink-0 group"
        >
          <span>View All</span>
          <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform stroke-[2.4]" />
        </button>
      </div>

      {/* ── Points 9 & 10: File Information Rows with Title, Subtitle, Semantic Icon & Arrow ── */}
      <div className="space-y-2.5">
        {displayFiles.map((fileObj, idx) => {
          const FileIconComponent = fileObj.icon;

          return (
            <div
              key={idx}
              onClick={() => onSelectFile?.(fileObj.path)}
              className="p-3 sm:px-4 sm:py-3.5 rounded-[14px] bg-[#06353D] hover:bg-[#09515A] border border-[#126873]/50 hover:border-[#16C7B7]/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
            >
              {/* Left: Distinct File Icon Box + Path & Secondary Description */}
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                {/* Rounded Icon Box */}
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] flex items-center justify-center shrink-0 shadow-xs ${fileObj.iconBoxClass}`}
                >
                  <FileIconComponent size={18} className="stroke-[2.4]" />
                </div>

                {/* Text Details (Point 9) */}
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-[13.5px] font-bold font-mono text-[#F4F7F7] truncate leading-tight group-hover:text-white">
                    {fileObj.path}
                  </div>
                  <div className="text-[11px] sm:text-[11.5px] text-[#8EB5B8] truncate mt-0.5 leading-tight">
                    {fileObj.subtitle}
                  </div>
                </div>
              </div>

              {/* Right: Chevron Navigation Arrow */}
              <ChevronRight
                size={16}
                className="text-[#8EB5B8] group-hover:text-[#16C7B7] group-hover:translate-x-0.5 transition-all shrink-0"
              />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

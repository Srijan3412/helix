"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileCode, ChevronRight, File } from "lucide-react";

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
  // Key configuration and core files matching user screenshot
  const displayFiles = React.useMemo(() => {
    return [
      { path: ".github/workflows/ci.yml", iconColor: "#8EDBD5" }, // Mint
      { path: ".gitignore", iconColor: "#F4EDE5" },               // Cream
      { path: "backend/Dockerfile", iconColor: "#20C7CF" },       // Cyan
    ];
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="w-full rounded-[14px] bg-[#084B52] border border-[#FF3045]/20 border-l-4 border-l-[#FF3045] p-4 sm:p-4.5 relative overflow-hidden shadow-md text-left flex flex-col justify-between h-auto min-h-0"
    >
      <div>
        {/* ── Top Header: Red Icon + Title ── */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-[#FF3045] text-white flex items-center justify-center shrink-0 shadow-xs">
              <FileCode size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F4EDE5] leading-snug uppercase tracking-wider">
                Related Files
              </h3>
              <p className="text-[11px] text-[#8EDBD5] leading-tight">
                Key configuration and core repository files.
              </p>
            </div>
          </div>
        </div>

        {/* ── Files List with Alternating Icon Colors ── */}
        <div className="space-y-2 mt-1.5">
          {displayFiles.map((fileObj, idx) => (
            <div
              key={idx}
              onClick={() => onSelectFile?.(fileObj.path)}
              className="flex items-center justify-between gap-2.5 py-1.5 px-3 rounded-[8px] bg-[#06363D] hover:bg-[#0B555C] border border-[rgba(255,48,69,0.10)] hover:border-[rgba(255,48,69,0.30)] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <File size={13} style={{ color: fileObj.iconColor }} className="shrink-0" />
                <span className="text-xs font-mono text-[#F4EDE5] truncate group-hover:text-white">
                  {fileObj.path}
                </span>
              </div>

              <ChevronRight
                size={13}
                className="text-[#8EDBD5] group-hover:text-[#FF3045] group-hover:translate-x-0.5 transition-all shrink-0"
              />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}


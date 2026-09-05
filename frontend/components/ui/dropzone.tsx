import React, { useState } from "react";
import { UploadCloud, FileArchive, CheckCircle2, X } from "lucide-react";

interface FileDropzoneProps {
  onFileDrop: (file: File) => void;
  selectedFile?: File | null;
  onClearFile?: () => void;
  disabled?: boolean;
  className?: string;
  maxSizeBytes?: number;
}

export function FileDropzone({
  onFileDrop,
  selectedFile,
  onClearFile,
  disabled = false,
  className = "",
  maxSizeBytes = 200 * 1024 * 1024 // 200MB default limit
}: FileDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);

  const validateAndPassFile = (file: File) => {
    setDropError(null);
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setDropError("Only .zip compressed archives are supported.");
      return;
    }
    if (file.size > maxSizeBytes) {
      setDropError(`File exceeds maximum size limit of ${(maxSizeBytes / 1024 / 1024).toFixed(0)}MB.`);
      return;
    }
    onFileDrop(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndPassFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndPassFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl py-8 px-6 text-center transition-all duration-300 relative overflow-hidden flex flex-col items-center justify-center ${
          dragActive
            ? "border-primary bg-primary/10 shadow-lg shadow-primary/10 scale-[1.01]"
            : selectedFile
            ? "border-emerald-500/60 bg-emerald-500/5"
            : "border-zinc-700/80 bg-zinc-900/40 hover:border-zinc-500 hover:bg-zinc-900/60"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
      >
        <input
          type="file"
          id="zip-file-upload"
          className="hidden"
          accept=".zip,application/zip,application/x-zip-compressed"
          onChange={handleFileChange}
          disabled={disabled}
        />

        {selectedFile ? (
          <div className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/70 shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <FileArchive className="text-emerald-400" size={20} />
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-bold text-white truncate max-w-xs md:max-w-md">
                  {selectedFile.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 size={11} /> Ready
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    • {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>
            </div>

            {onClearFile && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearFile();
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700/60 transition"
                title="Remove file"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ) : (
          <label htmlFor="zip-file-upload" className="w-full cursor-pointer flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mb-3 shadow-inner transition duration-300">
              <UploadCloud className="w-7 h-7 text-primary transition duration-300" />
            </div>
            <p className="text-sm text-zinc-200 font-bold mb-1">
              Drag and drop your repository ZIP here
            </p>
            <p className="text-xs text-zinc-400">
              or <span className="text-primary font-semibold hover:underline">browse from your computer</span>
            </p>
            <span className="text-[10px] text-zinc-500 mt-2 font-mono">
              Maximum archive size: {(maxSizeBytes / 1024 / 1024).toFixed(0)}MB (.zip)
            </span>
          </label>
        )}
      </div>

      {dropError && (
        <p className="text-xs text-red-400 mt-2 font-medium flex items-center gap-1">
          ⚠️ {dropError}
        </p>
      )}
    </div>
  );
}
export default FileDropzone;

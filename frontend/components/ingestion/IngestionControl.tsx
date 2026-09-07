import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Github,
  Upload,
  FolderOpen,
  Link,
  FileArchive,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { FileDropzone } from "../ui/dropzone";

type TabId = "github" | "zip" | "local";

interface TabConfig {
  id: TabId;
  label: string;
  icon: typeof Github;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: "github",
    label: "GitHub URL",
    icon: Github,
    description: "Clone a public or private repository",
  },
  {
    id: "zip",
    label: "ZIP Archive",
    icon: FileArchive,
    description: "Upload and extract a codebase archive",
  },
  {
    id: "local",
    label: "Local Directory",
    icon: FolderOpen,
    description: "Scan a local filesystem path",
  },
];

interface IngestionControlProps {
  onSubmitGithub: (url: string) => void;
  onSubmitZip: (file: File) => void;
  onSubmitLocal: (path: string) => void;
  isLoading: boolean;
  error: string | null;
  isLimitReached?: boolean;
}

export default function IngestionControl({
  onSubmitGithub,
  onSubmitZip,
  onSubmitLocal,
  isLoading,
  error,
  isLimitReached = false,
}: IngestionControlProps) {
  const [activeTab, setActiveTab] = useState<TabId>("github");
  const [githubUrl, setGithubUrl] = useState("https://github.com/Srijan3412/helix.git");
  const [localPath, setLocalPath] = useState("c:\\Users\\91798\\Documents\\New folder (3)");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (isLoading || isLimitReached) return;

      if (activeTab === "github" && githubUrl.trim()) {
        onSubmitGithub(githubUrl.trim());
      } else if (activeTab === "local" && localPath.trim()) {
        onSubmitLocal(localPath.trim());
      } else if (activeTab === "zip" && selectedFile) {
        onSubmitZip(selectedFile);
      }
    },
    [activeTab, githubUrl, localPath, selectedFile, onSubmitGithub, onSubmitZip, onSubmitLocal, isLoading, isLimitReached]
  );

  const handleFileDrop = (file: File) => {
    if (isLimitReached) return;
    setSelectedFile(file);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="w-full max-w-[1000px] sm:max-w-[1040px] mx-auto space-y-5 text-left">
      {/* ── Scan Limit Alert Banner (if limit reached) ────────────── */}
      {isLimitReached && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-[rgba(255,51,68,0.12)] border border-[rgba(255,51,68,0.35)] flex items-center justify-between gap-3 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[rgba(255,51,68,0.20)] border border-[rgba(255,51,68,0.35)] flex items-center justify-center shrink-0">
              <AlertCircle size={20} className="text-[#FF4D5E]" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#FF4D5E]">
                Scan Limit Reached
              </div>
              <div className="text-xs sm:text-sm text-[#C3D5D8] mt-0.5">
                You have reached your limit of available repository scans for your current plan.
              </div>
            </div>
          </div>
          <button
            onClick={() => (window.location.href = "/contact-sales")}
            className="px-4 py-2 rounded-lg bg-[#FF3344] hover:bg-[#ff4d5e] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#FF3344]/25 transition cursor-pointer shrink-0"
          >
            Upgrade Plan
          </button>
        </motion.div>
      )}

      {/* ── Source Selector Tabs (Height: 60-64px) ─────────────────── */}
      <div className="flex justify-center bg-[rgba(4,42,52,0.75)] p-1.5 rounded-[16px] border border-[rgba(155,232,224,0.18)] max-w-md sm:max-w-lg mx-auto backdrop-blur-md shadow-lg h-14 sm:h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2.5 px-3 rounded-[12px] text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer h-full ${
                isActive
                  ? "bg-[#9BE8E0] text-[#063D48] font-bold shadow-md shadow-[#9BE8E0]/20"
                  : "text-[#C3D5D8] hover:text-white hover:bg-[rgba(155,232,224,0.06)]"
              }`}
            >
              <Icon size={16} className={isActive ? "text-[#063D48]" : "text-[#8EA9AE]"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Repository Input Panel ────────────────────────────────── */}
      <div
        className={`bg-[rgba(5,48,58,0.82)] border border-[rgba(155,232,224,0.18)] rounded-[20px] sm:rounded-[24px] p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition-all ${
          isLimitReached ? "opacity-75 border-amber-500/20" : ""
        }`}
      >
        <AnimatePresence mode="wait">
          {/* GitHub Tab */}
          {activeTab === "github" && (
            <motion.div
              key="github"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3.5 mb-1">
                <div className="w-12 h-12 rounded-[14px] bg-[rgba(22,199,161,0.15)] border border-[rgba(22,199,161,0.30)] text-[#16C7A1] flex items-center justify-center shrink-0">
                  <Link size={20} className="text-[#16C7A1]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#F7FAFA] text-base sm:text-lg">Repository URL</h3>
                  <p className="text-xs sm:text-sm text-[#C3D5D8] mt-0.5">
                    Enter a GitHub repository URL to clone and analyze
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8EA9AE] pointer-events-none">
                    <Github className="w-5 h-5" />
                  </div>
                  <input
                    id="repo-url-input"
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/owner/repository"
                    required
                    disabled={isLoading || isLimitReached}
                    className="w-full h-14 sm:h-16 pl-12 pr-4 rounded-[12px] bg-[rgba(4,42,52,0.70)] border border-[rgba(155,232,224,0.25)] focus:border-[#16C7A1] focus:outline-hidden text-[#F7FAFA] placeholder:text-[#8EA9AE] text-sm sm:text-base font-medium shadow-inner transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!githubUrl.trim() || isLimitReached || isLoading}
                  className="h-14 sm:h-16 px-7 sm:px-9 rounded-[12px] bg-[#63E0D0] hover:bg-[#7cf2e3] text-[#063D48] font-bold text-sm sm:text-base shadow-md shadow-[#63E0D0]/20 flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group active:translate-y-[1px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5 text-[#063D48]" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <span>{isLimitReached ? "Limit Reached" : "Analyze Repo"}</span>
                      <ArrowRight className="w-5 h-5 text-[#063D48] group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs sm:text-sm text-[#C3D5D8] flex items-center gap-2 pt-1">
                <CheckCircle2 size={16} className="text-[#16C7A1] shrink-0" />
                <span>Supports public and private repositories with automatic token authentication.</span>
              </p>
            </motion.div>
          )}

          {/* ZIP Upload Tab */}
          {activeTab === "zip" && (
            <motion.div
              key="zip"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3.5 mb-1">
                <div className="w-12 h-12 rounded-[14px] bg-[rgba(22,199,161,0.15)] border border-[rgba(22,199,161,0.30)] text-[#16C7A1] flex items-center justify-center shrink-0">
                  <Upload size={20} className="text-[#16C7A1]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#F7FAFA] text-base sm:text-lg">
                    Upload Codebase Archive
                  </h3>
                  <p className="text-xs sm:text-sm text-[#C3D5D8] mt-0.5">
                    Drag and drop or browse a compressed .ZIP repository archive
                  </p>
                </div>
              </div>

              <FileDropzone
                onFileDrop={handleFileDrop}
                selectedFile={selectedFile}
                onClearFile={handleClearFile}
                disabled={isLoading || isLimitReached}
              />

              {/* Start Analysis Button for ZIP */}
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!selectedFile || isLoading || isLimitReached}
                className="w-full h-14 sm:h-16 px-6 rounded-[12px] bg-[#63E0D0] hover:bg-[#7cf2e3] text-[#063D48] font-bold text-sm sm:text-base shadow-md shadow-[#63E0D0]/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group active:translate-y-[1px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5 text-[#063D48]" />
                    <span>Uploading & Extracting...</span>
                  </>
                ) : (
                  <>
                    <Zap size={18} className="text-[#063D48]" />
                    <span>Start ZIP Architecture Analysis</span>
                    <ArrowRight size={18} className="text-[#063D48] group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs sm:text-sm text-[#C3D5D8] pt-1">
                <span className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#16C7A1]" />
                  Protected against Zip-Slip & decompression attacks
                </span>
                <span className="text-[#8EA9AE]">Max 200MB</span>
              </div>
            </motion.div>
          )}

          {/* Local Directory Tab */}
          {activeTab === "local" && (
            <motion.div
              key="local"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3.5 mb-1">
                <div className="w-12 h-12 rounded-[14px] bg-[rgba(22,199,161,0.15)] border border-[rgba(22,199,161,0.30)] text-[#16C7A1] flex items-center justify-center shrink-0">
                  <FolderOpen size={20} className="text-[#16C7A1]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#F7FAFA] text-base sm:text-lg">
                    Local Directory Scan
                  </h3>
                  <p className="text-xs sm:text-sm text-[#C3D5D8] mt-0.5">
                    Scan an uncompressed project directory from your local filesystem
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8EA9AE] pointer-events-none">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={localPath}
                    onChange={(e) => setLocalPath(e.target.value)}
                    placeholder="e.g. C:\projects\my-app or /home/user/my-app"
                    required
                    disabled={isLoading || isLimitReached}
                    className="w-full h-14 sm:h-16 pl-12 pr-4 rounded-[12px] bg-[rgba(4,42,52,0.70)] border border-[rgba(155,232,224,0.25)] focus:border-[#16C7A1] focus:outline-hidden text-[#F7FAFA] placeholder:text-[#8EA9AE] text-sm sm:text-base font-medium shadow-inner transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!localPath.trim() || isLimitReached || isLoading}
                  className="h-14 sm:h-16 px-7 sm:px-9 rounded-[12px] bg-[#63E0D0] hover:bg-[#7cf2e3] text-[#063D48] font-bold text-sm sm:text-base shadow-md shadow-[#63E0D0]/20 flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group active:translate-y-[1px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5 text-[#063D48]" />
                      <span>Scanning...</span>
                    </>
                  ) : (
                    <>
                      <span>{isLimitReached ? "Limit Reached" : "Scan Directory"}</span>
                      <ArrowRight className="w-5 h-5 text-[#063D48] group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs sm:text-sm text-[#C3D5D8] flex items-center gap-2 pt-1">
                <CheckCircle2 size={16} className="text-[#16C7A1] shrink-0" />
                <span>Direct AST parsing from local source tree without uploading files.</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

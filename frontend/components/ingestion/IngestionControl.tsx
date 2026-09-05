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
  Zap
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
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
    description: "Clone a public or private repository"
  },
  {
    id: "zip",
    label: "ZIP Archive",
    icon: FileArchive,
    description: "Upload and extract a codebase archive"
  },
  {
    id: "local",
    label: "Local Directory",
    icon: FolderOpen,
    description: "Scan a local filesystem path"
  }
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
  isLimitReached = false
}: IngestionControlProps) {
  const [activeTab, setActiveTab] = useState<TabId>("github");
  const [githubUrl, setGithubUrl] = useState("");
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

  const isValid = () => {
    if (isLimitReached) return false;
    if (activeTab === "github") return githubUrl.trim().length > 0;
    if (activeTab === "local") return localPath.trim().length > 0;
    if (activeTab === "zip") return selectedFile !== null;
    return false;
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Scan Limit Alert */}
      {isLimitReached && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <AlertCircle size={18} className="text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-amber-200">
                Scan Limit Reached
              </div>
              <div className="text-xs text-amber-300/80">
                You have used all available repository scans for your plan.
              </div>
            </div>
          </div>
          <button
            onClick={() => (window.location.href = "/contact-sales")}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 text-xs font-extrabold hover:shadow-lg hover:shadow-amber-500/20 transition cursor-pointer shrink-0"
          >
            Upgrade Plan
          </button>
        </motion.div>
      )}

      {/* Tab Header Selector */}
      <div className="flex justify-center bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800/80 max-w-md mx-auto backdrop-blur-md shadow-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all duration-300 ${
                isActive
                  ? "bg-primary text-zinc-950 shadow-lg font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Area */}
      <div
        className={`bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl transition-all ${
          isLimitReached ? "opacity-70 border-amber-500/20" : ""
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
              className="space-y-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center">
                  <Link className="text-primary" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Repository URL</h3>
                  <p className="text-xs text-zinc-400">
                    Enter a GitHub repository URL to clone and analyze
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/owner/repository"
                    icon={<Github className="w-5 h-5 text-zinc-500" />}
                    required
                    disabled={isLoading || isLimitReached}
                  />
                </div>
                <Button
                  type="submit"
                  isLoading={isLoading}
                  disabled={!githubUrl.trim() || isLimitReached}
                  className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20"
                >
                  {isLimitReached ? "Limit Reached" : "Analyze Repo"}
                </Button>
              </form>

              <p className="text-[10.5px] text-zinc-500 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-primary" />
                Supports public and private repositories with automatic token authentication.
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
              className="space-y-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center">
                  <Upload className="text-primary" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Upload Codebase Archive</h3>
                  <p className="text-xs text-zinc-400">
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
                className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-500/20 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Uploading & Extracting Archive...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} className="text-amber-300" />
                    <span>Start ZIP Architecture Analysis</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[10.5px] text-zinc-500 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-400" />
                  Protected against Zip-Slip & decompression attacks
                </span>
                <span>Max 200MB</span>
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
              className="space-y-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center">
                  <FolderOpen className="text-primary" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Local Directory Scan</h3>
                  <p className="text-xs text-zinc-400">
                    Scan an uncompressed project directory from your local filesystem
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    type="text"
                    value={localPath}
                    onChange={(e) => setLocalPath(e.target.value)}
                    placeholder="c:\Users\..."
                    icon={<FolderOpen className="w-5 h-5 text-zinc-500" />}
                    required
                    disabled={isLoading || isLimitReached}
                  />
                </div>
                <Button
                  type="submit"
                  isLoading={isLoading}
                  disabled={!localPath.trim() || isLimitReached}
                  className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20"
                >
                  {isLimitReached ? "Limit Reached" : "Scan Directory"}
                </Button>
              </form>

              <p className="text-[10px] text-zinc-500 italic">
                Local scanning requires read permissions for the specified directory path.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-xl bg-red-950/30 border border-red-900/60 flex items-start gap-3"
          >
            <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
            <div>
              <p className="text-red-400 font-semibold text-xs uppercase tracking-wider">
                Ingestion Error
              </p>
              <p className="text-red-300/90 text-xs mt-0.5">{error}</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

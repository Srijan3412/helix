"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  History, 
  GitCompare, 
  Trash2, 
  Eye, 
  Calendar, 
  Code, 
  Database,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles
} from "lucide-react";
import { useSubscription } from "../../lib/subscription/SubscriptionContext";
import { getScanHistory, adminDeleteScan } from "../../lib/api/client";
import { useAuth } from "../../hooks/useAuth";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import type { ScanSession } from "@shared/types";
import ScanComparison from "../../components/ScanComparison";

export default function ScanHistoryPage() {
  const router = useRouter();
  const { session } = useSubscription();
  const user = session?.user;
  
  const [scans, setScans] = useState<ScanSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedScans, setSelectedScans] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const { isAdmin } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingScan, setDeletingScan] = useState<ScanSession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const loadScanHistory = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      if (!user) return;
      const history = await getScanHistory(user.id);
      setScans(history);
    } catch (error) {
      console.error("Failed to load scan history:", error);
      setLoadError(error instanceof Error ? error.message : "Failed to load scan history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadScanHistory();
    }
  }, [user]);

  const handleDeleteClick = (scan: ScanSession) => {
    setDeletingScan(scan);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingScan) return;

    setIsDeleting(true);
    try {
      await adminDeleteScan(deletingScan.id);
      setScans(scans.filter(s => s.id !== deletingScan.id));
      setSelectedScans(selectedScans.filter(id => id !== deletingScan.id));
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Failed to delete scan:", error);
    } finally {
      setIsDeleting(false);
      setDeletingScan(null);
    }
  };

  const handleViewScan = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Save jobId in analysis store or just navigate back to dashboard with the jobId
    if (typeof window !== "undefined") {
      sessionStorage.setItem("active-job-id", jobId);
    }
    router.push("/");
  };

  const toggleSelect = (sessionId: string) => {
    setSelectedScans(prev => {
      if (prev.includes(sessionId)) {
        return prev.filter(id => id !== sessionId);
      }
      if (prev.length >= 2) return prev;
      return [...prev, sessionId];
    });
  };

  const handleCompare = () => {
    if (selectedScans.length !== 2) return;
    setShowComparison(true);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0f] text-zinc-400 px-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold text-white">Authentication Required</h3>
        <p className="text-sm text-zinc-500 mt-1 mb-4 text-center max-w-xs">
          Please sign in to view your repository scan history.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-primary text-background rounded-xl font-semibold text-xs tracking-wide transition-all hover:opacity-90"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060a] text-zinc-300">
      {/* Premium Header */}
      <div className="border-b border-border/20 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="p-2 hover:bg-zinc-900 rounded-xl transition text-zinc-400 hover:text-white mr-2"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-25" />
              <div className="relative bg-zinc-900 p-2 rounded-xl border border-zinc-800">
                <History className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div>
              <p className="dash-eyebrow text-emerald-400">SCAN ARCHIVE</p>
              <h1 className="dash-title text-white">Scan History</h1>
              <p className="dash-subtitle text-zinc-400">View, manage, and compare past repository scans</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedScans.length === 2 && !showComparison && (
              <motion.button
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={handleCompare}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg dash-btn-sm shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 hover:opacity-95 transition"
              >
                <GitCompare className="w-3.5 h-3.5" />
                Compare Selected
              </motion.button>
            )}
            {showComparison && (
              <button
                onClick={() => {
                  setShowComparison(false);
                  setSelectedScans([]);
                }}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg dash-btn-sm transition"
              >
                Back to History
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-6xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {showComparison ? (
            <motion.div
              key="comparison"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-zinc-950/40 border border-border/20 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between border-b border-border/20 pb-4 mb-6">
                <div>
                  <h2 className="dash-section-heading text-white flex items-center gap-2 uppercase">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Comparison Report
                  </h2>
                  <p className="dash-metadata text-zinc-500">Structural delta analysis between code commits</p>
                </div>
              </div>
              <ScanComparison 
                baselineId={selectedScans[0]} 
                compareId={selectedScans[1]} 
              />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {loadError ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-rose-900/40 rounded-2xl bg-rose-950/10 mt-8 mx-auto max-w-xl text-center">
                  <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-rose-300">Failed to load scan history</h3>
                  <p className="text-xs text-zinc-500 mt-1 mb-4 max-w-sm">{loadError}</p>
                  <button
                    onClick={loadScanHistory}
                    className="px-4 py-2 bg-zinc-900 border border-border/60 hover:border-zinc-700 text-white rounded-xl text-xs font-semibold transition"
                  >
                    Try again
                  </button>
                </div>
              ) : isLoading ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                  <span className="text-xs text-zinc-500 font-semibold">Loading scan history...</span>
                </div>
              ) : scans.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20 max-w-xl mx-auto mt-8">
                  <History className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                  <h3 className="text-sm font-semibold text-zinc-400">No scans found</h3>
                  <p className="text-xs text-zinc-600 mt-1 mb-6">Upload or scan a repository on the home dashboard to get started.</p>
                  <button
                    onClick={() => router.push("/")}
                    className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white rounded-xl text-xs font-semibold transition"
                  >
                    Go to Home
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="dash-metadata text-zinc-500 font-semibold px-3 mb-2 flex items-center gap-2">
                    <Clock size={12} />
                    Select up to 2 scans to run a comparison
                  </div>
                  {scans.map((scan, index) => {
                    const isSelected = selectedScans.includes(scan.id);
                    const disabled = !isSelected && selectedScans.length >= 2;
                    return (
                      <motion.div
                        key={scan.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => !disabled && toggleSelect(scan.id)}
                        className={`group bg-zinc-950/40 border rounded-xl p-4 transition-all duration-200 cursor-pointer flex items-center justify-between ${
                          isSelected 
                            ? "border-primary bg-primary/5 ring-1 ring-primary/30" 
                            : "border-border/40 hover:border-zinc-700"
                        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div 
                            className="shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={disabled}
                              onChange={() => toggleSelect(scan.id)}
                              className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary/40 cursor-pointer disabled:cursor-not-allowed"
                            />
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-white dash-card-title truncate group-hover:text-primary transition-colors">
                              {scan.repoName}
                            </h3>
                            <div className="flex items-center gap-4 dash-metadata text-zinc-500 mt-1.5 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(scan.scannedAt).toLocaleDateString(undefined, { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Code className="w-3.5 h-3.5" />
                                {scan.totalFiles} files
                              </span>
                              <span className="flex items-center gap-1">
                                <Database className="w-3.5 h-3.5" />
                                {scan.totalRoutes} routes
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 dash-badge uppercase">
                                {scan.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4 shrink-0">
                          <div className="flex flex-col items-end mr-3">
                            <span className="dash-metadata text-zinc-500 uppercase tracking-widest text-[11px]">Health</span>
                            <span className={`dash-card-title font-bold ${
                              scan.healthScore >= 70 ? 'text-emerald-400' :
                              scan.healthScore >= 40 ? 'text-amber-400' :
                              'text-rose-400'
                            }`}>
                              {scan.healthScore}%
                            </span>
                          </div>

                          <button
                            onClick={(e) => handleViewScan(scan.jobId, e)}
                            className="p-2 hover:bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition text-zinc-400 hover:text-white"
                            title="Load scan in dashboard"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteClick(scan); }}
                              className="p-2 hover:bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-800/80 hover:text-rose-400 transition text-zinc-500"
                              title="Delete scan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        scan={deletingScan}
        isDeleting={isDeleting}
      />
    </div>
  );
}

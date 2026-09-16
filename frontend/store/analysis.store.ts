import { create } from "zustand";
import { AnalysisResult } from "@shared/types";

interface AnalysisState {
  currentJobId: string | null;
  status: string;
  result: AnalysisResult | null;
  repoUrl: string | null;
  sourceType: "github" | "zip" | "local" | null;
  setJob: (
    jobId: string | null,
    status?: string,
    repoUrl?: string | null,
    sourceType?: "github" | "zip" | "local" | null
  ) => void;
  setRepoInfo: (repoUrl: string | null, sourceType: "github" | "zip" | "local" | null) => void;
  setStatus: (status: string) => void;
  setResult: (result: AnalysisResult | null) => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  currentJobId: null,
  status: "idle",
  result: null,
  repoUrl: null,
  sourceType: null,
  setJob: (jobId, status = "uploaded", repoUrl = null, sourceType = null) =>
    set((state) => ({
      currentJobId: jobId,
      status,
      result: null,
      repoUrl: repoUrl !== undefined ? repoUrl : state.repoUrl,
      sourceType: sourceType !== undefined ? sourceType : state.sourceType,
    })),
  setRepoInfo: (repoUrl, sourceType) => set({ repoUrl, sourceType }),
  setStatus: (status) => set({ status }),
  setResult: (result) => set({ result }),
  reset: () => set({ currentJobId: null, status: "idle", result: null, repoUrl: null, sourceType: null }),
}));

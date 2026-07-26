import { QueryClient } from "@tanstack/react-query";
import {
  AnalysisResult, ChatMessage, AiArchitectSummary, OnboardingGuide,
  ImpactAnalysis, StaticAnalysisReport, ArchitectureDiff, ExecutionTrace,
  FeatureFlow, RepositorySubway
} from "@shared/types";
import { supabase } from "../subscription/supabase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      // Cache data for 5 minutes by default — prevents unnecessary refetches
      // when switching tabs or navigating back
      staleTime: 5 * 60 * 1000,
      // Keep cached data for 10 minutes after components unmount
      gcTime: 10 * 60 * 1000,
    },
  },
});

// ─── Auth Session Cache ─────────────────────────────────────────────────────
// Cache the session token so we don't call supabase.auth.getSession() on
// every single API request. The session is refreshed automatically by
// Supabase's autoRefreshToken, and we invalidate the cache on auth changes.
let cachedSession: { access_token: string } | null = null;
let cachedToken: string | null = null;

/**
 * Get auth headers with cached JWT token.
 * Falls back to fetching from Supabase if cache is empty.
 */
async function getAuthHeaders(headers: Record<string, string> = {}): Promise<Record<string, string>> {
  // Fast path: use cached token if available
  if (cachedToken) {
    return {
      ...headers,
      "Authorization": `Bearer ${cachedToken}`,
    };
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      cachedSession = session;
      cachedToken = session.access_token;
      return {
        ...headers,
        "Authorization": `Bearer ${session.access_token}`,
      };
    }
  } catch (e) {
    console.error("Failed to get auth session for API request", e);
  }
  return headers;
}

/**
 * Invalidate the cached session token.
 * Call this when the user signs out or the session changes.
 */
export function invalidateAuthCache() {
  cachedSession = null;
  cachedToken = null;
}

// ─── API Functions ──────────────────────────────────────────────────────────

export async function submitGithubUrl(url: string): Promise<{ jobId: string }> {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    headers: await getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to submit GitHub URL for analysis");
  }

  return response.json();
}

export async function submitZipFile(file: File): Promise<{ jobId: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to upload ZIP file for analysis");
  }

  return response.json();
}

export async function getAnalysisStatus(jobId: string): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/api/analyze/${jobId}/status`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch job status");
  }
  return response.json();
}

export async function getAnalysisResults(jobId: string): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE_URL}/api/analyze/${jobId}/results`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch analysis results");
  }
  return response.json();
}

export async function submitLocalPath(path: string): Promise<{ jobId: string }> {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    headers: await getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ path, source: "local" }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Failed to submit local path for analysis");
  }

  return response.json();
}

export async function submitChatMessage(jobId: string, message: string): Promise<{ message: ChatMessage }> {
  const response = await fetch(`${API_BASE_URL}/api/analyze/${jobId}/chat`, {
    method: "POST",
    headers: await getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Failed to communicate with AI orchestrator");
  }

  return response.json();
}

export async function getAiSummary(jobId: string): Promise<{ aiSummary: AiArchitectSummary | null }> {
  const response = await fetch(`${API_BASE_URL}/api/analyze/${jobId}/ai-summary`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch AI architecture summary");
  }
  return response.json();
}

export async function getOnboardingGuide(jobId: string): Promise<{ onboarding: OnboardingGuide | null }> {
  const response = await fetch(`${API_BASE_URL}/api/analyze/${jobId}/onboarding`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch onboarding guide");
  }
  return response.json();
}

export async function getImpactAnalysis(jobId: string, file: string): Promise<{ impact: ImpactAnalysis; timeline: any[] }> {
  const response = await fetch(`${API_BASE_URL}/api/analyze/${jobId}/impact?file=${encodeURIComponent(file)}`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch impact analysis");
  }
  return response.json();
}

export async function getStaticAnalysis(jobId: string): Promise<StaticAnalysisReport> {
  const response = await fetch(`${API_BASE_URL}/api/analyze/${jobId}/static`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch static analysis report");
  }
  return response.json();
}

export async function getRepositoryTimeline(jobId: string): Promise<{ timeline: any[] }> {
  const response = await fetch(`${API_BASE_URL}/api/analyze/${jobId}/timeline`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch repository timeline");
  }
  return response.json();
}

export async function getJobsList(): Promise<{ jobs: any[] }> {
  const response = await fetch(`${API_BASE_URL}/api/analyze/jobs`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch jobs list");
  }
  return response.json();
}

export async function getArchitectureDiff(jobId: string, compareJobId: string): Promise<ArchitectureDiff> {
  const response = await fetch(`${API_BASE_URL}/api/analyze/${jobId}/compare/${compareJobId}`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Failed to compare architecture runs");
  }
  return response.json();
}

export async function getArchitectureLayers(jobId: string): Promise<{ layers: Record<string, string[]> }> {
  const response = await fetch(`${API_BASE_URL}/api/analyze/${jobId}/architecture`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch architecture layers");
  }
  return response.json();
}

export async function getExecutionTraces(jobId: string): Promise<{ traces: ExecutionTrace[] }> {
  const response = await fetch(`${API_BASE_URL}/api/analyze/${jobId}/traces`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch execution traces");
  }
  return response.json();
}

export async function getFileContent(jobId: string, filePath: string): Promise<{ content: string }> {
  const response = await fetch(`${API_BASE_URL}/api/analyze/${jobId}/file?path=${encodeURIComponent(filePath)}`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch file contents");
  }
  return response.json();
}

export async function getFeaturesMap(jobId: string): Promise<{ features: FeatureFlow[] }> {
  const response = await fetch(`${API_BASE_URL}/api/analyze/${jobId}/features`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch features map");
  }
  return response.json();
}

export async function getSubwayMap(jobId: string): Promise<{ subway: RepositorySubway; layout: { nodes: any[]; edges: any[] } }> {
  const response = await fetch(`${API_BASE_URL}/api/analyze/${jobId}/subway`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch subway map");
  }
  return response.json();
}

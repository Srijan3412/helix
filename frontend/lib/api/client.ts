import { QueryClient } from "@tanstack/react-query";
import { Profile } from "../subscription/subscription";
import {
  AnalysisResult, ChatMessage, AiArchitectSummary, OnboardingGuide,
  ImpactAnalysis, StaticAnalysisReport, ArchitectureDiff, ExecutionTrace,
  FeatureFlow, RepositorySubway, ScanSession, ScanSnapshot, DiffReport
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

// ✅ ADD: Helper function to get auth headers with user info
export async function getAuthHeadersWithUser(): Promise<{
  headers: Record<string, string>;
  user: any;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  const headers = await getAuthHeaders();
  return { headers, user };
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

export async function getArchitectureLayers(jobId: string): Promise<any> {
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

// ─── Scan History & Comparison Functions ───

export async function getScanHistory(userId: string): Promise<ScanSession[]> {
  const response = await fetch(`${API_BASE_URL}/api/scan-history/${userId}`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) {
    // Surface the server's error message (if any) for easier debugging
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error || "Failed to fetch scan history");
  }
  const result = await response.json();
  return result.data;
}

export async function getScanSession(jobId: string): Promise<ScanSession | null> {
  const response = await fetch(`${API_BASE_URL}/api/scan-history/session/${jobId}`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) return null;
  const result = await response.json();
  return result.data;
}

export async function getScanSnapshot(sessionId: string): Promise<ScanSnapshot | null> {
  const response = await fetch(`${API_BASE_URL}/api/scan-history/${sessionId}/snapshot`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) return null;
  const result = await response.json();
  return result.data;
}

export async function compareScans(baselineSessionId: string, compareSessionId: string): Promise<DiffReport> {
  const response = await fetch(`${API_BASE_URL}/api/scan-history/compare`, {
    method: "POST",
    headers: await getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ baselineSessionId, compareSessionId }),
  });
  if (!response.ok) throw new Error("Failed to compare scans");
  const result = await response.json();
  return result.data;
}

// ── Admin Scan Management ──
export async function adminGetAllScans(includeDeleted?: boolean): Promise<ScanSession[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/scans?includeDeleted=${includeDeleted || false}`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to fetch scans');
  }
  const result = await response.json();
  return result.data;
}

export async function adminDeleteScan(scanId: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/admin/scans/${scanId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to delete scan');
  }
  return response.json();
}

export async function adminRestoreScan(scanId: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/admin/scans/${scanId}/restore`, {
    method: 'POST',
    headers: await getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to restore scan');
  }
  return response.json();
}

export async function adminPermanentDeleteScan(scanId: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/admin/scans/${scanId}/permanent`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to permanently delete scan');
  }
  return response.json();
}

// ─── Authentication API Functions ──────────────────────────────────────────

/**
 * Sign up a new user with email and password
 * Sends OTP verification email
 */
export async function signUpApi(email: string, password: string): Promise<{
  success: boolean;
  userId: string;
  email: string;
  message: string;
  needsVerification: boolean;
}> {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Signup failed");
  }

  return response.json();
}

/**
 * Verify OTP code for email verification
 */
export async function verifyOtpApi(userId: string, otp: string): Promise<{
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    email_verified: boolean;
    email_verified_at: string;
  };
  redirectUrl?: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, otp }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "OTP verification failed");
  }

  return response.json();
}

/**
 * Resend OTP code to user's email
 */
export async function resendOtpApi(userId: string): Promise<{
  success: boolean;
  message: string;
  resendCooldown?: number;
  cooldownRemaining?: number;
}> {
  const response = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Failed to resend OTP");
  }

  return response.json();
}

/**
 * Check user's email verification status
 */
export async function checkVerificationStatus(userId: string): Promise<{
  success: boolean;
  data: {
    verified: boolean;
    status: {
      exists: boolean;
      verified: boolean;
      attemptsUsed: number;
      attemptsRemaining: number;
      expiresAt?: string;
      canResend: boolean;
      cooldownSeconds?: number;
    };
  };
}> {
  const response = await fetch(`${API_BASE_URL}/api/auth/check-verification/${userId}`, {
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to check verification status");
  }

  return response.json();
}

/**
 * Get detailed verification status for a user
 */
export async function getVerificationStatus(userId: string): Promise<{
  success: boolean;
  data: {
    exists: boolean;
    verified: boolean;
    attemptsUsed: number;
    attemptsRemaining: number;
    expiresAt?: string;
    canResend: boolean;
    cooldownSeconds?: number;
  };
}> {
  const response = await fetch(`${API_BASE_URL}/api/auth/verification-status/${userId}`, {
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to get verification status");
  }

  return response.json();
}

// ─── Scan Limit API Functions ─────────────────────────────────────────────

/**
 * Get user's scan usage information
 */
export async function getScanUsage(userId: string): Promise<{
  success: boolean;
  data: {
    scan_limit: number;
    scans_used: number;
    scans_remaining: number;
    limit_reached: boolean;
    can_scan: boolean;
    reset_at?: string | null;
  };
}> {
  const response = await fetch(`${API_BASE_URL}/api/user/${userId}/scan-usage`, {
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch scan usage");
  }

  return response.json();
}

/**
 * Check if user can perform a new scan
 */
export async function canPerformScan(userId: string): Promise<{
  success: boolean;
  data: {
    can_scan: boolean;
    scans_used: number;
    scan_limit: number;
    scans_remaining: number;
    reason?: string;
  };
}> {
  const response = await fetch(`${API_BASE_URL}/api/user/${userId}/can-scan`, {
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to check scan permission");
  }

  return response.json();
}

// ─── Contact Form API Functions ────────────────────────────────────────────

/**
 * Submit a contact/sales inquiry
 */
export async function submitContactRequest(data: {
  name: string;
  email: string;
  requestType: 'MORE_SCANS' | 'SUBSCRIPTION' | 'PROFESSIONAL' | 'ENTERPRISE' | 'GENERAL';
  company?: string;
  message: string;
}): Promise<{
  success: boolean;
  message: string;
  requestId?: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/contact`, {
    method: "POST",
    headers: await getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Failed to submit contact request");
  }

  return response.json();
}

// ─── User Profile API Functions ─────────────────────────────────────────────

/**
 * Get user profile with email verification and scan limit info
 */
export async function getUserProfile(userId: string): Promise<{
  success: boolean;
  data: Profile;
}> {
  const response = await fetch(`${API_BASE_URL}/api/user/${userId}/profile`, {
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch user profile");
  }

  return response.json();
}

/**
 * Update user scan limit (Admin only)
 */
export async function updateUserScanLimit(userId: string, scanLimit: number): Promise<{
  success: boolean;
  message: string;
  data?: Profile;
}> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/scan-limit`, {
    method: "PUT",
    headers: await getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ scanLimit }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update scan limit");
  }

  return response.json();
}

// ─── Admin User Management API Functions ────────────────────────────────────

/**
 * Get all users (Admin only)
 */
export async function adminGetAllUsers(): Promise<{
  success: boolean;
  data: Profile[];
}> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch users");
  }

  return response.json();
}

/**
 * Get all contact requests (Admin only)
 */
export async function adminGetContactRequests(status?: string): Promise<{
  success: boolean;
  data: any[];
}> {
  const url = status
    ? `${API_BASE_URL}/api/admin/contact-requests?status=${status}`
    : `${API_BASE_URL}/api/admin/contact-requests`;

  const response = await fetch(url, {
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch contact requests");
  }

  return response.json();
}

/**
 * Update contact request status (Admin only)
 */
export async function adminUpdateContactRequest(
  requestId: string,
  status: 'NEW' | 'READ' | 'CONTACTED' | 'CLOSED'
): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/admin/contact-requests/${requestId}`, {
    method: "PUT",
    headers: await getAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update contact request");
  }

  return response.json();
}

export async function deleteScan(sessionId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/scan-history/${sessionId}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete scan");
}

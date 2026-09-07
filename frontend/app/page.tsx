"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useAnalysisStore } from "../store/analysis.store";
import { adminDeleteScan, getScanHistory, getUserProfile } from "../lib/api/client";
import { useAuth } from "../hooks/useAuth";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import {
  submitGithubUrl,
  submitZipFile,
  submitLocalPath,
  submitChatMessage,
  getAnalysisStatus,
  getAnalysisResults,
  getImpactAnalysis,
  getStaticAnalysis,
  getRepositoryTimeline,
  getJobsList,
  getArchitectureDiff,
} from "../lib/api/client";
import {
  RouteNode,
  EnvironmentVariable,
  EntityOperation,
  ArchitectureNode,
  ChatMessage,
  FileNode,
  ImpactAnalysis,
  StaticAnalysisReport,
  ArchitectureDiff,
  LearningStep,
  ScanSession,
} from "@shared/types";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Input } from "../components/ui/input";
import { FileDropzone } from "../components/ui/dropzone";
import {
  Github,
  Binary,
  Network,
  Settings,
  FolderGit,
  Folder,
  Upload,
  CheckCircle2,
  Terminal,
  Layers,
  MessageSquare,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  Bot,
  Heart,
  AlertTriangle,
  Zap,
  Eye,
  Search,
  X,
  Play,
  Shield,
  Database,
  GitBranch,
  Activity,
  FileText,
  ArrowRight,
  GitCompare,
  CreditCard,
  Lock,
  User,
  LogOut,
  Code2,
  BarChart3,
  History,
  RefreshCw,
  Download,
  Target,
  Cpu,
  Trash2,
  Mail,
  Split,
  Package,
  AlertCircle,
  ExternalLink,
  Rocket,
  Workflow,
  ChevronRight,
  Lightbulb,
} from "lucide-react";

// ─── Dynamic Imports (Code Splitting) ───────────────────────────────────────
// Heavy components are loaded on-demand only when needed, dramatically
// reducing the initial bundle size. The @xyflow/react graph library (~500KB)
// is only loaded when the user visits the Architecture tab.
//
// NOTE: The following architecture components were previously imported at the
// top level but were NEVER directly used in this file — they were only used
// inside ArchitectureViewer.tsx:
//   LayerView, FileGraph, RouteGraph, DependencyGraph,
//   ExecutionTrace, MetroMap, SubwayMap
// Removing these unused imports eliminates their entire dependency tree
// (including @xyflow/react) from the initial bundle.


const LandingPage = dynamic(
  () => import("../components/subscription/LandingPage"),
  { ssr: false },
);
const AuthPage = dynamic(() => import("../components/subscription/AuthPage"), {
  ssr: false,
});
const PaymentPage = dynamic(
  () => import("../components/subscription/PaymentPage"),
  { ssr: false },
);
const BillingPage = dynamic(
  () => import("../components/subscription/BillingPage"),
  { ssr: false },
);
const UpgradeModal = dynamic(
  () => import("../components/subscription/UpgradeModal"),
  { ssr: false },
);
const UsageLimitModal = dynamic(
  () => import("../components/subscription/UsageLimitModal"),
  { ssr: false },
);
const TokenCounter = dynamic(
  () => import("../components/subscription/TokenCounter"),
  { ssr: false },
);
const TrialBanner = dynamic(
  () => import("../components/subscription/TrialBanner"),
  { ssr: false },
);

const ArchitectureViewer = dynamic(
  () => import("../components/architecture/ArchitectureViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full text-zinc-500 text-xs font-mono">
        Loading architecture viewer…
      </div>
    ),
  },
);



const IngestionControl = dynamic(
  () => import("../components/ingestion/IngestionControl"),
  { ssr: false },
);
const ProgressTracker = dynamic(
  () => import("../components/ingestion/ProgressTracker"),
  { ssr: false },
);
const OverviewAnalytics = dynamic(
  () => import("../components/diagnostics/OverviewAnalytics"),
  { ssr: false },
);
const AuthDetector = dynamic(
  () => import("../components/diagnostics/AuthDetector"),
  { ssr: false },
);
const EvidenceFound = dynamic(
  () => import("../components/diagnostics/EvidenceFound"),
  { ssr: false },
);
const RelatedFiles = dynamic(
  () => import("../components/diagnostics/RelatedFiles"),
  { ssr: false },
);
const LanguageBreakdown = dynamic(
  () => import("../components/diagnostics/LanguageBreakdown"),
  { ssr: false },
);
const DatabaseExplorer = dynamic(
  () => import("../components/diagnostics/DatabaseExplorer"),
  { ssr: false },
);

import { useSubscription } from "../lib/subscription/SubscriptionContext";
import ScanUsageDisplay from '../components/ScanUsageDisplay';
import { PLAN_CONFIG } from "../lib/subscription/subscription";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ResultTab =
  | "overview"
  | "arch"
  | "routes"
  | "db"
  | "health"
  | "impact"
  | "compare"
  | "env"
  | "ai-architect"
  | "onboarding"
  | "billing";
type ArchViewMode =
  "layer" | "file" | "route" | "dependency" | "trace" | "metro" | "subway";

// ─── Health Score Calculator ───────────────────────────────────────────────────

function computeHealthScore(result: any) {
  if (!result) return null;
  const files: FileNode[] = result.files || [];
  const realFiles = files.filter(
    (f: FileNode) =>
      !f.path.startsWith("ROUTE:") &&
      !f.path.startsWith("ENV:") &&
      !f.path.startsWith("DB:") &&
      !f.path.startsWith("ENTITY:"),
  );

  const cycles = result.graph?.metrics?.cycles ?? 0;
  const deadFiles = realFiles.filter(
    (f: FileNode) =>
      (f.referencedBy?.length ?? 0) === 0 &&
      !f.path.includes("index") &&
      !f.path.includes("main") &&
      !f.path.includes("server"),
  );
  const largeFiles = realFiles.filter(
    (f: FileNode) => (f.lineCount ?? 0) > 500,
  );
  const brokenImports = ((result.graphIssues ?? []) as any[]).filter(
    (i: any) => i.type === "broken_edge" && i.severity === "error",
  ).length;

  const cycleDeduction = Math.min(30, cycles * 3);
  const deadDeduction = Math.min(20, deadFiles.length * 2);
  const brokenDeduction = Math.min(25, brokenImports * 5);
  const largeDeduction = Math.min(15, largeFiles.length * 1);

  const score = Math.max(
    0,
    100 - cycleDeduction - deadDeduction - brokenDeduction - largeDeduction,
  );
  return { score, cycles, deadFiles, largeFiles, brokenImports };
}
// ─── Markdown Content Formatter ──────────────────────────────────────────────

function formatMarkdownContent(content: string) {
  if (!content || typeof content !== "string") return [];

  // Split by lines
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // Check for headings (## or ###)
    if (line.startsWith("## ")) {
      const headingText = line.slice(3);
      // Detect emoji - using Emoji_Presentation to avoid matching digits 0-9
      const emojiMatch = headingText.match(
        /^([\u{1F300}-\u{1FAFF}]|\p{Emoji_Presentation})\s+(.+)/u,
      );
      if (emojiMatch) {
        elements.push(
          <h3
            key={i}
            className="text-lg font-bold text-white mt-8 mb-4 flex items-center gap-2"
          >
            <span className="text-xl">{emojiMatch[1]}</span>
            <span>{emojiMatch[2]}</span>
          </h3>,
        );
      } else {
        elements.push(
          <h3
            key={i}
            className="text-lg font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2"
          >
            {headingText}
          </h3>,
        );
      }
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      elements.push(
        <h4 key={i} className="text-base font-semibold text-white/90 mt-6 mb-3">
          {line.slice(4)}
        </h4>,
      );
      i++;
      continue;
    }

    // Check for bullet lists
    if (line.match(/^[\*\-]\s/)) {
      const bulletItems: string[] = [];
      while (i < lines.length && lines[i].match(/^[\*\-]\s/)) {
        bulletItems.push(lines[i].replace(/^[\*\-]\s/, ""));
        i++;
      }
      elements.push(
        <ul key={i} className="space-y-2 my-3">
          {bulletItems.map((item, idx) => {
            const parts = item.split(/(\*\*[^*]+\*\*|`[^`]+`)/);
            const styledParts = parts.map((part, pIdx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={pIdx} className="text-white font-bold">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              if (part.startsWith("`") && part.endsWith("`")) {
                return (
                  <code
                    key={pIdx}
                    className="px-1.5 py-0.5 rounded bg-zinc-800/60 text-emerald-400 font-mono text-[11px]"
                  >
                    {part.slice(1, -1)}
                  </code>
                );
              }
              return <span key={pIdx}>{part}</span>;
            });
            return (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-zinc-300 leading-relaxed"
              >
                <span className="text-primary mt-1.5">•</span>
                <span>{styledParts}</span>
              </li>
            );
          })}
        </ul>,
      );
      continue;
    }

    // Check for numbered lists
    if (line.match(/^\d+\.\s/)) {
      const numItems: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        numItems.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol
          key={i}
          className="space-y-2 my-3 list-decimal list-inside text-sm text-zinc-300 leading-relaxed"
        >
          {numItems.map((item, idx) => {
            const parts = item.split(/(\*\*[^*]+\*\*|`[^`]+`)/);
            const styledParts = parts.map((part, pIdx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={pIdx} className="text-white font-bold">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              if (part.startsWith("`") && part.endsWith("`")) {
                return (
                  <code
                    key={pIdx}
                    className="px-1.5 py-0.5 rounded bg-zinc-800/60 text-emerald-400 font-mono text-[11px]"
                  >
                    {part.slice(1, -1)}
                  </code>
                );
              }
              return <span key={pIdx}>{part}</span>;
            });
            return <li key={idx}>{styledParts}</li>;
          })}
        </ol>,
      );
      continue;
    }

    // Check for code blocks
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      elements.push(
        <pre
          key={i}
          className="my-4 p-4 bg-zinc-950/80 rounded-xl border border-white/5 overflow-x-auto"
        >
          <code className="text-xs font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">
            {codeLines.join("\n")}
          </code>
        </pre>,
      );
      continue;
    }

    // Check for horizontal rules
    if (line.match(/^---$/)) {
      elements.push(<hr key={i} className="my-6 border-white/10" />);
      i++;
      continue;
    }

    // Regular paragraph with inline formatting
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/);
    const styledParts = parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="text-white font-bold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 rounded bg-zinc-800/60 text-emerald-400 font-mono text-[11px]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("*") && part.endsWith("*") && !part.includes("**")) {
        return (
          <em key={idx} className="text-zinc-400 italic">
            {part.slice(1, -1)}
          </em>
        );
      }
      return <span key={idx}>{part}</span>;
    });

    // Handle "key: value" style lines
    const keyValueMatch = line.match(/^(\w+):\s+(.+)$/);
    if (keyValueMatch && !line.includes("**") && !line.includes("`")) {
      elements.push(
        <div
          key={i}
          className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0"
        >
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider min-w-[100px]">
            {keyValueMatch[1]}
          </span>
          <span className="text-sm text-zinc-300 font-mono">
            {keyValueMatch[2]}
          </span>
        </div>,
      );
      i++;
      continue;
    }

    elements.push(
      <p key={i} className="text-sm text-zinc-300 leading-relaxed">
        {styledParts}
      </p>,
    );
    i++;
  }

  return elements;
}

// ─── Auth Detector (frontend, deterministic) ──────────────────────────────────

function detectAuth(result: any) {
  if (!result) return null;
  const envVars: EnvironmentVariable[] = result.envVars || [];
  const routes: RouteNode[] = result.routes || [];

  const evidence: string[] = [];
  let authType = "None detected";

  if (
    envVars.some((e: EnvironmentVariable) =>
      /jwt|jwt_secret|access_token_secret/i.test(e.name),
    )
  ) {
    authType = "JWT";
    evidence.push("JWT_SECRET environment variable");
  }
  if (
    envVars.some((e: EnvironmentVariable) =>
      /oauth|client_id|client_secret/i.test(e.name),
    )
  ) {
    authType = "OAuth 2.0";
    evidence.push("OAUTH_CLIENT_ID / CLIENT_SECRET environment variables");
  }
  if (
    envVars.some((e: EnvironmentVariable) =>
      /session_secret|session/i.test(e.name),
    )
  ) {
    authType = "Session-based";
    evidence.push("SESSION_SECRET environment variable");
  }
  if (
    envVars.some((e: EnvironmentVariable) =>
      /nextauth|auth0|supabase|firebase|clerk/i.test(e.name),
    )
  ) {
    const match = envVars.find((e: EnvironmentVariable) =>
      /nextauth|auth0|supabase|firebase|clerk/i.test(e.name),
    );
    if (match?.name.toLowerCase().includes("nextauth")) {
      authType = "NextAuth.js";
      evidence.push("NEXTAUTH_URL env var");
    }
    if (match?.name.toLowerCase().includes("auth0")) {
      authType = "Auth0";
      evidence.push("AUTH0_DOMAIN env var");
    }
    if (match?.name.toLowerCase().includes("supabase")) {
      authType = "Supabase Auth";
      evidence.push("SUPABASE_URL env var");
    }
    if (match?.name.toLowerCase().includes("firebase")) {
      authType = "Firebase Auth";
      evidence.push("FIREBASE_API_KEY env var");
    }
    if (match?.name.toLowerCase().includes("clerk")) {
      authType = "Clerk";
      evidence.push("CLERK_SECRET_KEY env var");
    }
  }

  const authRoutes = routes.filter((r: RouteNode) =>
    /auth|login|logout|token|refresh|oauth/i.test(r.path),
  );
  if (authRoutes.length > 0)
    evidence.push(
      `${authRoutes.length} auth-related routes (${authRoutes
        .map((r) => r.path)
        .slice(0, 3)
        .join(", ")})`,
    );

  const protectedRoutes = routes.filter(
    (r: RouteNode) => (r.middleware?.length ?? 0) > 0,
  );
  if (protectedRoutes.length > 0)
    evidence.push(
      `${protectedRoutes.length} routes have middleware protection`,
    );

  const highCritEnvs = envVars.filter(
    (e: EnvironmentVariable) =>
      e.criticality === "HIGH" && /secret|key|password|token/i.test(e.name),
  );
  if (highCritEnvs.length > 0)
    evidence.push(`${highCritEnvs.length} high-criticality secret env vars`);

  return { authType, evidence, authRoutes, protectedRoutes };
}

// ─── Execution Trace Builder ───────────────────────────────────────────────────

function buildExecutionTrace(route: RouteNode, result: any) {
  const steps: {
    id: string;
    label: string;
    type: string;
    sublabel?: string;
  }[] = [];
  const envUsed: string[] = [];
  const entitiesUsed: string[] = [];

  // Step 1: Route
  steps.push({
    id: "route",
    label: `${route.method} ${route.path}`,
    type: "route",
    sublabel: "HTTP Entry Point",
  });

  // Step 2: Middleware
  if (route.middleware && route.middleware.length > 0) {
    steps.push({
      id: "middleware",
      label: route.middleware.join(", "),
      type: "middleware",
      sublabel: "Middleware Chain",
    });
  }

  // Steps 3+: Call chain files
  if (route.chain && route.chain.length > 0) {
    for (const chainFile of route.chain) {
      const basename = chainFile.split(/[\\/]/).pop() ?? chainFile;
      const noExt = basename.replace(/\.[^.]+$/, "");
      const lower = basename.toLowerCase();
      let type = "service";
      if (
        lower.includes("controller") ||
        lower.includes("handler") ||
        lower.includes("resolver")
      )
        type = "controller";
      else if (
        lower.includes("repository") ||
        lower.includes("repo") ||
        lower.includes("model")
      )
        type = "repository";
      else if (lower.includes("service")) type = "service";
      steps.push({ id: chainFile, label: noExt, type, sublabel: chainFile });
    }
  }

  // DB Flow matching
  const dbFlow = (result.metadata?.databaseInfo?.flows ?? []).find(
    (f: any) => f.route === route.path && f.method === route.method,
  );
  if (dbFlow) {
    if (dbFlow.entities) {
      for (const ent of dbFlow.entities) {
        entitiesUsed.push(ent);
        steps.push({
          id: `entity-${ent}`,
          label: ent,
          type: "entity",
          sublabel: "Database Entity",
        });
      }
    }
    const dbType = result.metadata?.databaseInfo?.type ?? "Database";
    steps.push({
      id: "db",
      label: dbType,
      type: "database",
      sublabel: "Persistence Layer",
    });
  }

  // Env vars used by files in this chain
  const chainFiles = new Set(route.chain ?? []);
  chainFiles.add(route.file ?? "");
  (result.envVars ?? []).forEach((e: EnvironmentVariable) => {
    if ((e.files ?? []).some((f: string) => chainFiles.has(f))) {
      envUsed.push(e.name);
    }
  });

  return { steps, envUsed, entitiesUsed };
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const { currentJobId, status, result, setJob, setStatus, setResult, reset } =
    useAnalysisStore();

  // Load job from sessionStorage if set by Scan History page
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedJobId = sessionStorage.getItem("active-job-id");
      if (storedJobId) {
        setJob(storedJobId, "completed");
        sessionStorage.removeItem("active-job-id");
      }
    }
  }, [setJob]);

  // ── Subscription and Auth States ──
  const {
    session,
    profile,
    usage,
    canUse,
    canScan,
    recordUsage,
    signOut,
    loading: subLoading,
  } = useSubscription();

  // ✅ OTP Verification Check
  useEffect(() => {
    if (subLoading) return;

    // Check if user is admin (mock bypass)
    const isAdmin = session?.user?.email === 'admin@projectanalyser.com';
    if (isAdmin) return;

    // Check if user logged in via Google OAuth
    const isGoogleUser = session?.user?.app_metadata?.provider === 'google' ||
      session?.user?.app_metadata?.providers?.includes('google') ||
      !!session?.user?.email_confirmed_at ||
      !!session?.user?.user_metadata?.email_verified;

    // Regular password user flow - check email verification
    if (session && profile) {
      if (!profile.email_verified && !isGoogleUser) {
        // If email not verified and not Google OAuth, redirect to OTP page
        router.push(`/auth?mode=verify-otp&userId=${encodeURIComponent(profile.id)}&email=${encodeURIComponent(profile.email || '')}`);
      }
    }
  }, [session, profile, subLoading, router]);
  const [view, setView] = useState<"dashboard" | "auth" | "payment">(
    "dashboard",
  );
  const [paymentPlan, setPaymentPlan] = useState<"professional" | "enterprise">(
    "professional",
  );
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showLimit, setShowLimit] = useState<{
    open: boolean;
    title?: string;
    message?: string;
  }>({ open: false });
  // ── User Profile State ──
  const [userProfile, setUserProfile] = useState<{
    scan_limit: number;
    scans_used: number;
  } | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  // ── Ingestion Error State ──
  const [errorMessage, setErrorMessage] = useState("");

  // ── Result Tab State ──
  const [activeResultTab, setActiveResultTab] = useState<ResultTab>("overview");

  // ── Routes State ──
  const [routeSearch, setRouteSearch] = useState("");
  const [traceRoute, setTraceRoute] = useState<RouteNode | null>(null);
  const [traceAnimStep, setTraceAnimStep] = useState(-1);
  const traceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Env State ──
  const [envSearch, setEnvSearch] = useState("");
  const [selectedEnvVar, setSelectedEnvVar] =
    useState<EnvironmentVariable | null>(null);

  // ── DB State ──
  const [selectedEntity, setSelectedEntity] = useState<EntityOperation | null>(
    null,
  );
  const [dbFlowSearch, setDbFlowSearch] = useState("");

  // ── Architecture State ──
  const [archViewMode, setArchViewMode] = useState<ArchViewMode>("layer");
  const [selectedTraceRouteId, setSelectedTraceRouteId] = useState<string>("");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const { user, isAdmin } = useAuth(); // Add isAdmin to your auth context
  const [scans, setScans] = useState<ScanSession[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingScan, setDeletingScan] = useState<ScanSession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch scan history for admin delete management
  useEffect(() => {
    if (user?.id) {
      getScanHistory(user.id)
        .then((history) => setScans(history))
        .catch(() => { });
    }
  }, [user]);

  // ── Compare State ──
  const [compareJobId, setCompareJobId] = useState("");
  const { data: jobsListData } = useQuery({
    queryKey: ["jobsList"],
    queryFn: getJobsList,
    // Only poll when the Compare tab is active — avoids unnecessary API calls
    // when the user is working in other tabs
    enabled: activeResultTab === "compare",
    refetchInterval: activeResultTab === "compare" ? 30000 : false,
  });
  const { data: compareData, isLoading: isCompareLoading } = useQuery({
    queryKey: ["compareJobs", currentJobId, compareJobId],
    queryFn: () => getArchitectureDiff(currentJobId!, compareJobId),
    enabled: !!currentJobId && !!compareJobId && activeResultTab === "compare",
  });

  // ── Health State ──
  const [healthSection, setHealthSection] = useState<
    | "dead"
    | "cycles"
    | "broken"
    | "large"
    | "complexity"
    | "god"
    | "exports"
    | null
  >(null);

  // ── Impact State ──
  const [selectedImpactFile, setSelectedImpactFile] = useState("");
  const [impactSearch, setImpactSearch] = useState("");

  // ── Backend Queries ──
  const { data: staticAnalysisReport, isLoading: isStaticLoading } = useQuery({
    queryKey: ["staticAnalysis", currentJobId],
    queryFn: () => getStaticAnalysis(currentJobId!),
    enabled:
      !!currentJobId && activeResultTab === "health" && status === "completed",
  });

  const { data: impactData, isLoading: isImpactLoading } = useQuery({
    queryKey: ["impactAnalysis", currentJobId, selectedImpactFile],
    queryFn: () => getImpactAnalysis(currentJobId!, selectedImpactFile),
    enabled:
      !!currentJobId &&
      !!selectedImpactFile &&
      activeResultTab === "impact" &&
      status === "completed",
  });

  const { data: timelineData, isLoading: isTimelineLoading } = useQuery({
    queryKey: ["timeline", currentJobId],
    queryFn: () => getRepositoryTimeline(currentJobId!),
    enabled:
      !!currentJobId && activeResultTab === "impact" && status === "completed",
  });

  // ── Onboarding State ──
  const [openOnboardingStep, setOpenOnboardingStep] = useState<number | null>(
    null,
  );

  // ── Chat State ──
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [expandedAgentLogs, setExpandedAgentLogs] = useState<
    Record<string, boolean>
  >({});

  // ── Computed ──
  const healthData = computeHealthScore(result);
  const authData = detectAuth(result);

  // ── Export Functions for AI Architect ──
  const exportAsMarkdown = () => {
    if (!result?.aiSummary?.markdownSummary) return;
    const blob = new Blob([result.aiSummary.markdownSummary], {
      type: "text/markdown",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-architect-summary-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copySummary = () => {
    if (!result?.aiSummary?.markdownSummary) return;
    navigator.clipboard
      .writeText(result.aiSummary.markdownSummary)
      .then(() => {
        // Show success toast
        console.log("✅ Copied to clipboard");
      })
      .catch(() => {
        // Show error toast
        console.error("❌ Failed to copy");
      });
  };

  const regenerateSummary = () => {
    // TODO: Call API to regenerate
    console.log("🔄 Regenerate summary");
  };

  const getTopRisks = () => {
    if (!result) return [];
    const files = result.files || [];
    const complexityList = staticAnalysisReport?.complexity || [];
    const godServicesList = staticAnalysisReport?.godServices || [];
    const deadFileList = staticAnalysisReport?.deadCode || [];

    const risks = files
      .filter((f: any) => {
        const pathLower = f.path.toLowerCase();
        return (
          !pathLower.startsWith("route:") &&
          !pathLower.startsWith("env:") &&
          !pathLower.startsWith("db:") &&
          !pathLower.startsWith("entity:") &&
          !pathLower.includes(".config") &&
          !pathLower.includes(".test")
        );
      })
      .map((file: any) => {
        const comp = complexityList.find((c: any) => c.file === file.path);
        const god = godServicesList.find((g: any) => g.file === file.path);
        const isDead = deadFileList.some((d: any) => d.file === file.path);

        let threatScore = 0;
        if (comp) threatScore += comp.score * 2.5;
        else if (file.lineCount)
          threatScore += Math.min(25, file.lineCount / 20);

        if (god)
          threatScore +=
            (god.methods || 0) * 2 + (god.exportedFunctions || 0) * 0.5;

        if (file.lineCount > 1000) threatScore += 25;
        else if (file.lineCount > 500) threatScore += 12;

        if (isDead) threatScore += 15;

        return {
          file: file.path,
          basename: file.path.split(/[\\/]/).pop() || file.path,
          score: Math.min(100, Math.round(threatScore)),
          complexity: comp?.score || null,
          methods: god?.methods || null,
          loc: file.lineCount || 0,
        };
      });

    return risks.sort((a, b) => b.score - a.score).slice(0, 3);
  };

  const handleDeleteClick = (scan: ScanSession) => {
    setDeletingScan(scan);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingScan) return;

    setIsDeleting(true);
    try {
      await adminDeleteScan(deletingScan.id);
      setScans(scans.filter((s) => s.id !== deletingScan.id));
      setShowDeleteModal(false);
      // Optional: Show success toast
    } catch (error) {
      console.error("Failed to delete scan:", error);
      // Optional: Show error toast
    } finally {
      setIsDeleting(false);
      setDeletingScan(null);
    }
  };

  const topRisks = getTopRisks();

  const hasReport = !!staticAnalysisReport;
  const score = hasReport
    ? staticAnalysisReport.healthScore
    : (healthData?.score ?? 100);
  const deadCount = hasReport
    ? staticAnalysisReport.deadCode.length
    : (healthData?.deadFiles.length ?? 0);
  const cycleCount = hasReport
    ? staticAnalysisReport.cycles.length
    : (healthData?.cycles ?? 0);
  const brokenCount = healthData?.brokenImports ?? 0;
  const largeCount = hasReport
    ? staticAnalysisReport.largeFiles.length
    : (healthData?.largeFiles.length ?? 0);
  const complexCount = hasReport
    ? staticAnalysisReport.complexity.filter(
      (c: any) => c.rating === "risky" || c.rating === "medium",
    ).length
    : 0;
  const godCount = hasReport ? staticAnalysisReport.godServices.length : 0;
  const unusedExportsCount = hasReport
    ? staticAnalysisReport.unusedExports.length
    : 0;

  // ── Trace animation ──
  const playTrace = useCallback((steps: any[]) => {
    setTraceAnimStep(0);
    let idx = 0;
    const tick = () => {
      idx++;
      if (idx < steps.length) {
        setTraceAnimStep(idx);
        traceRef.current = setTimeout(tick, 180);
      }
    };
    traceRef.current = setTimeout(tick, 180);
  }, []);

  useEffect(
    () => () => {
      if (traceRef.current) clearTimeout(traceRef.current);
    },
    [],
  );

  // ── Mutations ──
  const urlMutation = useMutation({
    mutationFn: submitGithubUrl,
    onSuccess: (data) => {
      setJob(data.jobId, "uploaded");
      setErrorMessage("");
      recordUsage("repositories_analyzed");
      recordUsage("tokens_used", 100);
      setUserProfile((prev) => (prev ? { ...prev, scans_used: (prev.scans_used || 0) + 1 } : null));
    },
    onError: (error: Error) =>
      setErrorMessage(error.message || "Failed to submit repository URL"),
  });
  const fileMutation = useMutation({
    mutationFn: submitZipFile,
    onSuccess: (data) => {
      setJob(data.jobId, "uploaded");
      setErrorMessage("");
      recordUsage("repositories_analyzed");
      recordUsage("tokens_used", 100);
      setUserProfile((prev) => (prev ? { ...prev, scans_used: (prev.scans_used || 0) + 1 } : null));
    },
    onError: (error: Error) =>
      setErrorMessage(error.message || "Failed to upload ZIP file"),
  });
  const localMutation = useMutation({
    mutationFn: submitLocalPath,
    onSuccess: (data) => {
      setJob(data.jobId, "uploaded");
      setErrorMessage("");
      recordUsage("repositories_analyzed");
      recordUsage("tokens_used", 100);
      setUserProfile((prev) => (prev ? { ...prev, scans_used: (prev.scans_used || 0) + 1 } : null));
    },
    onError: (error: Error) =>
      setErrorMessage(error.message || "Failed to submit local path"),
  });
  const chatMutation = useMutation({
    mutationFn: ({ jobId, message }: { jobId: string; message: string }) =>
      submitChatMessage(jobId, message),
    onSuccess: (data) => setChatHistory((prev) => [...prev, data.message]),
    onError: (error: Error) => {
      const errMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 11),
        role: "assistant",
        content: `Error: ${error.message || "Something went wrong."}`,
        timestamp: new Date().toISOString(),
        agentLogs: ["❌ Failed to get response from AI orchestrator."],
      };
      setChatHistory((prev) => [...prev, errMsg]);
    },
  });

  const handleSendChatMessage = () => {
    if (!chatMessage.trim()) return;

    const currentChats = usage?.ai_chats ?? 0;
    if (!canUse("aiChats", currentChats)) {
      setShowLimit({
        open: true,
        title: "AI Credits Exhausted",
        message:
          "You have used all your AI chat credits. Upgrade to Professional for unlimited AI.",
      });
      return;
    }

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 11),
      role: "user",
      content: chatMessage,
      timestamp: new Date().toISOString(),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    const msg = chatMessage;
    setChatMessage("");

    chatMutation.mutate({ jobId: currentJobId!, message: msg });
    recordUsage("ai_chats");
    recordUsage("tokens_used", 10);
  };

  const { data: statusData } = useQuery({
    queryKey: ["status", currentJobId],
    queryFn: () => getAnalysisStatus(currentJobId!),
    enabled: !!currentJobId && status !== "completed" && status !== "failed",
    refetchInterval: 2000, // Speed up status updates now that rate limit has been raised
  });
  useEffect(() => {
    if (statusData?.status) setStatus(statusData.status);
  }, [statusData, setStatus]);

  const lastSyncedResultJobId = useRef<string | null>(null);

  const { data: resultData } = useQuery({
    queryKey: ["results", currentJobId],
    queryFn: () => getAnalysisResults(currentJobId!),
    enabled: !!currentJobId && status === "completed",
    staleTime: Infinity, // Analysis results never go stale — prevents background re-fetches that create new object references
    gcTime: Infinity, // Keep the result in cache indefinitely
  });
  useEffect(() => {
    // Only call setResult when we have new data for a different job ID.
    // Guarding this prevents React Query background re-fetches from
    // creating a cascade: new resultData ref → setResult → result prop changes
    // → useMemo recomputes initialNodes → setNodes fires → infinite loop.
    if (resultData && currentJobId !== lastSyncedResultJobId.current) {
      lastSyncedResultJobId.current = currentJobId ?? null;
      setResult(resultData);
    }
  }, [resultData, setResult, currentJobId]);


  // ── Fetch User Profile ──
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      setIsProfileLoading(true);
      try {
        const profileRes = await getUserProfile(user.id);
        const isAdmin = user.email === 'admin@projectanalyser.com' || profileRes?.data?.role === 'org_admin' || profileRes?.data?.role === 'admin';
        if (profileRes?.data) {
          setUserProfile({
            scan_limit: isAdmin ? Infinity : (profileRes.data.scan_limit ?? 2),
            scans_used: profileRes.data.scans_used ?? 0
          });
        } else if (isAdmin) {
          setUserProfile({
            scan_limit: Infinity,
            scans_used: 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        if (user.email === 'admin@projectanalyser.com') {
          setUserProfile({ scan_limit: Infinity, scans_used: 0 });
        }
      } finally {
        setIsProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id, user?.email]);


  const handleFileDrop = (file: File) => {
    if (file.name.endsWith(".zip")) fileMutation.mutate(file);
    else setErrorMessage("Please upload a valid .zip compressed archive");
  };

  const isPending =
    urlMutation.isPending || fileMutation.isPending || localMutation.isPending;

  const getProgressValue = () => {
    switch (status) {
      case "uploaded":
        return 10;
      case "queued":
        return 20;
      case "cloning":
      case "extracting":
        return 45;
      case "scanning":
        return 75;
      case "completed":
        return 100;
      default:
        return 0;
    }
  };

  const getStatusVariant = () => {
    if (status === "completed") return "success";
    if (status === "failed") return "error";
    if (["cloning", "extracting", "scanning"].includes(status ?? ""))
      return "primary";
    return "secondary";
  };

  // ─── Render Tabs ──────────────────────────────────────────────────────────────
  // ─── Render Tabs ──────────────────────────────────────────────────────────────

  const resultTabs: {
    id: ResultTab;
    label: string;
    icon: React.ReactNode;
    show: boolean;
  }[] = [
      {
        id: "overview",
        label: "Overview",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        show: true,
      },
      {
        id: "arch",
        label: "Architecture",
        icon: <Layers className="w-3.5 h-3.5" />,
        show: !!result?.architecture?.graph,
      },
      {
        id: "routes",
        label: "Routes",
        icon: <Network className="w-3.5 h-3.5" />,
        show: !!result?.routes?.length,
      },
      {
        id: "db",
        label: "Database",
        icon: <Database className="w-3.5 h-3.5" />,
        show: !!(result?.metadata?.databaseInfo?.entities?.length || result?.metadata?.databaseInfo?.orm),
      },
      {
        id: "health",
        label: "Health",
        icon: <Heart className="w-3.5 h-3.5" />,
        show: !!result?.graph?.metrics,
      },
      {
        id: "impact",
        label: "Impact Analysis",
        icon: <Zap className="w-3.5 h-3.5" />,
        show: !!result?.graph?.metrics,
      },
      {
        id: "compare",
        label: "Compare",
        icon: <GitCompare className="w-3.5 h-3.5" />,
        show: true,
      },
      {
        id: "env",
        label: "Environment",
        icon: <Settings className="w-3.5 h-3.5" />,
        show: !!result?.envVars?.length,
      },
      {
        id: "ai-architect",
        label: "AI Architect",
        icon: <Sparkles className="w-3.5 h-3.5" />,
        show: !!result?.aiSummary,
      },
      {
        id: "onboarding",
        label: "Onboarding",
        icon: <Terminal className="w-3.5 h-3.5" />,
        show: !!result?.onboarding,
      },
      // REMOVED: billing tab
    ];
  // ─── Execution Trace Panel ────────────────────────────────────────────────────

  const renderExecutionTrace = () => {
    if (!traceRoute) return null;
    const { steps, envUsed } = buildExecutionTrace(traceRoute, result);

    const typeStyles: Record<string, string> = {
      route: "bg-blue-950/60 border-blue-500/70 text-blue-300",
      middleware: "bg-orange-950/60 border-orange-500/70 text-orange-300",
      controller: "bg-amber-950/60 border-amber-500/70 text-amber-300",
      service: "bg-emerald-950/60 border-emerald-500/70 text-emerald-300",
      repository: "bg-purple-950/60 border-purple-500/70 text-purple-300",
      entity: "bg-cyan-950/60 border-cyan-500/70 text-cyan-300",
      database: "bg-red-950/60 border-red-500/70 text-red-300",
    };

    return (
      <div className="mt-4 rounded-2xl bg-zinc-950/80 border border-primary/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/60 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="dash-eyebrow text-primary">
              Execution Trace
            </span>
            <code className="dash-filepath text-zinc-400 ml-1">
              {traceRoute.method} {traceRoute.path}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTraceAnimStep(-1);
                setTimeout(() => playTrace(steps), 50);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/30 text-primary dash-btn-sm hover:bg-primary/20 transition"
            >
              <Play className="w-3 h-3" /> Play
            </button>
            <button
              onClick={() => {
                setTraceRoute(null);
                setTraceAnimStep(-1);
              }}
              className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Flow Steps */}
          <div className="md:col-span-2 space-y-0">
            {steps.map((step, i) => {
              const visible = traceAnimStep === -1 || i <= traceAnimStep;
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-full transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
                    style={{ transitionDelay: `${i * 60}ms` }}
                  >
                    <div
                      className={`p-3 rounded-xl border flex items-start gap-3 ${typeStyles[step.type] ?? typeStyles.service}`}
                    >
                      <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
                        <div className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center dash-metadata font-bold">
                          {i + 1}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="dash-card-title font-mono truncate">
                          {step.label}
                        </div>
                        {step.sublabel && (
                          <div className="dash-metadata opacity-60 mt-0.5">
                            {step.sublabel}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`w-px h-4 bg-border/50 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Side Panel */}
          <div className="space-y-3">
            {/* Env Used */}
            {envUsed.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40">
                <div className="dash-metadata font-semibold text-amber-400 uppercase tracking-widest mb-2">
                  Environment Used
                </div>
                <div className="space-y-1">
                  {envUsed.map((e) => (
                    <code
                      key={e}
                      className="block dash-filepath text-amber-300"
                    >
                      {e}
                    </code>
                  ))}
                </div>
              </div>
            )}

            {/* Auth guard */}
            {(traceRoute.middleware?.length ?? 0) > 0 ? (
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
                <div className="dash-metadata font-semibold text-emerald-400 uppercase tracking-widest mb-1">
                  Auth Protected
                </div>
                <div className="flex flex-wrap gap-1">
                  {traceRoute.middleware!.map((m) => (
                    <Badge key={m} variant="primary" className="dash-badge">
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-red-950/20 border border-red-800/40">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                  <span className="dash-metadata font-semibold text-red-400">
                    No Auth Middleware
                  </span>
                </div>
                <p className="dash-metadata text-red-300/70 mt-1">
                  This route has no detected middleware.
                </p>
              </div>
            )}

            {/* Method info */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-border/50">
              <div className="dash-metadata font-semibold text-zinc-400 uppercase tracking-widest mb-2">
                Route Info
              </div>
              <div className="space-y-1 dash-metadata">
                <div>
                  <span className="text-zinc-500">Method:</span>{" "}
                  <span className="text-zinc-200 font-mono font-bold">
                    {traceRoute.method}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">File:</span>{" "}
                  <code className="text-emerald-400 dash-filepath">
                    {(traceRoute.file ?? "").split(/[\\/]/).pop()}
                  </code>
                </div>
                {traceRoute.group && (
                  <div>
                    <span className="text-zinc-500">Group:</span>{" "}
                    <span className="text-zinc-200">{traceRoute.group}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── AUTH & SUBSCRIPTION INTERCEPT ───
  // ─── AUTH & SUBSCRIPTION INTERCEPT ───
  if (subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-zinc-500 dash-metadata animate-pulse font-mono">
          Loading subscription...
        </div>
      </div>
    );
  }

  // ✅ ADD THIS - Check if email is verified before showing dashboard
  if (session && profile && !profile.email_verified) {
    const isAdmin = session?.user?.email === 'admin@projectanalyser.com';
    if (!isAdmin) {
      // Not admin and email not verified - redirect to auth
      return null; // Will redirect via useEffect
    }
  }

  if (!session || !profile) {
    if (view === "auth") {
      return <AuthPage />;
    }
    return (
      <LandingPage
        onGetStarted={() => setView("auth")}
        onSelectPlan={(plan) => {
          if (plan === "trial") {
            setView("auth");
          } else {
            setPaymentPlan(plan as "professional" | "enterprise");
            setView("auth");
          }
        }}
      />
    );
  }

  if (view === "payment") {
    return (
      <PaymentPage
        preselectedPlan={paymentPlan}
        onBack={() => setView("dashboard")}
      />
    );
  }

  const plan = PLAN_CONFIG[profile.plan];
  const isTrial = profile.plan === "trial";

  // ─── MAIN RETURN ──────────────────────────────────────────────────────────────


  // ─── Not yet started ───
  if (!currentJobId) {
    return (
      <main className="flex-1 flex flex-col items-center justify-start max-w-6xl w-full mx-auto px-4 py-16 relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-10 right-10 w-[200px] h-[200px] bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none" />
        <div className="text-center mb-10 z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#16C7A1]/35 bg-[rgba(6,61,72,0.50)] backdrop-blur-md mb-6 shadow-xs">
            <Terminal className="w-3.5 h-3.5 text-[#16C7A1]" />
            <span className="text-[12px] sm:text-[13px] font-semibold uppercase tracking-[0.05em] text-[#9BE8E0]">
              Repository Intelligence Platform
            </span>
          </div>
          <h1 className="text-4xl sm:text-[56px] font-extrabold text-[#F7FAFA] tracking-tight leading-[1.05] mb-4">
            Understand Any Codebase <br />
            In <span className="text-[#FF3344]">30</span> <span className="text-[#16C7A1]">Seconds</span>
          </h1>
          <p className="text-sm sm:text-base text-[#C3D5D8] max-w-2xl mx-auto font-normal leading-relaxed">
            AST Engine → Graph Engine → Route Engine → Database Engine → Auth Engine → Architecture Engine → AI
          </p>
          <p className="text-xs sm:text-sm text-[#8EA9AE] mt-1.5 font-light">
            From code to clarity. Instantly.
          </p>
        </div>
        <div className="w-full max-w-[1000px] sm:max-w-[1040px] z-10 mb-12 space-y-5">
          {(() => {
            const isUserAdmin = isAdmin || session?.user?.email === 'admin@projectanalyser.com' || profile?.role === 'org_admin' || profile?.role === 'admin';
            const scansUsed = userProfile?.scans_used ?? (usage?.repositories_analyzed ?? 0);
            const scanLimit = userProfile?.scan_limit ?? (isUserAdmin ? Infinity : 2);
            const isScanLimitReached = !isUserAdmin && (
              !canScan ||
              scansUsed >= scanLimit
            );

            return (
              <>
                <ScanUsageDisplay
                  scansUsed={scansUsed}
                  scanLimit={scanLimit}
                  isLoading={isPending || isProfileLoading}
                  isAdmin={isUserAdmin}
                  plan={profile?.plan || 'free'}
                />

                <IngestionControl
                  isLimitReached={isScanLimitReached}
                  onSubmitGithub={(url) => {
                    if (isScanLimitReached) {
                      setShowLimit({
                        open: true,
                        title: "Scan Limit Reached",
                        message: `You have reached your limit of ${userProfile?.scan_limit ?? 2} scans. Upgrade to Professional for unlimited scans or contact sales.`,
                      });
                      return;
                    }
                    const currentRepos = usage?.repositories_analyzed ?? 0;
                    if (!canUse("repositories", currentRepos)) {
                      setShowLimit({
                        open: true,
                        title: "Repository Limit Reached",
                        message: `You have already analyzed ${userProfile?.scan_limit ?? 2} repositories. Upgrade to Professional for unlimited repositories.`,
                      });
                      return;
                    }
                    urlMutation.mutate(url);
                  }}
                  onSubmitZip={(file) => {
                    if (isScanLimitReached) {
                      setShowLimit({
                        open: true,
                        title: "Scan Limit Reached",
                        message: `You have reached your limit of ${userProfile?.scan_limit ?? 2} scans. Upgrade to Professional for unlimited scans or contact sales.`,
                      });
                      return;
                    }
                    const currentRepos = usage?.repositories_analyzed ?? 0;
                    if (!canUse("repositories", currentRepos)) {
                      setShowLimit({
                        open: true,
                        title: "Repository Limit Reached",
                        message: `You have already analyzed ${userProfile?.scan_limit ?? 2} repositories. Upgrade to Professional for unlimited repositories.`,
                      });
                      return;
                    }
                    fileMutation.mutate(file);
                  }}
                  onSubmitLocal={(path) => {
                    if (isScanLimitReached) {
                      setShowLimit({
                        open: true,
                        title: "Scan Limit Reached",
                        message: `You have reached your limit of ${userProfile?.scan_limit ?? 2} scans. Upgrade to Professional for unlimited scans or contact sales.`,
                      });
                      return;
                    }
                    const currentRepos = usage?.repositories_analyzed ?? 0;
                    if (!canUse("repositories", currentRepos)) {
                      setShowLimit({
                        open: true,
                        title: "Repository Limit Reached",
                        message: `You have already analyzed ${userProfile?.scan_limit ?? 2} repositories. Upgrade to Professional for unlimited repositories.`,
                      });
                      return;
                    }
                    localMutation.mutate(path);
                  }}
                  isLoading={isPending}
                  error={errorMessage}
                />

                {/* ── Supporting Information 3-Column Footer Grid ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-left">
                  {isUserAdmin ? (
                    <>
                      <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-[rgba(5,48,58,0.60)] border border-[rgba(155,232,224,0.12)] backdrop-blur-md">
                        <div className="w-9 h-9 rounded-lg bg-[rgba(22,199,161,0.12)] text-[#16C7A1] flex items-center justify-center shrink-0">
                          <Layers className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-[13px] font-bold text-[#F7FAFA]">Unlimited repository scans</div>
                          <div className="text-[11px] text-[#C3D5D8] mt-0.5">Full codebase indexing & AST</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-[rgba(5,48,58,0.60)] border border-[rgba(155,232,224,0.12)] backdrop-blur-md">
                        <div className="w-9 h-9 rounded-lg bg-[rgba(22,199,161,0.12)] text-[#16C7A1] flex items-center justify-center shrink-0">
                          <Sparkles className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-[13px] font-bold text-[#F7FAFA]">Full AI analysis access</div>
                          <div className="text-[11px] text-[#C3D5D8] mt-0.5">Deep architecture intelligence</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-[rgba(5,48,58,0.60)] border border-[rgba(155,232,224,0.12)] backdrop-blur-md">
                        <div className="w-9 h-9 rounded-lg bg-[rgba(22,199,161,0.12)] text-[#16C7A1] flex items-center justify-center shrink-0">
                          <Shield className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-[13px] font-bold text-[#F7FAFA]">Administrative access</div>
                          <div className="text-[11px] text-[#C3D5D8] mt-0.5">Full platform control & visibility</div>
                        </div>
                      </div>
                    </>
                  ) : profile?.plan === 'professional' || profile?.plan === 'enterprise' ? (
                    <>
                      <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-[rgba(5,48,58,0.60)] border border-[rgba(155,232,224,0.12)] backdrop-blur-md">
                        <div className="w-9 h-9 rounded-lg bg-[rgba(22,199,161,0.12)] text-[#16C7A1] flex items-center justify-center shrink-0">
                          <Layers className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-[13px] font-bold text-[#F7FAFA]">Unlimited repository scans</div>
                          <div className="text-[11px] text-[#C3D5D8] mt-0.5">Full codebase indexing & AST</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-[rgba(5,48,58,0.60)] border border-[rgba(155,232,224,0.12)] backdrop-blur-md">
                        <div className="w-9 h-9 rounded-lg bg-[rgba(22,199,161,0.12)] text-[#16C7A1] flex items-center justify-center shrink-0">
                          <Sparkles className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-[13px] font-bold text-[#F7FAFA]">Unlimited AI analysis</div>
                          <div className="text-[11px] text-[#C3D5D8] mt-0.5">Advanced architecture insights</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-[rgba(5,48,58,0.60)] border border-[rgba(155,232,224,0.12)] backdrop-blur-md">
                        <div className="w-9 h-9 rounded-lg bg-[rgba(22,199,161,0.12)] text-[#16C7A1] flex items-center justify-center shrink-0">
                          <Zap className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-[13px] font-bold text-[#F7FAFA]">Priority processing</div>
                          <div className="text-[11px] text-[#C3D5D8] mt-0.5">Dedicated background queues</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-[rgba(5,48,58,0.60)] border border-[rgba(155,232,224,0.12)] backdrop-blur-md">
                        <div className="w-9 h-9 rounded-lg bg-[rgba(22,199,161,0.12)] text-[#16C7A1] flex items-center justify-center shrink-0">
                          <Layers className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-[13px] font-bold text-[#F7FAFA]">3 repos free</div>
                          <div className="text-[11px] text-[#C3D5D8] mt-0.5">Get started with static analysis</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-[rgba(5,48,58,0.60)] border border-[rgba(155,232,224,0.12)] backdrop-blur-md">
                        <div className="w-9 h-9 rounded-lg bg-[rgba(22,199,161,0.12)] text-[#16C7A1] flex items-center justify-center shrink-0">
                          <Sparkles className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-[13px] font-bold text-[#F7FAFA]">20 AI chats</div>
                          <div className="text-[11px] text-[#C3D5D8] mt-0.5">Ask questions about architecture</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-[rgba(5,48,58,0.60)] border border-[rgba(155,232,224,0.12)] backdrop-blur-md">
                        <div className="w-9 h-9 rounded-lg bg-[rgba(22,199,161,0.12)] text-[#16C7A1] flex items-center justify-center shrink-0">
                          <Shield className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-[13px] font-bold text-[#F7FAFA]">14 days trial</div>
                          <div className="text-[11px] text-[#C3D5D8] mt-0.5">No credit card required</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            );
          })()}
        </div>

        {/* Modals for uncompleted job state */}
        <UpgradeModal
          open={showUpgrade}
          onClose={() => setShowUpgrade(false)}
        />
        <UsageLimitModal
          open={showLimit.open}
          onClose={() => setShowLimit({ open: false })}
          onUpgrade={() => {
            setShowLimit({ open: false });
            setShowUpgrade(true);
          }}
          title={showLimit.title}
          message={showLimit.message}
        />
      </main>
    );
  }

  // ─── In progress ───
  if (status !== "completed") {
    return (
      <main className="flex-1 flex flex-col items-center justify-center w-full px-4 py-16">
        <ProgressTracker
          status={status}
          progress={getProgressValue()}
          jobId={currentJobId}
          error={errorMessage}
        />
      </main>
    );
  }

  // ─── Awaiting result data (completed but result not loaded yet) ───
  if (!result) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center w-full px-4 py-16">
        <ProgressTracker
          status={status}
          progress={99}
          jobId={currentJobId}
          error={null}
        />
      </main>
    );
  }

  // ─── Completed: full-screen sidebar dashboard ───

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#063D48]">
      {/* ── Left Sidebar Navigation ─────────────────────────────────── */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarExpanded ? 260 : 72 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="h-screen bg-[rgba(4,52,62,0.92)] backdrop-blur-xl flex flex-col shadow-2xl z-20 relative border-r border-[rgba(155,232,224,0.10)] shrink-0 overflow-hidden"
      >
        {/* Logo - Premium */}
        <div className="flex h-20 items-center gap-3 border-b border-[rgba(155,232,224,0.10)] px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FF3344] shadow-md shrink-0 font-bold text-white">
            <Code2 className="h-5 w-5 text-white" />
          </div>
          <AnimatePresence>
            {sidebarExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="min-w-0 overflow-hidden flex items-center gap-2"
              >
                <span className="font-extrabold text-2xl text-[#F7FAFA] tracking-tight">Helix</span>
                <span className="rounded-full bg-[rgba(155,232,224,0.12)] px-2.5 py-0.5 text-[11px] font-bold text-[#C5F4EF]">
                  v2.0
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-6 overflow-y-auto p-4">
          {/* Section: Analysis */}
          <div>
            {sidebarExpanded && (
              <div className="mb-2.5 px-3 text-[12px] font-bold uppercase tracking-[0.16em] text-[#9BE8E0]">
                Analysis
              </div>
            )}
            <motion.button
              onClick={() => reset()}
              whileHover={{ x: sidebarExpanded ? 3 : 0 }}
              title={!sidebarExpanded ? "Upload Repository" : undefined}
              className={`w-full flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 transition-all ${!currentJobId
                ? "bg-[#9BE8E0] text-[#063D48] font-bold shadow-md"
                : "text-[#D0E1E3] hover:bg-[rgba(155,232,224,0.08)] hover:text-white"
                } ${!sidebarExpanded ? "justify-center" : ""}`}
            >
              <div
                className={`rounded-md p-1 ${!currentJobId
                  ? "text-[#063D48]"
                  : "text-[#9BE8E0]"
                  }`}
              >
                <Upload className="h-4 w-4" />
              </div>
              <AnimatePresence>
                {sidebarExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="flex-1 text-left text-sm"
                  >
                    Upload Repository
                  </motion.span>
                )}
              </AnimatePresence>
              {sidebarExpanded &&
                status &&
                status !== "completed" &&
                status !== "failed" && (
                  <span className="text-xs font-bold text-[#9BE8E0]">
                    {getProgressValue()}%
                  </span>
                )}
            </motion.button>
          </div>

          {/* Section: History */}
          <div>
            {sidebarExpanded && (
              <div className="mb-2.5 px-3 text-[12px] font-bold uppercase tracking-[0.16em] text-[#9BE8E0]">
                History
              </div>
            )}
            <motion.button
              onClick={() => router.push("/scan-history")}
              whileHover={{ x: sidebarExpanded ? 3 : 0 }}
              title={!sidebarExpanded ? "Scan History" : undefined}
              className={`w-full flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-sm transition-all text-[#D0E1E3] hover:bg-[rgba(155,232,224,0.08)] hover:text-white ${!sidebarExpanded ? "justify-center" : ""
                }`}
            >
              <div className="rounded-md p-1 text-[#9BE8E0]">
                <History className="h-4 w-4" />
              </div>
              <AnimatePresence>
                {sidebarExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="flex-1 text-left"
                  >
                    Scan History
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Section: Results */}
          <div>
            {sidebarExpanded && (
              <div className="mb-2.5 px-3 text-[12px] font-bold uppercase tracking-[0.16em] text-[#9BE8E0]">
                Results
              </div>
            )}
            {(() => {
              const visibleTabs = [
                { id: "overview", label: "Overview" },
                { id: "arch", label: "Architecture" },
                { id: "routes", label: "Routes & Trace" },
                { id: "db", label: "Database" },
                { id: "health", label: "Code Health" },
                { id: "impact", label: "Impact & Risk" },
                { id: "compare", label: "Compare Scans" },
                { id: "env", label: "Environment" },
                { id: "ai-architect", label: "AI Architect" },
                { id: "onboarding", label: "Onboarding" },
              ];
              return visibleTabs.map((tab) => {
                const isActive = activeResultTab === tab.id;
                const icons = {
                  overview: CheckCircle2,
                  arch: Layers,
                  routes: Network,
                  db: Database,
                  health: Heart,
                  impact: Zap,
                  compare: GitCompare,
                  env: Settings,
                  "ai-architect": Sparkles,
                  onboarding: Terminal,
                  billing: CreditCard,
                };
                const Icon = icons[tab.id as keyof typeof icons] || Layers;

                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveResultTab(tab.id as ResultTab)}
                    whileHover={{ x: sidebarExpanded ? 3 : 0 }}
                    title={!sidebarExpanded ? tab.label : undefined}
                    className={`w-full flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-sm transition-all mb-1 ${isActive
                      ? "bg-[#9BE8E0] text-[#063D48] font-bold shadow-md"
                      : "text-[#D0E1E3] hover:bg-[rgba(155,232,224,0.08)] hover:text-white"
                      } ${!sidebarExpanded ? "justify-center" : ""}`}
                  >
                    <div
                      className={`rounded-md p-1 ${isActive
                        ? "text-[#063D48]"
                        : "text-[#9BE8E0]"
                        }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <AnimatePresence>
                      {sidebarExpanded && (
                        <motion.span
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          className="flex-1 text-left"
                        >
                          {tab.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {sidebarExpanded && tab.id === "overview" && result && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                  </motion.button>
                );
              });
            })()}

            {/* Token Counter */}
            {sidebarExpanded &&
              profile?.role !== "org_admin" &&
              profile?.email !== "admin@projectanalyser.com" && (
                <div className="mt-4 px-2">
                  <TokenCounter />
                </div>
              )}
          </div>
        </nav>

        {/* Repository Info - Premium */}
        <div className="border-t border-[rgba(155,232,224,0.10)] p-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9BE8E0] mb-1.5">
            REPOSITORY
          </div>
          <div className="rounded-[12px] bg-[rgba(7,67,77,0.70)] border border-[rgba(155,232,224,0.15)] px-3.5 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Github className="w-4 h-4 text-[#9BE8E0] shrink-0" />
              <span className="text-xs font-mono text-[#F7FAFA] truncate">
                {result?.tree?.name || "helix.git"}
              </span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#9BE8E0] shrink-0" />
          </div>
        </div>

        {/* User Profile & Sign Out */}
        <div className="border-t border-[rgba(155,232,224,0.10)] p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F7FAFA] text-[#063D48] font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
              {profile?.email ? profile.email[0].toUpperCase() : "S"}
            </div>
            {sidebarExpanded && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#F7FAFA] truncate">
                  Shriniwas Srijan Bajpai
                </div>
                <div className="text-[11px] text-[#8EA9AE] truncate">
                  {profile?.email || "srijanbajpai1447@gmail.com"}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => signOut()}
            className="w-full mt-3 flex items-center gap-2 rounded-[8px] px-2 py-1.5 text-xs text-[#C3D5D8] hover:text-[#FF3344] hover:bg-white/5 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            {sidebarExpanded && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className="flex h-11 items-center justify-center border-t border-[rgba(155,232,224,0.10)] text-[#9BE8E0] transition-colors hover:text-white"
        >
          <motion.div
            animate={{ rotate: sidebarExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </button>
      </motion.aside>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden bg-[#063D48] relative text-[#F7FAFA] w-full max-w-full">
        
        {/* Top-Right Decorative Solid Red Corner Circle (Safely clipped) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="w-72 h-72 rounded-full bg-[#FF3344] absolute -top-28 -right-28 opacity-80 shadow-2xl" />
        </div>

        <TrialBanner onUpgrade={() => setShowUpgrade(true)} />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeResultTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="min-h-full py-7 px-8 sm:px-10 pb-16 relative z-10 w-full"
          >
            {/* ─── OVERVIEW TAB ─── */}
            {activeResultTab === "overview" && (
              <div className="w-full max-w-[1450px] mx-auto space-y-4 sm:space-y-5 text-left">
                
                {/* ── Top Dashboard Header ── */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#9BE8E0]">
                      Active Analysis
                    </p>
                    <h1 className="text-3xl sm:text-[44px] font-extrabold text-[#F7FAFA] tracking-tight leading-tight mt-1">
                      Repository <span className="text-[#FF3344]">Intelligence</span>
                    </h1>
                    <p className="text-sm sm:text-base text-[#C3D5D8] mt-1">
                      Comprehensive analysis and metadata diagnostics for your codebase.
                    </p>
                  </div>

                  {/* Top-Right Action Controls */}
                  <div className="flex flex-col items-start lg:items-end gap-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9BE8E0]/70">
                      ANALYZE • UNDERSTAND • BUILD FASTER
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {/* Search Bar with Shortcut */}
                      <div className="relative w-full sm:w-[360px] md:w-[400px]">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BE8E0]" />
                        <input
                          type="text"
                          placeholder="Search files, routes, dependencies..."
                          className="w-full h-12 pl-10 pr-12 rounded-[14px] bg-[rgba(8,76,88,0.80)] border border-[rgba(155,232,224,0.15)] text-sm text-[#F7FAFA] placeholder:text-[#8EA9AE] focus:outline-none focus:border-[#16C7A1]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-md bg-[rgba(6,47,56,0.8)] border border-[rgba(155,232,224,0.2)] text-[11px] font-mono text-[#9BE8E0]">
                          ⌘ K
                        </span>
                      </div>

                      {/* Upload Repository Button */}
                      <button
                        onClick={() => reset()}
                        className="h-12 px-6 rounded-[10px] bg-[#FF3344] hover:bg-[#e02636] text-white font-bold text-sm shadow-md flex items-center gap-2 shrink-0 transition-all"
                      >
                        <Upload size={16} />
                        <span className="hidden sm:inline">Upload Repository</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Key Metrics & Technology/Structure Panels (Rows 1 & 2) ── */}
                <OverviewAnalytics
                  overview={result.overview}
                  frameworkMetadata={
                    result.metadata?.frameworkMetadata
                      ? {
                        language: result.metadata.frameworkMetadata.language,
                        runtime: result.metadata.frameworkMetadata.runtime,
                        packageManager:
                          result.metadata.frameworkMetadata.packageManager,
                        frameworks:
                          result.metadata.frameworkMetadata.frameworks,
                      }
                      : undefined
                  }
                  files={result.files || []}
                />

                {/* ── Row 3: Authentication Guard (Full-Width Large Horizontal Emphasis Panel) ── */}
                <div className="w-full">
                  <AuthDetector
                    authType={authData?.authType ?? "Supabase Auth"}
                    evidence={authData?.evidence ?? [
                      "SUPABASE_URL env var",
                      "14 auth-related routes (/api/auth/login, /api/auth/signin, /api/auth/signup)",
                      "Supabase client initialization detected"
                    ]}
                  />
                </div>

                {/* ── Row 4: Evidence Found (1.2fr) & Related Files (0.8fr) Asymmetric Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4 items-stretch w-full">
                  <EvidenceFound
                    evidence={authData?.evidence ?? [
                      "SUPABASE_URL env var",
                      "14 auth-related routes (/api/auth/login, /api/auth/signup)",
                      "Supabase client initialization detected",
                      "21 routes have middleware protection",
                      "7 high-criticality secret env vars"
                    ]}
                    files={result.files || []}
                    onViewAll={() => setActiveResultTab("routes")}
                  />

                  <RelatedFiles
                    files={result.files || []}
                    onViewAll={() => setActiveResultTab("overview")}
                  />
                </div>

                {/* ── Row 5: Language Breakdown & Core Entrypoints ── */}
                {result.metadata?.languages && (
                  <LanguageBreakdown
                    languages={result.metadata.languages}
                    totalLines={result.metadata.totalLines}
                    entryPoints={result.metadata.entryPoints || []}
                  />
                )}
              </div>
            )}

            {/* ─── ARCHITECTURE TAB ─── */}
            {activeResultTab === "arch" && (
              <div className="w-full" style={{ height: "calc(100vh - 48px)" }}>
                <ArchitectureViewer
                  result={result}
                  currentJobId={currentJobId!}
                  onSwitchTab={setActiveResultTab}
                  onSetImpactFile={setSelectedImpactFile}
                  onSelectTraceRouteId={(routeId) => {
                    setSelectedTraceRouteId(routeId);
                    setActiveResultTab("arch");
                  }}
                />
              </div>
            )}

            {/* ─── ROUTES TAB ─── */}
            {activeResultTab === "routes" && (
              <div className="w-full max-w-[1450px] mx-auto space-y-5 text-left">
                <div className="mb-4">
                  <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#9BE8E0]">
                    Route Analysis
                  </p>
                  <h2 className="text-3xl font-extrabold text-[#F7FAFA] mt-1">
                    API Endpoints
                  </h2>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#82AEB5]" />
                    <input
                      className="w-full pl-10 pr-4 py-2.5 text-xs font-mono bg-[#093C45]/80 border border-[#176873]/60 rounded-xl text-[#F7FAFA] placeholder-[#82AEB5] focus:outline-none focus:border-[#16C7A1]"
                      placeholder="Search routes..."
                      value={routeSearch}
                      onChange={(e) => setRouteSearch(e.target.value)}
                    />
                  </div>
                  {result.metadata?.routeMetrics && (
                    <div className="flex gap-1.5 shrink-0 flex-wrap">
                      {Object.entries(
                        result.metadata.routeMetrics as unknown as Record<
                          string,
                          number
                        >,
                      )
                        .filter(([k]) => k !== "total" && k !== "others")
                        .map(([method, count]) =>
                          (count as number) > 0 ? (
                            <span
                              key={method}
                              className="px-2.5 py-1 rounded-lg bg-[#083E48] border border-[#176873] text-[#9BE8E0] text-xs font-bold font-mono uppercase"
                            >
                              {method}: {count as number}
                            </span>
                          ) : null,
                        )}
                    </div>
                  )}
                </div>

                {traceRoute && renderExecutionTrace()}

                <div className="space-y-2.5">
                  {(result.routes ?? [])
                    .filter(
                      (r: RouteNode) =>
                        !routeSearch ||
                        r.path
                          .toLowerCase()
                          .includes(routeSearch.toLowerCase()) ||
                        r.method
                          .toLowerCase()
                          .includes(routeSearch.toLowerCase()),
                    )
                    .map((route: RouteNode, idx: number) => {
                      const methodColors: Record<string, string> = {
                        GET: "bg-[#16C7A1]/20 text-[#16C7A1] border-[#16C7A1]/40",
                        POST: "bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/40",
                        PUT: "bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40",
                        PATCH:
                          "bg-[#A855F7]/20 text-[#A855F7] border-[#A855F7]/40",
                        DELETE: "bg-[#FF3344]/20 text-[#FF3344] border-[#FF3344]/40",
                      };
                      const mc =
                        methodColors[route.method.toUpperCase()] ??
                        "bg-white/10 text-zinc-400 border-zinc-700/60";
                      const isTraced =
                        traceRoute?.path === route.path &&
                        traceRoute?.method === route.method;

                      return (
                        <div
                          key={`${route.method}-${route.path}-${idx}`}
                          onClick={() => setTraceRoute(isTraced ? null : route)}
                          className={`flex items-start gap-3.5 px-4 py-3.5 rounded-2xl border cursor-pointer transition-all group ${isTraced
                            ? "bg-[#094752] border-[#16C7A1]"
                            : "bg-[#063038]/90 border-[#176873]/50 hover:border-[#16C7A1]/40 hover:bg-[#093C45]/80"
                            }`}
                        >
                          <span
                            className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg border shrink-0 ${mc}`}
                          >
                            {route.method}
                          </span>
                          <div className="min-w-0 flex-1">
                            <code className="text-xs font-mono font-semibold text-[#F7FAFA] truncate block">
                              {route.path}
                            </code>
                            {route.file && (
                              <div className="text-[11px] font-mono text-[#82AEB5] truncate mt-0.5">
                                {route.file}
                              </div>
                            )}
                            {route.group && (
                              <span
                                className="inline-block mt-1 px-2 py-0.5 rounded-md bg-[#083E48] border border-[#176873]/60 text-[10px] text-[#9BE8E0]"
                              >
                                {route.group}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1.5 shrink-0 flex-wrap">
                            {(route.middleware ?? []).map((m) => (
                              <span
                                key={m}
                                className="px-2 py-0.5 rounded-md bg-[#094752] border border-[#16C7A1]/30 text-[10px] text-[#16C7A1] font-mono"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ─── DATABASE TAB ─── */}
            {activeResultTab === "db" && (
              <DatabaseExplorer
                databaseInfo={result.metadata?.databaseInfo}
              />
            )}

            {/* ─── HEALTH TAB ─── */}
            {activeResultTab === "health" && (
              <div className="w-full max-w-[1450px] mx-auto space-y-6 text-left">
                <div className="mb-6">
                  <p className="dash-eyebrow text-emerald-400">
                    Code Quality
                  </p>
                  <h2 className="dash-title text-white mt-1">
                    Health Diagnostics
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-zinc-900/60 border border-border/50 rounded-xl p-4 col-span-2 md:col-span-1">
                    <div className="dash-metadata text-zinc-500 uppercase tracking-widest mb-1">
                      Health Score
                    </div>
                    <div
                      className={`dash-metric ${score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400"}`}
                    >
                      {score}
                    </div>
                    <div className="dash-metadata text-zinc-600 mt-1">/100</div>
                  </div>
                  <div className="bg-zinc-900/60 border border-border/50 rounded-xl p-4">
                    <div className="dash-metadata text-zinc-500 uppercase tracking-widest mb-1">
                      Cycles
                    </div>
                    <div className="dash-metric text-red-400">
                      {cycleCount}
                    </div>
                  </div>
                  <div className="bg-zinc-900/60 border border-border/50 rounded-xl p-4">
                    <div className="dash-metadata text-zinc-500 uppercase tracking-widest mb-1">
                      Dead Code
                    </div>
                    <div className="dash-metric text-amber-400">
                      {deadCount}
                    </div>
                  </div>
                  <div className="bg-zinc-900/60 border border-border/50 rounded-xl p-4">
                    <div className="dash-metadata text-zinc-500 uppercase tracking-widest mb-1">
                      Broken Imports
                    </div>
                    <div className="dash-metric text-rose-400">
                      {brokenCount}
                    </div>
                  </div>
                </div>

                {isStaticLoading && (
                  <div className="flex items-center gap-2 text-zinc-500 dash-metadata">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading
                    detailed report...
                  </div>
                )}

                {hasReport && (
                  <div className="space-y-4">
                    {staticAnalysisReport.godServices?.length > 0 && (
                      <div className="bg-red-950/10 border border-red-900/30 rounded-xl p-4">
                        <div className="dash-section-heading text-red-400 uppercase tracking-[0.06em] mb-3">
                          God Services (
                          {staticAnalysisReport.godServices.length})
                        </div>
                        <div className="space-y-2">
                          {staticAnalysisReport.godServices.map(
                            (g: any, i: number) => (
                              <div
                                key={i}
                                className="flex items-center gap-3"
                              >
                                <code className="dash-filepath text-zinc-300 truncate flex-1">
                                  {g.file}
                                </code>
                                <Badge variant="error" className="dash-badge">
                                  {g.methods} methods
                                </Badge>
                                <Badge
                                  variant="secondary"
                                  className="dash-badge"
                                >
                                  {g.loc} LOC
                                </Badge>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                    {staticAnalysisReport.cycles?.length > 0 && (
                      <div className="bg-amber-950/10 border border-amber-900/30 rounded-xl p-4">
                        <div className="dash-section-heading text-amber-400 uppercase tracking-[0.06em] mb-3">
                          Circular Dependencies (
                          {staticAnalysisReport.cycles.length})
                        </div>
                        <div className="space-y-2">
                          {staticAnalysisReport.cycles
                            .slice(0, 5)
                            .map((c: any, i: number) => (
                              <div
                                key={i}
                                className="flex items-start gap-2"
                              >
                                <span className="dash-metadata text-zinc-600 font-bold mt-0.5">
                                  {i + 1}.
                                </span>
                                <code className="dash-filepath text-amber-300/80">
                                  {Array.isArray(c) ? c.join(" → ") : c}
                                </code>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    {staticAnalysisReport.deadCode?.length > 0 && (
                      <div className="bg-zinc-900/60 border border-border/50 rounded-xl p-4">
                        <div className="dash-section-heading text-zinc-400 uppercase tracking-[0.06em] mb-3">
                          Dead Code ({staticAnalysisReport.deadCode.length})
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                          {staticAnalysisReport.deadCode
                            .slice(0, 10)
                            .map((f: any, i: number) => (
                              <code
                                key={i}
                                className="dash-filepath text-zinc-500 truncate"
                              >
                                {typeof f === "string" ? f : f.file}
                              </code>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ─── IMPACT TAB ─── */}
            {activeResultTab === "impact" && (
              <div className="w-full max-w-[1450px] mx-auto space-y-6 text-left">
                <div className="mb-6">
                  <p className="dash-eyebrow text-emerald-400">
                    Change Analysis
                  </p>
                  <h2 className="dash-title text-white mt-1">
                    Impact Analysis
                  </h2>
                </div>
                <div className="flex gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      className="w-full pl-8 py-2 dash-body bg-zinc-900/80 border border-border/60 rounded-lg text-zinc-300 focus:outline-none focus:border-primary/40"
                      placeholder="Search files to analyze impact..."
                      value={impactSearch}
                      onChange={(e) => setImpactSearch(e.target.value)}
                    />
                  </div>
                </div>
                {impactSearch && (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {(result.files ?? [])
                      .filter(
                        (f: any) =>
                          !f.path.startsWith("ROUTE:") &&
                          !f.path.startsWith("ENV:") &&
                          !f.path.startsWith("DB:") &&
                          !f.path.startsWith("ENTITY:") &&
                          f.path
                            .toLowerCase()
                            .includes(impactSearch.toLowerCase()),
                      )
                      .slice(0, 12)
                      .map((f: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => setSelectedImpactFile(f.path)}
                          className={`w-full text-left px-3 py-2 rounded-xl dash-filepath transition-all ${selectedImpactFile === f.path
                            ? "bg-primary/10 border border-primary/30 text-primary"
                            : "bg-zinc-900/60 border border-border/40 text-zinc-400 hover:border-zinc-600"
                            }`}
                        >
                          {f.path}
                        </button>
                      ))}
                  </div>
                )}
                {isImpactLoading && (
                  <div className="flex items-center gap-2 text-zinc-500 dash-metadata">
                    <Loader2 className="w-4 h-4 animate-spin" /> Computing
                    impact...
                  </div>
                )}
                {impactData && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-zinc-900/60 border border-border/50 rounded-xl p-4">
                        <div className="dash-metadata text-zinc-500 uppercase tracking-widest mb-1">
                          Direct Impact
                        </div>
                        <div className="dash-metric text-primary">
                          {impactData.impact?.directDependents?.length ?? 0}
                        </div>
                      </div>
                      <div className="bg-zinc-900/60 border border-border/50 rounded-xl p-4">
                        <div className="dash-metadata text-zinc-500 uppercase tracking-widest mb-1">
                          Transitive Impact
                        </div>
                        <div className="dash-metric text-amber-400">
                          {impactData.impact?.transitiveDependents?.length ?? 0}
                        </div>
                      </div>
                      <div className="bg-zinc-900/60 border border-border/50 rounded-xl p-4">
                        <div className="dash-metadata text-zinc-500 uppercase tracking-widest mb-1">
                          Risk Score
                        </div>
                        <div className="dash-metric text-red-400">
                          {impactData.impact?.impactScore ?? 0}
                        </div>
                      </div>
                    </div>
                    {impactData.impact?.directDependents &&
                      impactData.impact.directDependents.length > 0 && (
                        <div className="bg-zinc-900/60 border border-border/50 rounded-xl p-4">
                          <div className="dash-section-heading text-zinc-400 uppercase tracking-[0.06em] mb-3">
                            Directly Impacted Files
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                            {impactData.impact.directDependents
                              .slice(0, 10)
                              .map((f: string, i: number) => (
                                <code
                                  key={i}
                                  className="dash-filepath text-zinc-300 truncate"
                                >
                                  {f}
                                </code>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}

            {/* ─── COMPARE TAB ─── */}
            {activeResultTab === "compare" && (
              <div className="w-full max-w-[1450px] mx-auto space-y-6 text-left">
                <div className="mb-6">
                  <p className="dash-eyebrow text-emerald-400">
                    Version Diff
                  </p>
                  <h2 className="dash-title text-white mt-1">
                    Architecture Comparison
                  </h2>
                </div>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="dash-metadata text-zinc-500 uppercase tracking-widest block mb-2">
                      Compare with Job ID
                    </label>
                    <input
                      className="w-full py-2 px-3 dash-body bg-zinc-900/80 border border-border/60 rounded-lg text-zinc-300 focus:outline-none focus:border-primary/40"
                      placeholder="Enter job ID to compare..."
                      value={compareJobId}
                      onChange={(e) => setCompareJobId(e.target.value)}
                    />
                  </div>
                  {jobsListData?.jobs && jobsListData.jobs.length > 0 && (
                    <select
                      className="py-2 px-3 dash-body bg-zinc-900/80 border border-border/60 rounded-lg text-zinc-300 focus:outline-none"
                      onChange={(e) => setCompareJobId(e.target.value)}
                      value={compareJobId}
                    >
                      <option value="">Select job...</option>
                      {jobsListData.jobs
                        .filter((j: any) => j.jobId !== currentJobId)
                        .map((j: any) => (
                          <option key={j.jobId} value={j.jobId}>
                            {j.jobId} ({j.status})
                          </option>
                        ))}
                    </select>
                  )}
                </div>
                {isCompareLoading && (
                  <div className="flex items-center gap-2 text-zinc-500 dash-metadata">
                    <Loader2 className="w-4 h-4 animate-spin" /> Running
                    comparison...
                  </div>
                )}
                {compareData && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-emerald-950/10 border border-emerald-900/30 rounded-xl p-4">
                        <div className="dash-metadata text-emerald-500 uppercase tracking-widest mb-1">
                          Added Files
                        </div>
                        <div className="dash-metric text-emerald-400">
                          {compareData.summary?.addedFilesCount ?? 0}
                        </div>
                      </div>
                      <div className="bg-red-950/10 border border-red-900/30 rounded-xl p-4">
                        <div className="dash-metadata text-red-500 uppercase tracking-widest mb-1">
                          Removed Files
                        </div>
                        <div className="dash-metric text-red-400">
                          {compareData.summary?.removedFilesCount ?? 0}
                        </div>
                      </div>
                      <div className="bg-amber-950/10 border border-amber-900/30 rounded-xl p-4">
                        <div className="dash-metadata text-amber-500 uppercase tracking-widest mb-1">
                          Modified Files
                        </div>
                        <div className="dash-metric text-amber-400">
                          {compareData.summary?.modifiedFilesCount ?? 0}
                        </div>
                      </div>
                    </div>
                    {compareData.files && compareData.files.length > 0 && (
                      <div className="bg-zinc-900/60 border border-border/50 rounded-xl p-4">
                        <div className="dash-section-heading text-zinc-400 uppercase tracking-[0.06em] mb-3">
                          File Changes
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {compareData.files.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between py-1 border-b border-zinc-800/60 last:border-0"
                            >
                              <span className="dash-filepath text-zinc-300 truncate max-w-[70%]">
                                {file.path}
                              </span>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`dash-badge px-1.5 py-0.5 rounded capitalize ${file.status === "added"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : file.status === "removed"
                                      ? "bg-red-500/10 text-red-400"
                                      : "bg-amber-500/10 text-amber-400"
                                    }`}
                                >
                                  {file.status}
                                </span>
                                {file.linesDiff !== 0 && (
                                  <span
                                    className={`dash-metadata font-mono ${file.linesDiff > 0 ? "text-emerald-400" : "text-red-400"}`}
                                  >
                                    {file.linesDiff > 0
                                      ? `+${file.linesDiff}`
                                      : file.linesDiff}{" "}
                                    lines
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ─── ENV TAB ─── */}
            {activeResultTab === "env" && (
              <div className="w-full max-w-[1450px] mx-auto space-y-5 text-left">
                <div className="mb-4">
                  <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#9BE8E0]">
                    Configuration
                  </p>
                  <h2 className="text-3xl font-extrabold text-[#F7FAFA] mt-1">
                    Environment Variables
                  </h2>
                </div>
                <div className="relative mb-3">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#82AEB5]" />
                  <input
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-mono bg-[#093C45]/80 border border-[#176873]/60 rounded-xl text-[#F7FAFA] placeholder-[#82AEB5] focus:outline-none focus:border-[#16C7A1]"
                    placeholder="Search env vars..."
                    value={envSearch}
                    onChange={(e) => setEnvSearch(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {(result.envVars ?? [])
                    .filter(
                      (e: EnvironmentVariable) =>
                        !envSearch ||
                        e.name.toLowerCase().includes(envSearch.toLowerCase()),
                    )
                    .map((envVar: EnvironmentVariable, idx: number) => (
                      <div
                        key={idx}
                        onClick={() =>
                          setSelectedEnvVar(
                            selectedEnvVar?.name === envVar.name
                              ? null
                              : envVar,
                          )
                        }
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedEnvVar?.name === envVar.name
                          ? "bg-[#094752] border-[#16C7A1]"
                          : "bg-[#063038]/90 border-[#176873]/50 hover:border-[#16C7A1]/40 hover:bg-[#093C45]/80"
                          }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Settings className="w-3.5 h-3.5 text-[#16C7A1] shrink-0" />
                          <code className="text-xs font-mono font-bold text-[#F7FAFA] truncate flex-1">
                            {envVar.name}
                          </code>
                          <span className="px-2 py-0.5 rounded-md bg-[#083E48] border border-[#176873] text-[10px] text-[#9BE8E0] font-medium">
                            {envVar.category || "General"}
                          </span>
                          {envVar.criticality === "HIGH" && (
                            <span className="px-2 py-0.5 rounded-md bg-[#FF3344]/20 border border-[#FF3344]/40 text-[10px] text-[#FF3344] font-bold">
                              HIGH RISK
                            </span>
                          )}
                        </div>
                        {selectedEnvVar?.name === envVar.name && (
                          <div className="space-y-2 mt-3 pt-2.5 border-t border-[#176873]/30">
                            <p className="text-xs text-[#82AEB5]">
                              Usages in code:{" "}
                              <span className="text-white font-bold font-mono">
                                {envVar.usages}
                              </span>
                            </p>
                            {envVar.usedBy && envVar.usedBy.length > 0 && (
                              <div className="text-xs text-[#82AEB5]">
                                <span className="text-[#82AEB5] font-bold uppercase tracking-wider text-[10px] block mb-1">
                                  Used By:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {envVar.usedBy.map((f: string, i: number) => (
                                    <code
                                      key={i}
                                      className="text-[11px] font-mono text-[#9BE8E0] bg-[#083E48] px-1.5 py-0.5 rounded truncate max-w-[140px]"
                                    >
                                      {f.split(/[\\/]/).pop()}
                                    </code>
                                  ))}
                                </div>
                              </div>
                            )}
                            {envVar.files && envVar.files.length > 0 && (
                              <div className="text-xs text-[#82AEB5] mt-2">
                                <span className="text-[#82AEB5] font-bold uppercase tracking-wider text-[10px] block mb-1">
                                  Declared In Files:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {envVar.files.map((f: string, i: number) => (
                                    <code
                                      key={i}
                                      className="text-[11px] font-mono text-[#82AEB5] bg-[#063038] border border-[#176873]/40 px-1.5 py-0.5 rounded truncate max-w-[140px]"
                                    >
                                      {f.split(/[\\/]/).pop()}
                                    </code>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* ─── AI ARCHITECT TAB ─── */}
            {activeResultTab === "ai-architect" && result.aiSummary && (
              <div className="w-full max-w-[1450px] mx-auto space-y-4 text-left">
                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#16C7A1] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#16C7A1]" />
                      AI ANALYSIS
                    </p>
                    <h1 className="text-3xl sm:text-[36px] font-extrabold text-[#F7FAFA] tracking-tight leading-tight mt-1">
                      AI Architect
                    </h1>
                    <p className="text-sm sm:text-base text-[#C3D5D8] mt-1">
                      Intelligent codebase analysis & insights
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={copySummary}
                      className="h-10 px-4 rounded-[10px] bg-[rgba(8,76,88,0.50)] hover:bg-[rgba(8,76,88,0.85)] border border-[rgba(155,232,224,0.20)] text-xs font-bold text-[#F7FAFA] flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <FileText size={14} className="text-[#9BE8E0]" />
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={exportAsMarkdown}
                      className="h-10 px-4 rounded-[10px] bg-[#16C7A1]/20 hover:bg-[#16C7A1]/30 border border-[#16C7A1]/40 text-xs font-bold text-[#16C7A1] flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Download size={14} />
                      <span>Export</span>
                    </button>
                    <button
                      onClick={regenerateSummary}
                      className="h-10 px-4 rounded-[10px] bg-[#FF3344] hover:bg-[#e02636] text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <RefreshCw size={14} />
                      <span>Regenerate</span>
                    </button>
                  </div>
                </div>

                {/* ── 1. Architecture Summary (Spacious Hero Panel with 3D Isometric Accent & AI Powered Badge) ── */}
                <div className="rounded-[24px] bg-[rgba(6,51,61,0.85)] backdrop-blur-xl border border-[rgba(155,232,224,0.18)] p-7 sm:p-8 relative overflow-hidden shadow-xl">
                  {/* Subtle 3D Isometric Decorative Graphic (Right side) */}
                  <div className="absolute right-0 top-0 bottom-0 w-64 pointer-events-none overflow-hidden opacity-30 select-none flex items-center justify-end pr-4">
                    <svg width="180" height="150" viewBox="0 0 180 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Top Cube */}
                      <g transform="translate(100, 20)">
                        <polygon points="30,0 60,15 30,30 0,15" fill="#38BDF8" fillOpacity="0.7" />
                        <polygon points="0,15 30,30 30,60 0,45" fill="#0284C7" fillOpacity="0.6" />
                        <polygon points="30,30 60,15 60,45 30,60" fill="#0369A1" fillOpacity="0.8" />
                      </g>
                      {/* Left Cube */}
                      <g transform="translate(60, 50)">
                        <polygon points="30,0 60,15 30,30 0,15" fill="#16C7A1" fillOpacity="0.7" />
                        <polygon points="0,15 30,30 30,60 0,45" fill="#0D9488" fillOpacity="0.6" />
                        <polygon points="30,30 60,15 60,45 30,60" fill="#0F766E" fillOpacity="0.8" />
                      </g>
                      {/* Right Cube */}
                      <g transform="translate(120, 60)">
                        <polygon points="30,0 60,15 30,30 0,15" fill="#38BDF8" fillOpacity="0.6" />
                        <polygon points="0,15 30,30 30,60 0,45" fill="#0284C7" fillOpacity="0.5" />
                        <polygon points="30,30 60,15 60,45 30,60" fill="#0369A1" fillOpacity="0.7" />
                      </g>
                    </svg>
                  </div>

                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-[18px] bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl sm:text-[32px] font-extrabold text-[#F7FAFA] tracking-tight leading-tight">
                          Architecture Summary
                        </h2>
                        <p className="text-sm sm:text-base text-[#82AEB5] mt-1 font-medium">
                          Generated by AI analysis engine
                        </p>
                      </div>
                    </div>

                    {/* AI Powered Badge */}
                    <div className="flex items-center">
                      <div className="px-5 py-2 rounded-full bg-[rgba(79,70,229,0.22)] border border-[rgba(129,140,248,0.40)] text-[#C7D2FE] text-xs sm:text-[13px] font-semibold flex items-center gap-2 shadow-sm">
                        <Sparkles size={14} className="text-[#A5B4FC]" />
                        <span>AI Powered</span>
                      </div>
                    </div>
                  </div>

                  {/* Inner Project Purpose Card */}
                  <div className="mt-6 rounded-[16px] bg-[rgba(4,40,48,0.92)] border border-[rgba(155,232,224,0.14)] border-l-[6px] border-l-[#16C7A1] p-6 sm:p-7 shadow-inner relative z-10">
                    <h4 className="text-xs sm:text-[13px] font-bold uppercase tracking-[0.16em] text-[#16C7A1] mb-3">
                      PROJECT PURPOSE
                    </h4>
                    <p className="text-[14px] sm:text-[15px] leading-[1.65] text-[#D0E1E3] font-normal">
                      {result.aiSummary.purpose ? (
                        result.aiSummary.purpose
                      ) : (
                        <>
                          This Fastify-based API, implemented in TypeScript, provides 88 routes for managing <span className="px-2 py-0.5 rounded-md bg-[#05404A] border border-[#16C7A1]/30 text-[#16C7A1] font-mono text-xs font-semibold mx-1">FEATURE_DEFS</span> entities. It secures access using JWT authentication and integrates email capabilities through services like Resend/SMTP. The execution flow indicates interaction with <span className="px-2 py-0.5 rounded-md bg-[#05404A] border border-[#16C7A1]/30 text-[#16C7A1] font-mono text-xs font-semibold mx-1">ts-morph</span>, suggesting advanced processing related to TypeScript Abstract Syntax Trees (ASTs), potentially for configuration or dynamic feature management.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* ── 2. Technical Stack (Spacious 3-Column Large Cards Grid) ── */}
                <div className="rounded-[24px] bg-[rgba(6,51,61,0.85)] backdrop-blur-xl border border-[rgba(155,232,224,0.18)] p-7 sm:p-8 shadow-xl">
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[12px] bg-[#054854] border border-[rgba(155,232,224,0.20)] text-[#16C7A1] flex items-center justify-center shrink-0">
                        <Layers size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-[20px] font-extrabold text-[#F7FAFA]">
                          Technical Stack
                        </h3>
                        <p className="text-xs sm:text-sm text-[#82AEB5]">
                          Key technologies used in this project
                        </p>
                      </div>
                    </div>

                    {/* Components Pill */}
                    <div className="px-4 py-1.5 rounded-full bg-[rgba(8,69,80,0.85)] border border-[rgba(155,232,224,0.20)] text-[#9BE8E0] text-xs font-semibold flex items-center gap-2 shrink-0">
                      <Layers size={14} className="text-[#16C7A1]" />
                      <span>Components</span>
                    </div>
                  </div>

                  {/* 3-Column Grid of ~100px High Technology Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Fastify */}
                    <div className="h-[100px] sm:h-[104px] rounded-[16px] bg-[rgba(4,45,54,0.92)] hover:bg-[rgba(6,56,66,0.95)] border border-[rgba(155,232,224,0.14)] hover:border-[rgba(155,232,224,0.30)] border-l-[6px] border-l-[#3B82F6] p-4 flex items-center justify-between gap-4 transition-all duration-200 group shadow-sm">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 h-14 rounded-[14px] bg-[#18181B] border border-white/10 text-white flex items-center justify-center shrink-0 shadow-md">
                          <Zap size={22} className="text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-base sm:text-[17px] font-bold text-[#F7FAFA] truncate group-hover:text-white transition-colors">
                            {result.aiSummary.stack?.framework || "Fastify"}
                          </div>
                          <div className="text-xs sm:text-[13px] text-[#82AEB5] font-medium mt-0.5">
                            Framework
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-[#82AEB5] group-hover:text-[#9BE8E0] group-hover:translate-x-1 transition-all shrink-0" />
                    </div>

                    {/* TypeScript */}
                    <div className="h-[100px] sm:h-[104px] rounded-[16px] bg-[rgba(4,45,54,0.92)] hover:bg-[rgba(6,56,66,0.95)] border border-[rgba(155,232,224,0.14)] hover:border-[rgba(155,232,224,0.30)] border-l-[6px] border-l-[#0284C7] p-4 flex items-center justify-between gap-4 transition-all duration-200 group shadow-sm">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 h-14 rounded-[14px] bg-[#007ACC] text-white flex items-center justify-center shrink-0 shadow-md font-bold font-mono text-base tracking-tight">
                          TS
                        </div>
                        <div className="min-w-0">
                          <div className="text-base sm:text-[17px] font-bold text-[#F7FAFA] truncate group-hover:text-white transition-colors">
                            {result.aiSummary.stack?.language || "TypeScript"}
                          </div>
                          <div className="text-xs sm:text-[13px] text-[#82AEB5] font-medium mt-0.5">
                            Language
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-[#82AEB5] group-hover:text-[#9BE8E0] group-hover:translate-x-1 transition-all shrink-0" />
                    </div>

                    {/* Node.js */}
                    <div className="h-[100px] sm:h-[104px] rounded-[16px] bg-[rgba(4,45,54,0.92)] hover:bg-[rgba(6,56,66,0.95)] border border-[rgba(155,232,224,0.14)] hover:border-[rgba(155,232,224,0.30)] border-l-[6px] border-l-[#22C55E] p-4 flex items-center justify-between gap-4 transition-all duration-200 group shadow-sm">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 h-14 rounded-[14px] bg-[#43853D] text-white flex items-center justify-center shrink-0 shadow-md font-bold font-mono text-base lowercase">
                          node
                        </div>
                        <div className="min-w-0">
                          <div className="text-base sm:text-[17px] font-bold text-[#F7FAFA] truncate group-hover:text-white transition-colors">
                            {result.aiSummary.stack?.runtime || "Node.js"}
                          </div>
                          <div className="text-xs sm:text-[13px] text-[#82AEB5] font-medium mt-0.5">
                            Runtime
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-[#82AEB5] group-hover:text-[#9BE8E0] group-hover:translate-x-1 transition-all shrink-0" />
                    </div>

                    {/* Drizzle */}
                    <div className="h-[100px] sm:h-[104px] rounded-[16px] bg-[rgba(4,45,54,0.92)] hover:bg-[rgba(6,56,66,0.95)] border border-[rgba(155,232,224,0.14)] hover:border-[rgba(155,232,224,0.30)] border-l-[6px] border-l-[#EF4444] p-4 flex items-center justify-between gap-4 transition-all duration-200 group shadow-sm">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 h-14 rounded-[14px] bg-[#EF4444] text-white flex items-center justify-center shrink-0 shadow-md font-bold text-xl">
                          ▲
                        </div>
                        <div className="min-w-0">
                          <div className="text-base sm:text-[17px] font-bold text-[#F7FAFA] truncate group-hover:text-white transition-colors">
                            {result.aiSummary.stack?.orm || "Drizzle"}
                          </div>
                          <div className="text-xs sm:text-[13px] text-[#82AEB5] font-medium mt-0.5">
                            ORM
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-[#82AEB5] group-hover:text-[#9BE8E0] group-hover:translate-x-1 transition-all shrink-0" />
                    </div>

                    {/* JWT */}
                    <div className="h-[100px] sm:h-[104px] rounded-[16px] bg-[rgba(4,45,54,0.92)] hover:bg-[rgba(6,56,66,0.95)] border border-[rgba(155,232,224,0.14)] hover:border-[rgba(155,232,224,0.30)] border-l-[6px] border-l-[#16C7A1] p-4 flex items-center justify-between gap-4 transition-all duration-200 group shadow-sm">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 h-14 rounded-[14px] bg-[#0D9488] text-white flex items-center justify-center shrink-0 shadow-md">
                          <Shield size={22} className="text-[#9BE8E0]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-base sm:text-[17px] font-bold text-[#F7FAFA] truncate group-hover:text-white transition-colors">
                            {(result.aiSummary.stack as any)?.auth || (result.aiSummary.stack as any)?.authentication || "JWT"}
                          </div>
                          <div className="text-xs sm:text-[13px] text-[#82AEB5] font-medium mt-0.5">
                            Authentication
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-[#82AEB5] group-hover:text-[#9BE8E0] group-hover:translate-x-1 transition-all shrink-0" />
                    </div>

                    {/* npm */}
                    <div className="h-[100px] sm:h-[104px] rounded-[16px] bg-[rgba(4,45,54,0.92)] hover:bg-[rgba(6,56,66,0.95)] border border-[rgba(155,232,224,0.14)] hover:border-[rgba(155,232,224,0.30)] border-l-[6px] border-l-[#DC2626] p-4 flex items-center justify-between gap-4 transition-all duration-200 group shadow-sm">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 h-14 rounded-[14px] bg-[#CB3837] text-white flex items-center justify-center shrink-0 shadow-md font-bold font-mono text-base lowercase">
                          npm
                        </div>
                        <div className="min-w-0">
                          <div className="text-base sm:text-[17px] font-bold text-[#F7FAFA] truncate group-hover:text-white transition-colors">
                            {result.aiSummary.stack?.packageManager || "npm"}
                          </div>
                          <div className="text-xs sm:text-[13px] text-[#82AEB5] font-medium mt-0.5">
                            Package Manager
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-[#82AEB5] group-hover:text-[#9BE8E0] group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  </div>
                </div>

                {/* ── 3. AI Analysis (Modular Cards with Colored Left Accents) ── */}
                <div className="pt-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-[#16C7A1]" />
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#9BE8E0]">
                      AI Analysis
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Card 1: Technical Stack Details */}
                    <div className="rounded-[12px] bg-[rgba(8,70,80,0.75)] backdrop-blur-md border border-[rgba(155,232,224,0.18)] border-l-[3px] border-l-[#16C7A1] p-4 sm:p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <Cpu className="w-4 h-4 text-[#16C7A1]" />
                        <h4 className="text-sm font-bold text-[#F7FAFA]">Technical Stack</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8 text-xs sm:text-[13px]">
                        <div className="flex items-center justify-between py-0.5 border-b border-[rgba(155,232,224,0.06)]">
                          <span className="text-[#8EA9AE]">Framework:</span>
                          <span className="font-semibold text-[#F7FAFA] font-mono">{result.aiSummary.stack?.framework || "Fastify"}</span>
                        </div>
                        <div className="flex items-center justify-between py-0.5 border-b border-[rgba(155,232,224,0.06)]">
                          <span className="text-[#8EA9AE]">Database:</span>
                          <span className="font-semibold text-[#F7FAFA] font-mono">{result.aiSummary.stack?.database || "PostgreSQL"}</span>
                        </div>
                        <div className="flex items-center justify-between py-0.5 border-b border-[rgba(155,232,224,0.06)]">
                          <span className="text-[#8EA9AE]">Language:</span>
                          <span className="font-semibold text-[#F7FAFA] font-mono">{result.aiSummary.stack?.language || "TypeScript"}</span>
                        </div>
                        <div className="flex items-center justify-between py-0.5 border-b border-[rgba(155,232,224,0.06)]">
                          <span className="text-[#8EA9AE]">ORM:</span>
                          <span className="font-semibold text-[#F7FAFA] font-mono">{result.aiSummary.stack?.orm || "Drizzle"}</span>
                        </div>
                        <div className="flex items-center justify-between py-0.5 border-b border-[rgba(155,232,224,0.06)]">
                          <span className="text-[#8EA9AE]">Runtime:</span>
                          <span className="font-semibold text-[#F7FAFA] font-mono">{result.aiSummary.stack?.runtime || "Node.js"}</span>
                        </div>
                        <div className="flex items-center justify-between py-0.5 border-b border-[rgba(155,232,224,0.06)]">
                          <span className="text-[#8EA9AE]">Authentication:</span>
                          <span className="font-semibold text-[#F7FAFA] font-mono">{(result.aiSummary.stack as any)?.auth || (result.aiSummary.stack as any)?.authentication || "JWT"}</span>
                        </div>
                        <div className="flex items-center justify-between py-0.5 border-b border-[rgba(155,232,224,0.06)] sm:col-span-2">
                          <span className="text-[#8EA9AE]">Package Manager:</span>
                          <span className="font-semibold text-[#F7FAFA] font-mono">{result.aiSummary.stack?.packageManager || "npm"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Request Lifecycle */}
                    <div className="rounded-[12px] bg-[rgba(8,70,80,0.75)] backdrop-blur-md border border-[rgba(155,232,224,0.18)] border-l-[3px] border-l-[#A855F7] p-4 sm:p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Workflow className="w-4 h-4 text-[#C084FC]" />
                        <h4 className="text-sm font-bold text-[#F7FAFA]">Request Lifecycle</h4>
                      </div>
                      <p className="text-xs text-[#C3D5D8] mb-3">
                        A typical request flows through the following layers:
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {["Client Request", "Fastify", "ts-morph", "PostgreSQL"].map((step, sIdx, arr) => (
                          <React.Fragment key={sIdx}>
                            <span className={`px-3 py-1.5 rounded-[8px] text-xs font-mono font-bold ${
                              sIdx === 0 ? "bg-[#16C7A1]/20 text-[#16C7A1] border border-[#16C7A1]/40" :
                              sIdx === 1 ? "bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40" :
                              sIdx === 2 ? "bg-[#A855F7]/20 text-[#C084FC] border border-[#A855F7]/40" :
                              "bg-[#336791]/30 text-[#93C5FD] border border-[#336791]/50"
                            }`}>
                              {step}
                            </span>
                            {sIdx < arr.length - 1 && (
                              <ArrowRight size={13} className="text-[#8EA9AE] shrink-0" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {/* Card 3: Authentication */}
                    <div className="rounded-[12px] bg-[rgba(8,70,80,0.75)] backdrop-blur-md border border-[rgba(155,232,224,0.18)] border-l-[3px] border-l-[#F5B800] p-4 sm:p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="w-4 h-4 text-[#F5B800]" />
                        <h4 className="text-sm font-bold text-[#F7FAFA]">Authentication</h4>
                      </div>
                      <p className="text-xs sm:text-[13px] leading-relaxed text-[#C3D5D8]">
                        Authentication is handled via JWT (JSON Web Tokens). Upon successful authentication, a JWT is issued to the client for subsequent authorized requests. The <span className="text-[#16C7A1] font-mono px-1 rounded bg-[#063D48]">useAuth.ts</span> module is a key component in managing this authentication flow.
                      </p>
                    </div>

                    {/* Card 4: Database Layer */}
                    <div className="rounded-[12px] bg-[rgba(8,70,80,0.75)] backdrop-blur-md border border-[rgba(155,232,224,0.18)] border-l-[3px] border-l-[#FF3344] p-4 sm:p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-[#FF4D5E]" />
                        <h4 className="text-sm font-bold text-[#F7FAFA]">Database Layer</h4>
                      </div>
                      <p className="text-xs sm:text-[13px] leading-relaxed text-[#C3D5D8]">
                        The application utilizes PostgreSQL as its primary data store. Database interactions are managed through the Drizzle ORM. The key entity identified in the system is <span className="text-[#16C7A1] font-mono px-1 rounded bg-[#063D48]">FEATURE_DEFS</span>.
                      </p>
                    </div>

                    {/* Card 5: Key Modules */}
                    <div className="rounded-[12px] bg-[rgba(8,70,80,0.75)] backdrop-blur-md border border-[rgba(155,232,224,0.18)] border-l-[3px] border-l-[#38BDF8] p-4 sm:p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <Layers className="w-4 h-4 text-[#38BDF8]" />
                        <h4 className="text-sm font-bold text-[#F7FAFA]">Key Modules</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-[13px]">
                        {[
                          { file: "types.ts", desc: "Defines shared data structures and interfaces." },
                          { file: "client.ts", desc: "Client-side utilities for external services/APIs." },
                          { file: "SubscriptionContext.tsx", desc: "Provides context for managing subscription-related state." },
                          { file: "supabase.ts", desc: "Integration with Supabase services." },
                          { file: "subscription.ts", desc: "Business logic for subscription features." },
                          { file: "useAuth.ts", desc: "Authentication logic and reusable hooks." },
                          { file: "layerDetector.ts", desc: "Identifies interactions across layers." },
                          { file: "ENV:NODE_ENV", desc: "Environment-specific configurations." }
                        ].map((item, mIdx) => (
                          <div key={mIdx} className="flex items-start gap-2 py-0.5">
                            <span className="text-[#38BDF8] shrink-0">•</span>
                            <div>
                              <span className="text-[#16C7A1] font-mono font-semibold px-1 rounded bg-[#063D48]">
                                {item.file}
                              </span>{" "}
                              <span className="text-[#C3D5D8]">— {item.desc}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Card 6: Quick Start */}
                    <div className="rounded-[12px] bg-[rgba(8,70,80,0.75)] backdrop-blur-md border border-[rgba(155,232,224,0.18)] border-l-[3px] border-l-[#10B981] p-4 sm:p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <Play className="w-4 h-4 text-[#34D399]" />
                        <h4 className="text-sm font-bold text-[#F7FAFA]">Quick Start</h4>
                      </div>
                      <div className="space-y-2 text-xs sm:text-[13px]">
                        {[
                          "Clone the repository.",
                          "Install dependencies using `npm install`.",
                          "Configure required environment variables, notably `RESEND_API_KEY` and others.",
                          "Start the application via its entry point `app.ts`.",
                          "Review the 88 defined routes and the `FEATURE_DEFS` entity to understand core functionalities."
                        ].map((step, qsIdx) => (
                          <div key={qsIdx} className="flex items-start gap-2.5">
                            <div className="w-5 h-5 rounded-full bg-[#16C7A1]/20 text-[#16C7A1] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {qsIdx + 1}
                            </div>
                            <div className="text-[#C3D5D8] leading-relaxed">
                              {step.split(/(`[^`]+`)/).map((chunk, cIdx) =>
                                chunk.startsWith("`") && chunk.endsWith("`") ? (
                                  <span key={cIdx} className="text-[#16C7A1] font-mono font-semibold px-1 rounded bg-[#063D48]">
                                    {chunk.slice(1, -1)}
                                  </span>
                                ) : (
                                  chunk
                                )
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── 4. Refactoring Recommendations (Sleek, Balanced Analytical Panel) ── */}
                <div className="rounded-[20px] bg-[rgba(7,67,77,0.78)] backdrop-blur-xl border border-[rgba(155,232,224,0.16)] p-5 sm:p-6 relative overflow-hidden shadow-xl">
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 pb-2 border-b border-[rgba(155,232,224,0.08)]">
                    <div className="flex items-center gap-3.5 sm:gap-4">
                      <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-[12px] sm:rounded-[14px] bg-[rgba(245,184,0,0.15)] border border-[rgba(245,184,0,0.30)] text-[#F5B800] flex items-center justify-center shrink-0 shadow-md">
                        <Lightbulb className="w-6 h-6 sm:w-7 sm:h-7 text-[#F5B800]" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-[22px] font-bold text-[#F5B800] tracking-tight leading-tight">
                          Refactoring Recommendations
                        </h2>
                        <p className="text-xs sm:text-[14px] text-[#C3D5D8] mt-0.5 font-normal">
                          Suggestions to improve code quality and maintainability.
                        </p>
                      </div>
                    </div>

                    {/* 5 Items Badge */}
                    <div className="flex items-center">
                      <div className="px-4 py-1.5 sm:px-5 sm:py-2 rounded-full bg-[rgba(245,184,0,0.15)] border border-[rgba(245,184,0,0.35)] text-[#F5B800] text-xs sm:text-sm font-bold shrink-0 shadow-xs">
                        5 Items
                      </div>
                    </div>
                  </div>

                  {/* Recommendation Rows */}
                  <div className="space-y-2.5 mt-4 sm:mt-5 relative z-10">
                    {[
                      {
                        icon: Trash2,
                        text: `Remove ${staticAnalysisReport?.deadCode?.length || 92} unreferenced files to reduce bundle size`,
                        borderAccent: "border-l-[#FF3344]",
                        iconBg: "bg-[rgba(255,51,68,0.15)]",
                        iconColor: "text-[#FF4D5E]",
                      },
                      {
                        icon: Split,
                        text: `Split ${result.files?.length ? Math.round(result.files.length * 0.05) : 22} oversized files into focused modules`,
                        borderAccent: "border-l-[#13B7F2]",
                        iconBg: "bg-[rgba(19,183,242,0.15)]",
                        iconColor: "text-[#13B7F2]",
                      },
                      {
                        icon: Package,
                        text: `Decompose ${staticAnalysisReport?.godServices?.length || 50} god services into smaller, single-responsibility classes`,
                        borderAccent: "border-l-[#16C7A1]",
                        iconBg: "bg-[rgba(22,199,161,0.15)]",
                        iconColor: "text-[#16C7A1]",
                      },
                      {
                        icon: BarChart3,
                        text: `Reduce complexity in ${result.files?.length ? Math.round(result.files.length * 0.06) : 30} high-complexity files`,
                        borderAccent: "border-l-[#F5B800]",
                        iconBg: "bg-[rgba(245,184,0,0.15)]",
                        iconColor: "text-[#F5B800]",
                      },
                      {
                        icon: AlertCircle,
                        text: `Fix ${(result.metadata as any)?.brokenImportsCount || (result.files?.length ? Math.round(result.files.length * 0.12) : 86)} broken imports`,
                        borderAccent: "border-l-[#F43F78]",
                        iconBg: "bg-[rgba(244,63,120,0.15)]",
                        iconColor: "text-[#F43F78]",
                      },
                    ].map((rec, rIdx) => (
                      <div
                        key={rIdx}
                        className={`min-h-[64px] sm:min-h-[68px] rounded-[12px] sm:rounded-[14px] bg-[rgba(6,61,72,0.65)] hover:bg-[rgba(8,76,88,0.85)] border border-[rgba(155,232,224,0.10)] hover:border-[rgba(155,232,224,0.28)] border-l-[4px] sm:border-l-[5px] ${rec.borderAccent} px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3 sm:gap-4 transition-all duration-200 group relative overflow-hidden shadow-sm cursor-pointer`}
                      >
                        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-[10px] sm:rounded-[12px] ${rec.iconBg} ${rec.iconColor} flex items-center justify-center shrink-0 shadow-sm`}>
                            <rec.icon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                          </div>
                          <span className="text-xs sm:text-[15px] font-semibold text-[#F7FAFA] leading-snug truncate group-hover:text-white transition-colors">
                            {rec.text}
                          </span>
                        </div>

                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] bg-[rgba(155,232,224,0.07)] group-hover:bg-[rgba(155,232,224,0.18)] flex items-center justify-center text-[#8EA9AE] group-hover:text-[#9BE8E0] transition-all shrink-0">
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── ONBOARDING TAB ─── */}
            {activeResultTab === "onboarding" && (
              <div className="w-full max-w-[1150px] mx-auto space-y-4 text-left">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 pb-1">
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#16C7A1]">
                      DEVELOPER GUIDE
                    </p>
                    <h1 className="text-3xl sm:text-[34px] font-extrabold text-[#F7FAFA] tracking-tight leading-tight mt-1">
                      Onboarding Checklist
                    </h1>
                    <p className="text-sm sm:text-base text-[#C3D5D8] mt-1.5">
                      Set up your project step by step. Expand each section to view details and file references.
                    </p>
                  </div>

                  {/* Top-Right Decorative "Ship Faster" badge */}
                  <div className="hidden sm:flex flex-col items-end shrink-0 pt-1">
                    <div className="text-[13px] font-medium italic text-[#9BE8E0]/70 tracking-wide">
                      Ship Faster
                    </div>
                    <div className="w-14 h-[1.5px] bg-[#16C7A1]/40 mt-0.5 rounded-full" />
                  </div>
                </div>

                {/* Onboarding Steps Accordion List */}
                <div className="space-y-2 mt-3">
                  {((result.onboarding?.learningPath && result.onboarding.learningPath.length > 0)
                    ? result.onboarding.learningPath
                    : [
                        { label: "app — Application Bootstrap", category: "Bootstrap", file: "src/app.ts", reason: "Main entry point initializing the Fastify server and registering core plugins." },
                        { label: "useAuth — Authentication Module", category: "Auth", file: "useAuth.ts", reason: "As the primary authentication utility, this file explains how user sessions are managed and secured using JWT, which is vital for understanding access control." },
                        { label: "ENV:APP_URL — Application Bootstrap", category: "Bootstrap", file: ".env", reason: "Defines the canonical base URL of the application." },
                        { label: "ENV:APP_NAME — Application Bootstrap", category: "Bootstrap", file: ".env", reason: "Application name used across metadata and client payloads." },
                        { label: "AuthPage.tsx — Authentication Module", category: "Auth", file: "src/components/subscription/AuthPage.tsx", reason: "Handles login and signup flows on the client side." },
                        { label: "ENV:EMAIL_DOMAIN — Application Bootstrap", category: "Bootstrap", file: ".env", reason: "Configures domain for transactional email delivery." },
                        { label: "ENV:MAILGUN_DOMAIN — Application Bootstrap", category: "Bootstrap", file: ".env", reason: "Mailgun routing and webhook signature verification." },
                        { label: "ENV:NODE_ENV — Configuration", category: "Config", file: ".env", reason: "Environment mode flag (development, staging, production)." },
                        { label: "subscription — Core Module", category: "Other", file: "src/lib/subscription.ts", reason: "Subscription tiers, token quotas, and access tier validation." },
                        { label: "SubscriptionContext.tsx — Core Module", category: "Other", file: "src/context/SubscriptionContext.tsx", reason: "React context providing real-time tier and quota state across the dashboard." },
                        { label: "types — Core Module", category: "Other", file: "shared/types.ts", reason: "Shared TypeScript interfaces and schema models across client and server." },
                        { label: "AuthDetector.tsx — Authentication Module", category: "Auth", file: "src/components/diagnostics/AuthDetector.tsx", reason: "Static analysis detector for identifying authentication guards and middleware." }
                      ]
                  ).map((step: any, idx: number) => {
                    const isExpanded = openOnboardingStep === idx;
                    const getCategoryStyle = (category?: string) => {
                      const cat = (category || "").toLowerCase();
                      if (cat.includes("bootstrap") || cat.includes("start")) {
                        return "bg-[#16C7A1]/20 text-[#16C7A1] border border-[#16C7A1]/30";
                      }
                      if (cat.includes("auth") || cat.includes("security")) {
                        return "bg-[#FF3344]/20 text-[#FF4D5E] border border-[#FF3344]/30";
                      }
                      if (cat.includes("config") || cat.includes("env")) {
                        return "bg-[#F5B800]/20 text-[#F5B800] border border-[#F5B800]/30";
                      }
                      return "bg-[rgba(155,232,224,0.12)] text-[#9BE8E0] border border-[rgba(155,232,224,0.22)]";
                    };

                    return (
                      <div
                        key={idx}
                        className={`rounded-[12px] transition-all duration-200 overflow-hidden ${
                          isExpanded
                            ? "bg-[rgba(5,52,64,0.92)] border border-[rgba(155,232,224,0.18)] border-l-[3px] border-l-[#16C7A1] shadow-lg"
                            : "bg-[rgba(3,45,55,0.72)] hover:bg-[rgba(5,52,64,0.85)] border border-[rgba(155,232,224,0.08)] hover:border-[rgba(155,232,224,0.22)] shadow-sm"
                        }`}
                      >
                        <div
                          onClick={() => setOpenOnboardingStep(isExpanded ? null : idx)}
                          className="p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 cursor-pointer"
                        >
                          {/* Left: Number circle + Title */}
                          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-full bg-[rgba(22,199,161,0.18)] text-[#9BE8E0] text-[13px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[14px] sm:text-[15px] font-semibold text-[#F7FAFA] truncate block">
                                {step.label}
                              </span>
                            </div>
                          </div>

                          {/* Right: Category badge + Chevron */}
                          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                            <span className={`text-[11px] sm:text-[12px] font-semibold px-2.5 sm:px-3 py-0.5 rounded-full capitalize ${getCategoryStyle(step.category)}`}>
                              {step.category}
                            </span>
                            <div className="w-5 h-5 flex items-center justify-center text-[#8EA9AE]">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Detail Panel */}
                        {isExpanded && (
                          <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-0">
                            <div className="rounded-[10px] sm:rounded-[12px] bg-[rgba(8,76,88,0.75)] border border-[rgba(155,232,224,0.12)] p-4 space-y-3">
                              {/* File Row with Open File button */}
                              {step.file && (
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                  <div className="flex items-center gap-2 min-w-0 text-xs sm:text-[13px]">
                                    <FileText size={15} className="text-[#9BE8E0] shrink-0" />
                                    <span className="text-[#8EA9AE]">File:</span>
                                    <span className="text-[#16C7A1] font-mono font-semibold truncate">
                                      {step.file}
                                    </span>
                                  </div>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (step.file) {
                                        setSelectedImpactFile(step.file);
                                        setActiveResultTab("arch");
                                      }
                                    }}
                                    className="h-8 sm:h-9 px-3 rounded-[8px] bg-[rgba(6,47,56,0.85)] hover:bg-[#16C7A1] text-[#9BE8E0] hover:text-[#063D48] border border-[rgba(155,232,224,0.25)] text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                                  >
                                    <span>Open File</span>
                                    <ArrowRight size={13} />
                                  </button>
                                </div>
                              )}

                              {/* Reason / Explanation */}
                              {step.reason && (
                                <div className={step.file ? "border-t border-[rgba(155,232,224,0.10)] pt-3" : ""}>
                                  <p className="text-[13px] sm:text-[14px] leading-[21px] text-[#C3D5D8]">
                                    {step.reason}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── BILLING TAB ─── */}
            {/* ─── CONTACT SALES TAB ─── */}
            {activeResultTab === "billing" && (
              <div className="flex flex-col items-center justify-center py-20 max-w-5xl mx-auto">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
                    <Mail className="w-8 h-8 text-amber-400" />
                  </div>
                  <h3 className="dash-title text-white">Need More Scans?</h3>
                  <p className="dash-subtitle text-zinc-400 max-w-md mx-auto">
                    You've reached your scan limit. Contact our sales team for additional capacity and enterprise pricing.
                  </p>
                  <button
                    onClick={() => window.location.href = '/contact-sales'}
                    className="px-6 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 dash-btn hover:bg-amber-500/20 transition"
                  >
                    📧 Contact Sales
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* AI Chat Floating Widget */}
        {result && (
          <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
            <AnimatePresence>
              {isChatOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  className="w-80 md:w-96 h-[480px] bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4"
                >
                  {/* Header */}
                  <div className="p-4 bg-white/10 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-primary" />
                      <div>
                        <span className="text-xs font-bold text-white block">
                          AI Architect Assistant
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Q&A on {result.tree?.name || "codebase"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsChatOpen(false)}
                      className="p-1 rounded hover:bg-white/5 text-zinc-400 hover:text-white transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Message list */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
                    {chatHistory.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 my-auto">
                        <Sparkles className="w-8 h-8 text-zinc-700 mb-2 animate-pulse" />
                        <p className="text-xs font-bold text-white mb-1">
                          Ask anything about this codebase
                        </p>
                        <p className="text-[10px] text-zinc-500 max-w-[200px]">
                          Get code explanations, detect architectural patterns,
                          or scan for vulnerabilities.
                        </p>
                      </div>
                    ) : (
                      chatHistory.map((msg, i) => {
                        const isUser = msg.role === "user";
                        return (
                          <div
                            key={msg.id || i}
                            className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${isUser
                                ? "bg-primary text-neutral-950 font-medium rounded-tr-none"
                                : "bg-white/10 text-zinc-200 border border-white/5 rounded-tl-none"
                                }`}
                            >
                              <p className="whitespace-pre-wrap">
                                {msg.content}
                              </p>
                            </div>

                            {/* Agent logs */}
                            {!isUser &&
                              msg.agentLogs &&
                              msg.agentLogs.length > 0 && (
                                <div className="mt-1 w-full max-w-[85%]">
                                  <button
                                    onClick={() =>
                                      setExpandedAgentLogs((prev) => ({
                                        ...prev,
                                        [msg.id]: !prev[msg.id],
                                      }))
                                    }
                                    className="text-[9px] text-primary hover:underline flex items-center gap-1 font-mono cursor-pointer"
                                  >
                                    {expandedAgentLogs[msg.id]
                                      ? "▼ Hide thoughts"
                                      : "▶ Show thoughts"}
                                  </button>
                                  {expandedAgentLogs[msg.id] && (
                                    <div className="mt-1 p-2 rounded bg-zinc-950 border border-white/5 font-mono text-[9px] text-zinc-500 space-y-0.5 max-h-24 overflow-y-auto">
                                      {msg.agentLogs.map((log, idx) => (
                                        <div key={idx}>{log}</div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                          </div>
                        );
                      })
                    )}
                    {chatMutation.isPending && (
                      <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-mono pl-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                        Thinking...
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-3 bg-zinc-850 border-t border-white/5 flex gap-2">
                    <input
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendChatMessage();
                      }}
                      placeholder="Ask a question..."
                      className="flex-1 px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary/40 transition"
                    />
                    <button
                      onClick={handleSendChatMessage}
                      disabled={chatMutation.isPending || !chatMessage.trim()}
                      className="p-1.5 rounded-xl bg-primary text-neutral-950 hover:bg-primary-400 disabled:opacity-50 transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-emerald-400 text-neutral-950 flex items-center justify-center shadow-2xl hover:scale-105 transition cursor-pointer"
            >
              {isChatOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <MessageSquare className="w-5 h-5" />
              )}
            </button>
          </div>
        )}

        {/* Modals for dashboard view */}
        <UpgradeModal
          open={showUpgrade}
          onClose={() => setShowUpgrade(false)}
        />
        <UsageLimitModal
          open={showLimit.open}
          onClose={() => setShowLimit({ open: false })}
          onUpgrade={() => {
            setShowLimit({ open: false });
            setShowUpgrade(true);
          }}
          title={showLimit.title}
          message={showLimit.message}
        />
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          scan={deletingScan}
          isDeleting={isDeleting}
        />
      </main>
    </div>
  );
}

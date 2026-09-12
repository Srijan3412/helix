"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { getExecutionTraces } from "../../lib/api/client";
import { useAnalysisStore } from "../../store/analysis.store";
import { ReactFlow, Background, Controls } from "@xyflow/react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  CheckCircle2,
  FileCode,
  Search,
  X,
  Zap,
  Network,
  Shield,
  Database,
  Code,
  Share2,
  MoreVertical,
  RotateCcw,
  Clock,
  ArrowRight,
  Star,
  Check,
  SlidersHorizontal,
  Globe,
  Activity,
  Maximize2,
  Sparkles,
} from "lucide-react";

type EndpointCategory = "All" | "Routes" | "Controllers" | "Services";
type InspectorTab = "Overview" | "Logs" | "Code" | "Dependencies";

const METHOD_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  GET: { bg: "bg-[#16C7A3]/15", text: "text-[#16C7A3]", border: "border-[#16C7A3]/30" },
  POST: { bg: "bg-[#2F80ED]/15", text: "text-[#2F80ED]", border: "border-[#2F80ED]/30" },
  PUT: { bg: "bg-[#8B5CF6]/15", text: "text-[#8B5CF6]", border: "border-[#8B5CF6]/30" },
  DELETE: { bg: "bg-[#FF4D5E]/15", text: "text-[#FF4D5E]", border: "border-[#FF4D5E]/30" },
  PATCH: { bg: "bg-[#F5B52E]/15", text: "text-[#F5B52E]", border: "border-[#F5B52E]/30" },
};

interface TraceSubStep {
  name: string;
  durationMs: number;
}

interface TraceStepItem {
  id: string;
  stepNum: number;
  type: "http" | "controller" | "service" | "response";
  title: string;
  name: string;
  path?: string;
  durationMs: number;
  status: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  description?: string;
  substeps?: TraceSubStep[];
  inputJson?: any;
  outputJson?: any;
  logs?: { timestamp: string; message: string }[];
  dependencies?: { name: string; role: string; healthy: boolean }[];
}

interface EndpointTraceData {
  id: string;
  method: string;
  path: string;
  moduleTag: string;
  isStarred?: boolean;
  category: "Routes" | "Controllers" | "Services";
  successRate: string;
  durationMs: number;
  durationCompare: string;
  dbQueries: number;
  dbNote: string;
  authFlow: string;
  authNote: string;
  complexityScore: number;
  complexityNote: string;
  steps: TraceStepItem[];
}

const MOCK_TRACES: EndpointTraceData[] = [
  {
    id: "GET:/key",
    method: "GET",
    path: "/key",
    moduleTag: "Core System",
    isStarred: true,
    category: "Routes",
    successRate: "100%",
    durationMs: 248,
    durationCompare: "↓ 32% vs. last run",
    dbQueries: 0,
    dbNote: "No DB activity",
    authFlow: "Public",
    authNote: "No authentication",
    complexityScore: 8,
    complexityNote: "Service calls",
    steps: [
      {
        id: "step-1",
        stepNum: 1,
        type: "http",
        title: "HTTP Request",
        name: "GET /key",
        durationMs: 12,
        status: "200 OK",
        icon: Globe,
        color: "#16C7A3",
        bgColor: "rgba(22, 199, 163, 0.12)",
        borderColor: "rgba(22, 199, 163, 0.4)",
        description: "Inbound HTTP GET request initiated by client.",
        inputJson: { headers: { Host: "api.civicchain.io" }, query: {} },
        outputJson: { status: 200, latencyMs: 12 },
        logs: [
          { timestamp: "12:41:00.002", message: "Received HTTP GET /key from 192.168.1.45" },
          { timestamp: "12:41:00.004", message: "Matched route pattern /key" },
        ],
        dependencies: [
          { name: "API Gateway", role: "Reverse Proxy", healthy: true },
          { name: "CORS Middleware", role: "Security Header Injection", healthy: true },
        ],
      },
      {
        id: "step-2",
        stepNum: 2,
        type: "controller",
        title: "Controller",
        name: "analysis.queue",
        path: "src/controllers/analysis.controller.ts",
        durationMs: 8,
        status: "Success",
        icon: Code,
        color: "#2F80ED",
        bgColor: "rgba(47, 128, 237, 0.12)",
        borderColor: "rgba(47, 128, 237, 0.4)",
        description: "Controller parses route request and dispatches job payload to queue service.",
        inputJson: { route: "/key", action: "queue_analysis" },
        outputJson: { status: "dispatched", queueId: "queue_main" },
        logs: [
          { timestamp: "12:41:00.015", message: "Executing analysis.queue controller handler" },
          { timestamp: "12:41:00.018", message: "Validated controller DTO parameters" },
        ],
        dependencies: [
          { name: "Express Router", role: "Route Handler", healthy: true },
          { name: "Zod Validator", role: "Schema Validation", healthy: true },
        ],
      },
      {
        id: "step-3",
        stepNum: 3,
        type: "service",
        title: "Service",
        name: "bullmq",
        path: "backend/src/jobs/analysis.queue.ts",
        durationMs: 156,
        status: "Expanded",
        icon: Zap,
        color: "#F5B52E",
        bgColor: "rgba(245, 181, 46, 0.12)",
        borderColor: "rgba(245, 181, 46, 0.5)",
        description: "Handles background job processing using BullMQ. Adds the analysis job to the queue and handles metadata.",
        substeps: [
          { name: "Validate payload", durationMs: 12 },
          { name: "Add to queue", durationMs: 120 },
          { name: "Process metadata", durationMs: 18 },
          { name: "Return response", durationMs: 6 },
        ],
        inputJson: {
          fileId: "abc123",
          type: "document_analysis",
        },
        outputJson: {
          jobId: "job_789",
          status: "queued",
        },
        logs: [
          { timestamp: "12:41:02.100", message: "Validate payload" },
          { timestamp: "12:41:02.112", message: "Added job to queue" },
          { timestamp: "12:41:03.045", message: "Processing metadata" },
          { timestamp: "12:41:03.063", message: "Job successfully enqueued with ID job_789" },
        ],
        dependencies: [
          { name: "Redis", role: "Cache & Queue Store", healthy: true },
          { name: "Queue Manager", role: "BullMQ", healthy: true },
        ],
      },
      {
        id: "step-4",
        stepNum: 4,
        type: "response",
        title: "Response",
        name: "200 OK",
        durationMs: 72,
        status: "Completed",
        icon: Database,
        color: "#8B5CF6",
        bgColor: "rgba(139, 92, 246, 0.12)",
        borderColor: "rgba(139, 92, 246, 0.4)",
        description: "Final HTTP response payload constructed and transmitted to client.",
        inputJson: { status: 200, bodySize: 1420 },
        outputJson: { success: true, timestamp: 1726020400 },
        logs: [
          { timestamp: "12:41:03.120", message: "Encrypted response body" },
          { timestamp: "12:41:03.135", message: "Flushed 200 OK stream to client socket" },
        ],
        dependencies: [
          { name: "HTTP Response Stream", role: "Socket Emitter", healthy: true },
        ],
      },
    ],
  },
  {
    id: "GET:/job::jobId:scan",
    method: "GET",
    path: "/job/:jobId/scan",
    moduleTag: "Job Service",
    category: "Routes",
    successRate: "98%",
    durationMs: 310,
    durationCompare: "↓ 12% vs. last run",
    dbQueries: 3,
    dbNote: "3 SQL queries",
    authFlow: "Protected",
    authNote: "Bearer token required",
    complexityScore: 12,
    complexityNote: "Service & DB calls",
    steps: [
      {
        id: "step-1",
        stepNum: 1,
        type: "http",
        title: "HTTP Request",
        name: "GET /job/:jobId/scan",
        durationMs: 18,
        status: "200 OK",
        icon: Globe,
        color: "#16C7A3",
        bgColor: "rgba(22, 199, 163, 0.12)",
        borderColor: "rgba(22, 199, 163, 0.4)",
        description: "Inbound request for scan job status.",
        inputJson: { params: { jobId: "job_789" } },
        outputJson: { status: 200 },
        logs: [{ timestamp: "12:42:00.002", message: "Received GET /job/job_789/scan" }],
      },
      {
        id: "step-2",
        stepNum: 2,
        type: "controller",
        title: "Controller",
        name: "job.controller",
        path: "src/controllers/job.controller.ts",
        durationMs: 14,
        status: "Success",
        icon: Code,
        color: "#2F80ED",
        bgColor: "rgba(47, 128, 237, 0.12)",
        borderColor: "rgba(47, 128, 237, 0.4)",
        description: "Validates jobId format and queries service.",
        inputJson: { jobId: "job_789" },
        outputJson: { valid: true },
        logs: [{ timestamp: "12:42:00.015", message: "Parsed jobId format" }],
      },
      {
        id: "step-3",
        stepNum: 3,
        type: "service",
        title: "Service",
        name: "job.service",
        path: "src/services/job.service.ts",
        durationMs: 210,
        status: "Expanded",
        icon: Zap,
        color: "#F5B52E",
        bgColor: "rgba(245, 181, 46, 0.12)",
        borderColor: "rgba(245, 181, 46, 0.5)",
        description: "Fetches scan results from database and computes summary metrics.",
        substeps: [
          { name: "Query PostgreSQL job row", durationMs: 90 },
          { name: "Fetch related AST symbols", durationMs: 80 },
          { name: "Assemble report summary", durationMs: 40 },
        ],
        inputJson: { jobId: "job_789" },
        outputJson: { status: "completed", progress: 100 },
        logs: [{ timestamp: "12:42:00.100", message: "DB query completed in 90ms" }],
      },
      {
        id: "step-4",
        stepNum: 4,
        type: "response",
        title: "Response",
        name: "200 OK",
        durationMs: 68,
        status: "Completed",
        icon: Database,
        color: "#8B5CF6",
        bgColor: "rgba(139, 92, 246, 0.12)",
        borderColor: "rgba(139, 92, 246, 0.4)",
        description: "Scan data payload delivered to client.",
        inputJson: { status: 200 },
        outputJson: { success: true },
        logs: [{ timestamp: "12:42:00.310", message: "Payload delivered" }],
      },
    ],
  },
  {
    id: "POST:/api/v1/auth/login",
    method: "POST",
    path: "/api/v1/auth/login",
    moduleTag: "Auth Gateway",
    category: "Controllers",
    successRate: "99.4%",
    durationMs: 185,
    durationCompare: "↓ 18% vs. last run",
    dbQueries: 2,
    dbNote: "2 SQL queries",
    authFlow: "Public",
    authNote: "Anonymous credentials",
    complexityScore: 10,
    complexityNote: "Bcrypt & JWT signing",
    steps: [
      {
        id: "step-1",
        stepNum: 1,
        type: "http",
        title: "HTTP Request",
        name: "POST /api/v1/auth/login",
        durationMs: 10,
        status: "200 OK",
        icon: Globe,
        color: "#16C7A3",
        bgColor: "rgba(22, 199, 163, 0.12)",
        borderColor: "rgba(22, 199, 163, 0.4)",
        description: "Inbound user login attempt.",
        inputJson: { email: "user@civicchain.io" },
        outputJson: { status: 200 },
        logs: [{ timestamp: "12:43:00.002", message: "Login attempt from web client" }],
      },
      {
        id: "step-2",
        stepNum: 2,
        type: "controller",
        title: "Controller",
        name: "auth.controller",
        path: "src/controllers/auth.controller.ts",
        durationMs: 15,
        status: "Success",
        icon: Code,
        color: "#2F80ED",
        bgColor: "rgba(47, 128, 237, 0.12)",
        borderColor: "rgba(47, 128, 237, 0.4)",
        description: "Validates request credentials schema.",
        inputJson: { email: "user@civicchain.io" },
        outputJson: { valid: true },
        logs: [{ timestamp: "12:43:00.015", message: "Valid payload format" }],
      },
      {
        id: "step-3",
        stepNum: 3,
        type: "service",
        title: "Service",
        name: "auth.service",
        path: "src/services/auth.service.ts",
        durationMs: 110,
        status: "Expanded",
        icon: Zap,
        color: "#F5B52E",
        bgColor: "rgba(245, 181, 46, 0.12)",
        borderColor: "rgba(245, 181, 46, 0.5)",
        description: "Verifies password hash with bcrypt and signs JWT session token.",
        substeps: [
          { name: "Find user by email", durationMs: 25 },
          { name: "Compare password hash", durationMs: 65 },
          { name: "Generate JWT token", durationMs: 20 },
        ],
        inputJson: { email: "user@civicchain.io" },
        outputJson: { token: "eyJhbGciOi..." },
        logs: [{ timestamp: "12:43:00.120", message: "Bcrypt hash verified" }],
      },
      {
        id: "step-4",
        stepNum: 4,
        type: "response",
        title: "Response",
        name: "200 OK",
        durationMs: 50,
        status: "Completed",
        icon: Database,
        color: "#8B5CF6",
        bgColor: "rgba(139, 92, 246, 0.12)",
        borderColor: "rgba(139, 92, 246, 0.4)",
        description: "Session cookie set and user object returned.",
        inputJson: { status: 200 },
        outputJson: { user: { id: "u_123", email: "user@civicchain.io" } },
        logs: [{ timestamp: "12:43:00.185", message: "Session created" }],
      },
    ],
  },
];

interface ExecutionTraceProps {
  result?: any;
  onSwitchTab?: (tab: string) => void;
  onSetImpactFile?: (file: string) => void;
  initialRouteId?: string;
}

export default function ExecutionTrace({
  result,
  onSwitchTab,
  onSetImpactFile,
  initialRouteId,
}: ExecutionTraceProps) {
  const { currentJobId } = useAnalysisStore();

  const [selectedEndpointId, setSelectedEndpointId] = useState<string>(
    initialRouteId || MOCK_TRACES[0].id
  );
  const [routeSearch, setRouteSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<EndpointCategory>("All");
  const [environment, setEnvironment] = useState<string>("Development");
  const [viewMode, setViewMode] = useState<"timeline" | "graph">("timeline");
  const [selectedStepId, setSelectedStepId] = useState<string>("step-3");
  const [activeInspectorTab, setActiveInspectorTab] = useState<InspectorTab>("Overview");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({
    "step-3": true,
  });
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialRouteId) {
      setSelectedEndpointId(initialRouteId);
    }
  }, [initialRouteId]);

  const { data: apiTraces } = useQuery({
    queryKey: ["executionTraces", currentJobId],
    queryFn: () => getExecutionTraces(currentJobId!),
    enabled: !!currentJobId,
  });

  const traces: EndpointTraceData[] = useMemo(() => {
    if (apiTraces?.traces && apiTraces.traces.length > 0) {
      return apiTraces.traces.map((t: any, idx: number) => {
        const id = `${t.method}:${t.route}`;
        const mockFallback = MOCK_TRACES[idx % MOCK_TRACES.length];
        return {
          id,
          method: t.method || "GET",
          path: t.route || "/api",
          moduleTag: t.module || mockFallback.moduleTag,
          isStarred: idx === 0,
          category: (t.category as any) || "Routes",
          successRate: "100%",
          durationMs: t.metrics?.duration || 248,
          durationCompare: "↓ 25% vs. last run",
          dbQueries: t.reachability ? 3 : 0,
          dbNote: t.reachability ? "3 DB queries" : "No DB activity",
          authFlow: t.authType ? t.authType : "Public",
          authNote: t.authType ? "Authentication required" : "No authentication",
          complexityScore: t.metrics?.complexity || 8,
          complexityNote: "Service calls",
          steps: mockFallback.steps,
        };
      });
    }
    return MOCK_TRACES;
  }, [apiTraces]);

  const activeTrace = useMemo(() => {
    return traces.find((t) => t.id === selectedEndpointId) || traces[0];
  }, [selectedEndpointId, traces]);

  const activeStep = useMemo(() => {
    return activeTrace.steps.find((s) => s.id === selectedStepId) || activeTrace.steps[2];
  }, [selectedStepId, activeTrace]);

  const filteredEndpoints = useMemo(() => {
    return traces.filter((t) => {
      const matchesSearch =
        t.path.toLowerCase().includes(routeSearch.toLowerCase()) ||
        t.method.toLowerCase().includes(routeSearch.toLowerCase()) ||
        t.moduleTag.toLowerCase().includes(routeSearch.toLowerCase());
      const matchesCat =
        selectedCategory === "All" ? true : t.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [traces, routeSearch, selectedCategory]);

  const handlePlayToggle = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleStepPrev = useCallback(() => {
    const idx = activeTrace.steps.findIndex((s) => s.id === selectedStepId);
    if (idx > 0) {
      setSelectedStepId(activeTrace.steps[idx - 1].id);
    }
  }, [activeTrace, selectedStepId]);

  const handleStepNext = useCallback(() => {
    const idx = activeTrace.steps.findIndex((s) => s.id === selectedStepId);
    if (idx < activeTrace.steps.length - 1) {
      setSelectedStepId(activeTrace.steps[idx + 1].id);
    }
  }, [activeTrace, selectedStepId]);

  const toggleStepExpanded = useCallback((stepId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  }, []);

  const copyJsonPayload = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification("Copied to clipboard!");
    setTimeout(() => setCopiedNotification(null), 2000);
  }, []);

  const handleFitView = useCallback(() => {
    setSelectedStepId(activeTrace.steps[0]?.id || "step-1");
  }, [activeTrace]);

  const { rfNodes, rfEdges } = useMemo(() => {
    const flowNodes = activeTrace.steps.map((step, idx) => ({
      id: step.id,
      position: { x: 180, y: idx * 110 + 30 },
      data: {
        label: (
          <div
            onClick={() => setSelectedStepId(step.id)}
            className={`px-4 py-2.5 rounded-xl border text-left cursor-pointer transition-all ${
              selectedStepId === step.id
                ? "bg-[#16C7A3]/15 border-[#16C7A3] text-white shadow-lg"
                : "bg-[#0A171C] border-[rgba(100,190,205,0.14)] text-[#A4B5B8] hover:border-[#16C7A3]/50"
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: step.color }} />
              <span>{step.title}</span>
              <span className="ml-auto text-[10px] text-[#A4B5B8]">{step.durationMs} ms</span>
            </div>
            <div className="text-xs font-mono font-bold text-[#F2F7F7] mt-1">{step.name}</div>
          </div>
        ),
      },
      style: { background: "transparent", border: "none", padding: 0 },
    }));

    const flowEdges = activeTrace.steps.slice(0, -1).map((step, idx) => ({
      id: `edge-${idx}`,
      source: step.id,
      target: activeTrace.steps[idx + 1].id,
      animated: true,
      style: { stroke: "#16C7A3", strokeWidth: 2 },
    }));

    return { rfNodes: flowNodes, rfEdges: flowEdges };
  }, [activeTrace, selectedStepId]);

  return (
    <div className="h-full w-full bg-[#061318] flex flex-col overflow-hidden text-left font-sans select-none relative">
      {/* ── 1. SINGLE UNIFIED HEADER TOOLBAR (60px) ─────────────────────────── */}
      <div className="h-[60px] px-4 bg-[#071219] border-b border-[rgba(100,190,205,0.14)] flex items-center justify-between shrink-0 z-20 gap-4">
        {/* Left: Title & Subtitle */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#16C7A3]/15 border border-[#16C7A3]/30 flex items-center justify-center text-[#16C7A3] shrink-0">
            <Zap size={16} />
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-[#F2F7F7] tracking-tight leading-tight">
              Execution Trace
            </h1>
            <p className="text-[11px] text-[#8FA4A8] font-normal leading-none mt-0.5">
              Trace API endpoints through the application
            </p>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="relative flex-1 max-w-sm min-w-[200px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#728589]" />
          <input
            type="text"
            placeholder="Search endpoints..."
            value={routeSearch}
            onChange={(e) => setRouteSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-7 rounded-lg bg-[#0A171C] border border-[rgba(100,190,205,0.16)] text-xs text-[#F2F7F7] placeholder-[#728589] focus:outline-none focus:border-[#16C7A3] transition-colors"
          />
          {routeSearch && (
            <button
              onClick={() => setRouteSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#728589] hover:text-[#F2F7F7]"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Right: Active Endpoint Badge & Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0A171C] border border-[rgba(100,190,205,0.18)]">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black font-mono tracking-wider border shrink-0 ${
                METHOD_STYLES[activeTrace.method]?.bg || "bg-[#16C7A3]/20"
              } ${METHOD_STYLES[activeTrace.method]?.text || "text-[#16C7A3]"} ${
                METHOD_STYLES[activeTrace.method]?.border || "border-[#16C7A3]/40"
              }`}
            >
              {activeTrace.method}
            </span>
            <span className="text-xs font-mono font-bold text-[#F2F7F7] max-w-[180px] truncate">
              {activeTrace.path}
            </span>
          </div>

          <button
            onClick={handleFitView}
            className="h-8 px-3 rounded-lg bg-[#0A171C] hover:bg-[#0E1C21] border border-[rgba(100,190,205,0.18)] text-[#A4B5B8] hover:text-[#F2F7F7] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Fit / Reset Execution View"
          >
            <span>Fit View</span>
          </button>

          <div className="hidden lg:flex items-center gap-1.5 bg-[#0A171C] border border-[rgba(100,190,205,0.18)] rounded-lg px-2.5 py-1 text-xs text-[#A4B5B8]">
            <span className="text-[10px] font-semibold text-[#728589]">Env</span>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="bg-transparent text-[#F2F7F7] font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value="Development" className="bg-[#0A171C] text-[#F2F7F7]">
                Development
              </option>
              <option value="Staging" className="bg-[#0A171C] text-[#F2F7F7]">
                Staging
              </option>
              <option value="Production" className="bg-[#0A171C] text-[#F2F7F7]">
                Production
              </option>
            </select>
          </div>

          <button
            onClick={() => copyJsonPayload(window.location.href)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0A171C] hover:bg-[#0E1C21] border border-[rgba(100,190,205,0.18)] text-[#F2F7F7] text-xs font-semibold cursor-pointer transition-colors"
          >
            <Share2 size={12} className="text-[#16C7A3]" />
            <span>Share</span>
          </button>

          <button
            onClick={() => {
              setIsPlaying(true);
              setTimeout(() => setIsPlaying(false), 1200);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16C7A3] hover:bg-[#16C7A3]/90 text-[#061318] text-xs font-bold cursor-pointer transition-all shadow-md shadow-[#16C7A3]/20 shrink-0"
          >
            <RotateCcw size={12} className={isPlaying ? "animate-spin" : ""} />
            <span>Run Again</span>
          </button>
        </div>
      </div>

      {/* ── 3. Main 3-Column Execution Workspace ─────────────────────────── */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3 bg-[#061318] min-h-0">
        {/* ── Left API Endpoints Panel (18-20% ~210px) ─────────────────── */}
        <aside className="w-[215px] shrink-0 h-full bg-[#0A171C] border border-[rgba(100,190,205,0.14)] rounded-xl p-3 flex flex-col overflow-hidden select-none">
          <div className="mb-2 shrink-0">
            <h2 className="text-[11px] font-bold text-[#F2F7F7] font-mono tracking-wider uppercase mb-2">
              API Endpoints
            </h2>

            {/* Category Filter Buttons */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {(["All", "Routes", "Controllers", "Services"] as EndpointCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#16C7A3] text-[#061318]"
                      : "text-[#A4B5B8] hover:text-[#F2F7F7] hover:bg-[#0E1C21]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Compact Endpoint List Cards (height 50-56px) */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
            {filteredEndpoints.map((ep) => {
              const isSelected = ep.id === selectedEndpointId;
              const methodStyle = METHOD_STYLES[ep.method] || METHOD_STYLES.GET;

              return (
                <div
                  key={ep.id}
                  onClick={() => {
                    setSelectedEndpointId(ep.id);
                    setSelectedStepId(ep.steps[2]?.id || ep.steps[0].id);
                  }}
                  className={`p-2 rounded-lg border text-left cursor-pointer transition-all duration-150 relative min-h-[52px] flex flex-col justify-between ${
                    isSelected
                      ? "bg-[#0E1C21] border-[#16C7A3] border-l-2 shadow-md"
                      : "bg-[#071219] border-[rgba(100,190,205,0.1)] hover:border-[rgba(100,190,205,0.3)] hover:bg-[#0E1C21]/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono border ${methodStyle.bg} ${methodStyle.text} ${methodStyle.border}`}
                    >
                      {ep.method}
                    </span>
                    <div className="flex items-center gap-1">
                      {ep.isStarred && <Star size={10} className="text-[#F5B52E] fill-[#F5B52E]" />}
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16C7A3]" />
                    </div>
                  </div>

                  <div className="text-xs font-mono font-bold text-[#F2F7F7] truncate mt-0.5" title={ep.path}>
                    {ep.path}
                  </div>
                  <div className="text-[10px] text-[#8FA4A8] font-medium truncate">
                    {ep.moduleTag}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── Center Main Execution Trace Panel (57-62% Dominant) ────────── */}
        <main className="flex-1 flex flex-col bg-[#0A171C] border border-[rgba(100,190,205,0.14)] rounded-xl p-3.5 overflow-hidden relative text-left select-none min-w-0">
          {/* Header Strip with Controls */}
          <div className="flex items-center justify-between pb-2 border-b border-[rgba(100,190,205,0.12)] shrink-0">
            <div className="flex items-center gap-2 truncate">
              <span className="text-xs font-bold font-mono text-[#F2F7F7] uppercase tracking-wider">
                Execution Flow
              </span>
              <span className="text-[11px] font-mono text-[#8FA4A8]">
                ({activeTrace.steps.length} steps)
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 bg-[#071219] p-0.5 rounded-lg border border-[rgba(100,190,205,0.18)]">
                <button
                  onClick={handleStepPrev}
                  className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 text-[#A4B5B8] hover:text-white flex items-center justify-center cursor-pointer"
                  title="Previous Step"
                >
                  <SkipBack size={12} />
                </button>
                <button
                  onClick={handlePlayToggle}
                  className={`w-7 h-7 rounded flex items-center justify-center font-bold transition-all cursor-pointer ${
                    isPlaying
                      ? "bg-[#F5B52E] text-[#061318]"
                      : "bg-[#16C7A3] text-[#061318] shadow-sm"
                  }`}
                  title={isPlaying ? "Pause Trace" : "Play Trace"}
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
                </button>
                <button
                  onClick={handleStepNext}
                  className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 text-[#A4B5B8] hover:text-white flex items-center justify-center cursor-pointer"
                  title="Next Step"
                >
                  <SkipForward size={12} />
                </button>
              </div>

              <div className="flex items-center bg-[#071219] p-0.5 rounded-lg border border-[rgba(100,190,205,0.18)] text-xs font-semibold">
                <button
                  onClick={() => setViewMode("timeline")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded cursor-pointer transition-colors ${
                    viewMode === "timeline" ? "bg-[#16C7A3] text-[#061318] font-bold" : "text-[#A4B5B8]"
                  }`}
                >
                  <Clock size={11} />
                  <span>Timeline</span>
                </button>
                <button
                  onClick={() => setViewMode("graph")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded cursor-pointer transition-colors ${
                    viewMode === "graph" ? "bg-[#16C7A3] text-[#061318] font-bold" : "text-[#A4B5B8]"
                  }`}
                >
                  <Network size={11} />
                  <span>Graph</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── 5-Column Metrics Strip (72-82px Height) ────────────────── */}
          <div className="grid grid-cols-5 divide-x divide-[rgba(100,190,205,0.12)] bg-[#071219] border border-[rgba(100,190,205,0.14)] rounded-xl my-2.5 p-2.5 text-center shrink-0 min-h-[72px]">
            <div className="flex flex-col items-center justify-center px-1">
              <div className="flex items-center gap-1 text-[9.5px] uppercase font-bold text-[#8FA4A8] tracking-wider mb-0.5">
                <CheckCircle2 size={11} className="text-[#16C7A3]" />
                <span>Success</span>
              </div>
              <div className="text-base font-bold text-[#16C7A3] font-mono leading-none">
                {activeTrace.successRate}
              </div>
              <span className="text-[9px] text-[#728589] mt-0.5">Request completed</span>
            </div>

            <div className="flex flex-col items-center justify-center px-1">
              <div className="flex items-center gap-1 text-[9.5px] uppercase font-bold text-[#8FA4A8] tracking-wider mb-0.5">
                <Clock size={11} className="text-[#2F80ED]" />
                <span>Duration</span>
              </div>
              <div className="text-base font-bold text-[#F2F7F7] font-mono leading-none">
                {activeTrace.durationMs} ms
              </div>
              <span className="text-[9px] text-[#16C7A3] mt-0.5">{activeTrace.durationCompare}</span>
            </div>

            <div className="flex flex-col items-center justify-center px-1">
              <div className="flex items-center gap-1 text-[9.5px] uppercase font-bold text-[#8FA4A8] tracking-wider mb-0.5">
                <Database size={11} className="text-[#8B5CF6]" />
                <span>DB Queries</span>
              </div>
              <div className="text-base font-bold text-[#F2F7F7] font-mono leading-none">
                {activeTrace.dbQueries}
              </div>
              <span className="text-[9px] text-[#728589] mt-0.5">{activeTrace.dbNote}</span>
            </div>

            <div className="flex flex-col items-center justify-center px-1">
              <div className="flex items-center gap-1 text-[9.5px] uppercase font-bold text-[#8FA4A8] tracking-wider mb-0.5">
                <Shield size={11} className="text-[#F5B52E]" />
                <span>Auth Flow</span>
              </div>
              <div className="text-base font-bold text-[#F2F7F7] font-mono leading-none">
                {activeTrace.authFlow}
              </div>
              <span className="text-[9px] text-[#728589] mt-0.5">{activeTrace.authNote}</span>
            </div>

            <div className="flex flex-col items-center justify-center px-1">
              <div className="flex items-center gap-1 text-[9.5px] uppercase font-bold text-[#8FA4A8] tracking-wider mb-0.5">
                <Activity size={11} className="text-[#FF4D5E]" />
                <span>Complexity</span>
              </div>
              <div className="text-base font-bold text-[#F2F7F7] font-mono leading-none">
                Σ {activeTrace.complexityScore}
              </div>
              <span className="text-[9px] text-[#728589] mt-0.5">{activeTrace.complexityNote}</span>
            </div>
          </div>

          {/* ── Main Trace Steps Area (Flex Scrollable) ─────────────────── */}
          <div className="flex-1 overflow-y-auto pr-1 min-h-0">
            {viewMode === "timeline" ? (
              <div className="relative pl-9 pr-1 py-1 space-y-3 select-none">
                {/* Vertical connecting rail */}
                <div className="absolute left-[17px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-[#16C7A3] via-[#2F80ED] to-[#8B5CF6] z-0" />

                {activeTrace.steps.map((step) => {
                  const IconComp = step.icon || Globe;
                  const isSelected = selectedStepId === step.id;
                  const isExpanded = expandedSteps[step.id];

                  return (
                    <div key={step.id} className="relative z-10 flex items-start gap-3">
                      {/* Step Number in Narrow Rail */}
                      <div
                        onClick={() => setSelectedStepId(step.id)}
                        className={`w-[30px] h-[30px] rounded-full flex items-center justify-center font-bold text-xs font-mono shrink-0 cursor-pointer shadow-md transition-transform ${
                          isSelected ? "scale-110 ring-2 ring-[#16C7A3]" : ""
                        }`}
                        style={{
                          backgroundColor: step.color,
                          color: "#061318",
                        }}
                      >
                        {step.stepNum}
                      </div>

                      {/* Step Card */}
                      <div
                        onClick={() => setSelectedStepId(step.id)}
                        className={`flex-1 rounded-xl p-3 border transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? "bg-[#0E1C21] border-[#16C7A3] shadow-lg"
                            : "bg-[#071219] border-[rgba(100,190,205,0.14)] hover:border-[rgba(100,190,205,0.35)] hover:bg-[#0E1C21]/60"
                        }`}
                        style={{
                          borderLeftWidth: "3px",
                          borderLeftColor: step.color,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 truncate">
                            <div
                              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                              style={{ backgroundColor: step.bgColor, border: `1px solid ${step.borderColor}` }}
                            >
                              <IconComp size={13} style={{ color: step.color }} />
                            </div>
                            <div className="truncate">
                              <h3 className="text-xs font-bold text-[#F2F7F7] font-mono leading-tight truncate">
                                {step.title}
                              </h3>
                              <span className="text-[10.5px] font-mono text-[#8FA4A8] truncate block">
                                {step.name}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-mono font-semibold text-[#8FA4A8]">
                              {step.durationMs} ms
                            </span>
                            <button
                              onClick={(e) => toggleStepExpanded(step.id, e)}
                              className="p-1 rounded bg-white/5 hover:bg-white/10 text-[#8FA4A8] hover:text-white"
                            >
                              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                          </div>
                        </div>

                        {/* Expandable Substeps for Service */}
                        {isExpanded && step.substeps && step.substeps.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-[rgba(100,190,205,0.1)] pl-3 relative space-y-1">
                            <div className="absolute left-[4px] top-2.5 bottom-2.5 w-[1.5px] bg-[#F5B52E]/40" />

                            {step.substeps.map((sub, sIdx) => (
                              <div
                                key={sIdx}
                                className="flex items-center justify-between text-xs font-mono text-[#C3D5D8] pl-2"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#F5B52E]" />
                                  <span>{sub.name}</span>
                                </div>
                                <span className="text-[#8FA4A8] text-[10.5px]">{sub.durationMs} ms</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="w-full h-full rounded-xl border border-[rgba(100,190,205,0.14)] bg-[#071219] overflow-hidden relative min-h-[280px]">
                <ReactFlow
                  nodes={rfNodes}
                  edges={rfEdges}
                  fitView
                  panOnDrag
                  zoomOnScroll
                  proOptions={{ hideAttribution: true }}
                >
                  <Background gap={20} size={1} color="rgba(22, 199, 163, 0.05)" />
                  <Controls />
                </ReactFlow>
              </div>
            )}
          </div>

          {/* ── Fixed Bottom Execution Timeline (85-100px Height) ────────── */}
          <div className="mt-2 pt-2.5 border-t border-[rgba(100,190,205,0.12)] shrink-0 min-h-[85px]">
            <div className="flex items-center justify-between text-xs font-mono text-[#8FA4A8] mb-1.5">
              <span className="font-bold text-[#F2F7F7]">Execution Timeline</span>
              <span>Total: {activeTrace.durationMs} ms</span>
            </div>

            {/* Proportional Multi-Segment Timeline Bar */}
            <div className="w-full h-2.5 rounded-full bg-[#071219] overflow-hidden flex p-0.5 border border-[rgba(100,190,205,0.18)]">
              <div className="h-full bg-[#16C7A3] rounded-l-full" style={{ width: "5%" }} />
              <div className="h-full bg-[#2F80ED]" style={{ width: "4%" }} />
              <div className="h-full bg-[#F5B52E]" style={{ width: "63%" }} />
              <div className="h-full bg-[#8B5CF6] rounded-r-full" style={{ width: "28%" }} />
            </div>

            {/* Timeline Legend */}
            <div className="flex items-center gap-4 text-[10.5px] font-mono text-[#8FA4A8] mt-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16C7A3]" />
                HTTP (12ms)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2F80ED]" />
                Controller (8ms)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F5B52E]" />
                Service (156ms)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                Response (72ms)
              </span>
            </div>
          </div>
        </main>

        {/* ── Right Step Details Inspector Panel (21-25% ~315px) ─────────── */}
        <aside className="w-[315px] shrink-0 h-full bg-[#0A171C] border border-[rgba(100,190,205,0.14)] rounded-xl p-3 flex flex-col overflow-hidden select-none text-left">
          {/* Header */}
          <div className="flex items-start justify-between pb-2.5 border-b border-[rgba(100,190,205,0.12)] shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: activeStep.bgColor, border: `1px solid ${activeStep.borderColor}` }}
              >
                {React.createElement(activeStep.icon || Zap, {
                  size: 16,
                  style: { color: activeStep.color },
                })}
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-[#F2F7F7] font-mono truncate">
                  {activeStep.title}
                </h3>
                <span className="text-[10.5px] text-[#8FA4A8] font-mono truncate block">
                  {activeStep.name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2 py-0.5 rounded bg-[#16C7A3]/15 border border-[#16C7A3]/30 text-[#16C7A3] font-mono text-[10px] font-bold">
                {activeStep.durationMs} ms
              </span>
              <button
                onClick={() => setSelectedStepId("step-3")}
                className="text-[#8FA4A8] hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Inspector Tabs (Overview | Logs | Code | Dependencies) */}
          <div className="flex items-center gap-1 border-b border-[rgba(100,190,205,0.12)] my-2.5 pb-1 shrink-0">
            {(["Overview", "Logs", "Code", "Dependencies"] as InspectorTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveInspectorTab(tab)}
                className={`px-2 py-0.5 text-[11px] font-bold transition-all cursor-pointer relative ${
                  activeInspectorTab === tab
                    ? "text-[#16C7A3]"
                    : "text-[#8FA4A8] hover:text-[#F2F7F7]"
                }`}
              >
                {tab}
                {activeInspectorTab === tab && (
                  <motion.div
                    layoutId="inspectorTabIndicator"
                    className="absolute bottom-[-5px] left-0 right-0 h-[2px] bg-[#16C7A3]"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Inspector Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-0.5 min-h-0">
            {activeInspectorTab === "Overview" && (
              <>
                <div>
                  <h4 className="text-[9.5px] font-bold text-[#8FA4A8] uppercase tracking-wider mb-1">
                    Description
                  </h4>
                  <p className="text-[11px] text-[#C3D5D8] leading-relaxed">
                    {activeStep.description ||
                      "Handles background job processing using BullMQ. Adds the analysis job to the queue and handles metadata."}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[9.5px] font-bold text-[#8FA4A8] uppercase tracking-wider mb-1">
                    <span>Input</span>
                    <button
                      onClick={() =>
                        copyJsonPayload(JSON.stringify(activeStep.inputJson, null, 2))
                      }
                      className="text-[#16C7A3] hover:underline cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="bg-[#050B0E] border border-[rgba(100,190,205,0.12)] p-2 rounded-lg text-[10px] font-mono text-[#C9F7F1] overflow-x-auto select-text">
                    <code>
                      {JSON.stringify(
                        activeStep.inputJson || { fileId: "abc123", type: "document_analysis" },
                        null,
                        2
                      )}
                    </code>
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[9.5px] font-bold text-[#8FA4A8] uppercase tracking-wider mb-1">
                    <span>Output</span>
                    <button
                      onClick={() =>
                        copyJsonPayload(JSON.stringify(activeStep.outputJson, null, 2))
                      }
                      className="text-[#16C7A3] hover:underline cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="bg-[#050B0E] border border-[rgba(100,190,205,0.12)] p-2 rounded-lg text-[10px] font-mono text-[#2F80ED] overflow-x-auto select-text">
                    <code>
                      {JSON.stringify(
                        activeStep.outputJson || { jobId: "job_789", status: "queued" },
                        null,
                        2
                      )}
                    </code>
                  </pre>
                </div>

                <div>
                  <h4 className="text-[9.5px] font-bold text-[#8FA4A8] uppercase tracking-wider mb-1">
                    Dependencies
                  </h4>
                  <div className="space-y-1">
                    {(
                      activeStep.dependencies || [
                        { name: "Redis", role: "Cache & Queue Store", healthy: true },
                        { name: "Queue Manager", role: "BullMQ", healthy: true },
                      ]
                    ).map((dep, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-[#050B0E] border border-[rgba(100,190,205,0.12)] flex items-center justify-between text-xs min-h-[50px]"
                      >
                        <div>
                          <div className="font-bold text-[#F2F7F7] font-mono text-[11px]">{dep.name}</div>
                          <div className="text-[9.5px] text-[#8FA4A8]">{dep.role}</div>
                        </div>
                        <span className="flex items-center gap-1 text-[9.5px] font-bold text-[#16C7A3]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16C7A3]" />
                          Healthy
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeInspectorTab === "Logs" && (
              <div className="space-y-1.5">
                {(
                  activeStep.logs || [
                    { timestamp: "12:41:02.100", message: "Validate payload" },
                    { timestamp: "12:41:02.112", message: "Added job to queue" },
                    { timestamp: "12:41:03.045", message: "Processing metadata" },
                  ]
                ).map((log, lIdx) => (
                  <div
                    key={lIdx}
                    className="p-2 rounded bg-[#050B0E] border border-[rgba(100,190,205,0.1)] font-mono text-[10.5px] text-[#C3D5D8] flex items-start gap-2 select-text"
                  >
                    <span className="text-[#8FA4A8] text-[9.5px] shrink-0">{log.timestamp}</span>
                    <span className="flex-1">{log.message}</span>
                  </div>
                ))}
              </div>
            )}

            {activeInspectorTab === "Code" && (
              <div className="bg-[#050B0E] border border-[rgba(100,190,205,0.12)] p-2.5 rounded-lg text-left select-text">
                <div className="text-[9.5px] font-mono font-bold text-[#8FA4A8] mb-1.5 flex items-center gap-1.5">
                  <FileCode size={12} className="text-[#16C7A3]" />
                  <span>{activeStep.path || "src/jobs/analysis.queue.ts"}</span>
                </div>
                <pre className="font-mono text-[10px] text-[#C9F7F1] leading-relaxed overflow-x-auto">
                  <code>{`export async function enqueueAnalysis(payload: JobPayload) {
  const validated = validateSchema(payload);
  const job = await queue.add("analysis", validated, {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 }
  });
  return { jobId: job.id, status: "queued" };
}`}</code>
                </pre>
              </div>
            )}

            {activeInspectorTab === "Dependencies" && (
              <div className="space-y-1.5">
                {(
                  activeStep.dependencies || [
                    { name: "Redis", role: "Cache & Queue Store", healthy: true },
                    { name: "Queue Manager", role: "BullMQ", healthy: true },
                  ]
                ).map((dep, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#050B0E] border border-[rgba(100,190,205,0.12)] flex items-center justify-between min-h-[52px]"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#F2F7F7] font-mono">{dep.name}</div>
                      <div className="text-[10px] text-[#8FA4A8]">{dep.role}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#16C7A3]/15 text-[#16C7A3] text-[9.5px] font-bold border border-[#16C7A3]/30">
                      Healthy
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Button: View in Graph */}
          <div className="pt-2.5 border-t border-[rgba(100,190,205,0.12)] shrink-0 mt-2">
            <button
              onClick={() => onSwitchTab?.("file")}
              className="w-full h-8 rounded-lg bg-[#16C7A3]/15 hover:bg-[#16C7A3]/25 border border-[#16C7A3]/30 text-[#16C7A3] hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowRight size={13} />
              <span>View in Graph</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Copy Notification Toast */}
      <AnimatePresence>
        {copiedNotification && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 right-4 bg-[#16C7A3] text-[#061318] font-bold text-xs px-3 py-1.5 rounded-lg shadow-xl z-50 flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>{copiedNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

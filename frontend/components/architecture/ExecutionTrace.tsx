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
  ExternalLink,
  Star,
  Check,
  SlidersHorizontal,
  Globe,
  Activity,
} from "lucide-react";

type EndpointCategory = "All" | "Routes" | "Controllers" | "Services";
type InspectorTab = "Overview" | "Logs" | "Code" | "Dependencies";

const METHOD_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  GET: { bg: "bg-[#16C7A3]/15", text: "text-[#16C7A3]", border: "border-[#16C7A3]/30" },
  POST: { bg: "bg-[#3288F5]/15", text: "text-[#3288F5]", border: "border-[#3288F5]/30" },
  PUT: { bg: "bg-[#8B5CF6]/15", text: "text-[#8B5CF6]", border: "border-[#8B5CF6]/30" },
  DELETE: { bg: "bg-[#E83E5B]/15", text: "text-[#E83E5B]", border: "border-[#E83E5B]/30" },
  PATCH: { bg: "bg-[#F5A623]/15", text: "text-[#F5A623]", border: "border-[#F5A623]/30" },
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
        color: "#3288F5",
        bgColor: "rgba(50, 136, 245, 0.12)",
        borderColor: "rgba(50, 136, 245, 0.4)",
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
        color: "#F5A623",
        bgColor: "rgba(245, 166, 35, 0.12)",
        borderColor: "rgba(245, 166, 35, 0.5)",
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
    path: "/job::jobId:scan",
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
        description: "Fetch scan progress for specified job ID.",
        inputJson: { params: { jobId: "job_789" } },
        outputJson: { status: 200 },
        logs: [{ timestamp: "12:42:01.000", message: "Received GET /job/job_789/scan" }],
      },
      {
        id: "step-2",
        stepNum: 2,
        type: "controller",
        title: "Controller",
        name: "scan.controller",
        path: "src/controllers/scan.controller.ts",
        durationMs: 14,
        status: "Success",
        icon: Code,
        color: "#3288F5",
        bgColor: "rgba(50, 136, 245, 0.12)",
        borderColor: "rgba(50, 136, 245, 0.4)",
        description: "Validates auth token and extracts job parameter.",
        inputJson: { jobId: "job_789" },
        outputJson: { valid: true },
        logs: [{ timestamp: "12:42:01.014", message: "Verified Bearer JWT token" }],
      },
      {
        id: "step-3",
        stepNum: 3,
        type: "service",
        title: "Service",
        name: "scan.service",
        path: "src/services/scan.service.ts",
        durationMs: 210,
        status: "Expanded",
        icon: Zap,
        color: "#F5A623",
        bgColor: "rgba(245, 166, 35, 0.12)",
        borderColor: "rgba(245, 166, 35, 0.5)",
        description: "Queries PostgreSQL database for scan metrics and compiles results.",
        substeps: [
          { name: "Fetch job record", durationMs: 45 },
          { name: "Query scan results", durationMs: 130 },
          { name: "Calculate health score", durationMs: 35 },
        ],
        inputJson: { jobId: "job_789" },
        outputJson: { status: "COMPLETED", progress: 100 },
        logs: [{ timestamp: "12:42:01.150", message: "Fetched job status from DB" }],
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
        description: "Scan details returned to client.",
        inputJson: { status: 200 },
        outputJson: { success: true },
        logs: [{ timestamp: "12:42:01.310", message: "Response sent" }],
      },
    ],
  },
  {
    id: "POST:/api/auth/login",
    method: "POST",
    path: "/api/auth/login",
    moduleTag: "Authentication",
    category: "Controllers",
    successRate: "99%",
    durationMs: 185,
    durationCompare: "↓ 15% vs. last run",
    dbQueries: 2,
    dbNote: "User & Session DB",
    authFlow: "Public Endpoint",
    authNote: "Issues JWT Cookie",
    complexityScore: 10,
    complexityNote: "Bcrypt & JWT",
    steps: [
      {
        id: "step-1",
        stepNum: 1,
        type: "http",
        title: "HTTP Request",
        name: "POST /api/auth/login",
        durationMs: 10,
        status: "200 OK",
        icon: Globe,
        color: "#16C7A3",
        bgColor: "rgba(22, 199, 163, 0.12)",
        borderColor: "rgba(22, 199, 163, 0.4)",
        description: "User authentication attempt.",
        inputJson: { email: "user@civicchain.io" },
        outputJson: { status: 200 },
        logs: [{ timestamp: "12:43:00.001", message: "Login attempt received" }],
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
        color: "#3288F5",
        bgColor: "rgba(50, 136, 245, 0.12)",
        borderColor: "rgba(50, 136, 245, 0.4)",
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
        color: "#F5A623",
        bgColor: "rgba(245, 166, 35, 0.12)",
        borderColor: "rgba(245, 166, 35, 0.5)",
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
                : "bg-[#0E1B20] border-[#16C7A3]/20 text-[#8EA9AE] hover:border-[#16C7A3]/50"
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: step.color }} />
              <span>{step.title}</span>
              <span className="ml-auto text-[10px] text-[#8EA9AE]">{step.durationMs} ms</span>
            </div>
            <div className="text-xs font-mono font-bold text-[#F7FAFA] mt-1">{step.name}</div>
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
    <div className="h-full w-full bg-[#061015] flex flex-col overflow-hidden text-left font-sans select-none relative">
      {/* ── 1. Top Application Header (56-64px) ────────────────────────── */}
      <div className="h-[58px] px-5 bg-[#0A171F] border-b border-[#16C7A3]/15 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSwitchTab?.("layer")}
            className="w-9 h-9 rounded-lg bg-[#0E1B20] hover:bg-[#14262E] border border-[#16C7A3]/20 text-[#8EA9AE] hover:text-[#F7FAFA] flex items-center justify-center cursor-pointer transition-colors"
            title="Back to Architecture Explorer"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#16C7A3]/15 border border-[#16C7A3]/30 flex items-center justify-center text-[#16C7A3] shrink-0">
              <Zap size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#F7FAFA] tracking-tight leading-tight">
                Execution Trace
              </h1>
              <p className="text-[11px] text-[#8EA9AE] font-medium leading-none mt-0.5">
                Trace and visualize the execution flow of your API request
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-[#0E1B20] border border-[#16C7A3]/20 rounded-lg px-2.5 py-1.5 text-xs text-[#8EA9AE]">
            <span className="text-[11px] font-semibold text-[#8EA9AE]">Environment</span>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="bg-transparent text-[#F7FAFA] font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value="Development" className="bg-[#0E1B20] text-[#F7FAFA]">
                Development
              </option>
              <option value="Staging" className="bg-[#0E1B20] text-[#F7FAFA]">
                Staging
              </option>
              <option value="Production" className="bg-[#0E1B20] text-[#F7FAFA]">
                Production
              </option>
            </select>
          </div>

          <button
            onClick={() => copyJsonPayload(window.location.href)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E1B20] hover:bg-[#14262E] border border-[#16C7A3]/20 text-[#F7FAFA] text-xs font-semibold cursor-pointer transition-colors"
          >
            <Share2 size={13} className="text-[#16C7A3]" />
            <span>Share</span>
          </button>

          <button
            className="w-9 h-9 rounded-lg bg-[#0E1B20] hover:bg-[#14262E] border border-[#16C7A3]/20 text-[#8EA9AE] hover:text-[#F7FAFA] flex items-center justify-center cursor-pointer transition-colors"
            title="More Options"
          >
            <MoreVertical size={16} />
          </button>

          <button
            onClick={() => {
              setIsPlaying(true);
              setTimeout(() => setIsPlaying(false), 1200);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#16C7A3] hover:bg-[#16C7A3]/90 text-[#061015] text-xs font-bold cursor-pointer transition-all shadow-md shadow-[#16C7A3]/20"
          >
            <RotateCcw size={13} className={isPlaying ? "animate-spin" : ""} />
            <span>Run Again</span>
          </button>
        </div>
      </div>

      {/* ── 2. Main 3-Column Content Body ───────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3.5 bg-[#061015]">
        {/* ── Left API Endpoints Column (~210px) ───────────────────────── */}
        <aside className="w-[210px] shrink-0 h-full bg-[#0A171F] border border-[#16C7A3]/15 rounded-xl p-3 flex flex-col overflow-hidden select-none">
          <div className="mb-2.5 shrink-0">
            <h2 className="text-xs font-bold text-[#F7FAFA] tracking-wider uppercase mb-2">
              API Endpoints
            </h2>

            <div className="relative mb-2">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8EA9AE]" />
              <input
                type="text"
                placeholder="Search endpoints..."
                value={routeSearch}
                onChange={(e) => setRouteSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-7 rounded-lg bg-[#0E1B20] border border-[#16C7A3]/20 text-xs text-[#F7FAFA] placeholder-[#8EA9AE] focus:outline-none focus:border-[#16C7A3]"
              />
              <SlidersHorizontal
                size={12}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8EA9AE]"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {(["All", "Routes", "Controllers", "Services"] as EndpointCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#16C7A3] text-[#061015]"
                      : "text-[#8EA9AE] hover:text-[#F7FAFA] hover:bg-[#0E1B20]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

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
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all duration-150 relative ${
                    isSelected
                      ? "bg-[#0E1B20] border-[#16C7A3]/50 border-l-2 border-l-[#16C7A3] shadow-md"
                      : "bg-[#0A171F] border-[#16C7A3]/10 hover:border-[#16C7A3]/30 hover:bg-[#0E1B20]/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono border ${methodStyle.bg} ${methodStyle.text} ${methodStyle.border}`}
                    >
                      {ep.method}
                    </span>
                    <div className="flex items-center gap-1">
                      {ep.isStarred && <Star size={11} className="text-[#F5A623] fill-[#F5A623]" />}
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16C7A3]" />
                    </div>
                  </div>

                  <div className="text-xs font-mono font-bold text-[#F7FAFA] truncate" title={ep.path}>
                    {ep.path}
                  </div>
                  <div className="text-[10px] text-[#8EA9AE] font-medium mt-0.5 truncate">
                    {ep.moduleTag}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── Center Main Execution Workspace (~58% Width) ───────────────── */}
        <main className="flex-1 flex flex-col bg-[#050B10] border border-[#16C7A3]/15 rounded-xl p-4 overflow-hidden relative text-left select-none">
          <div className="flex items-center justify-between pb-3 border-b border-[#16C7A3]/15 shrink-0">
            <div className="flex items-center gap-3 truncate">
              <span
                className={`px-3 py-1 rounded-md text-xs font-bold font-mono tracking-wide ${
                  METHOD_STYLES[activeTrace.method]?.bg || "bg-[#16C7A3]/20"
                } ${METHOD_STYLES[activeTrace.method]?.text || "text-[#16C7A3]"}`}
              >
                {activeTrace.method}
              </span>
              <div className="truncate">
                <h2 className="text-lg font-bold text-[#F7FAFA] font-mono leading-tight truncate">
                  {activeTrace.path}
                </h2>
                <p className="text-xs text-[#8EA9AE] mt-0.5">
                  Track the request flow from entry point to response
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 bg-[#0E1B20] p-1 rounded-lg border border-[#16C7A3]/20">
                <button
                  onClick={handleStepPrev}
                  className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 text-[#8EA9AE] hover:text-white flex items-center justify-center cursor-pointer"
                  title="Previous Step"
                >
                  <SkipBack size={13} />
                </button>
                <button
                  onClick={handlePlayToggle}
                  className={`w-8 h-8 rounded flex items-center justify-center font-bold transition-all cursor-pointer ${
                    isPlaying
                      ? "bg-[#F5A623] text-[#061015]"
                      : "bg-[#16C7A3] text-[#061015] shadow-md shadow-[#16C7A3]/20"
                  }`}
                  title={isPlaying ? "Pause Trace" : "Play Trace"}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                </button>
                <button
                  onClick={handleStepNext}
                  className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 text-[#8EA9AE] hover:text-white flex items-center justify-center cursor-pointer"
                  title="Next Step"
                >
                  <SkipForward size={13} />
                </button>
              </div>

              <div className="flex items-center bg-[#0E1B20] p-1 rounded-lg border border-[#16C7A3]/20 text-xs font-semibold">
                <button
                  onClick={() => setViewMode("timeline")}
                  className={`flex items-center gap-1 px-3 py-1 rounded cursor-pointer transition-colors ${
                    viewMode === "timeline" ? "bg-[#16C7A3] text-[#061015] font-bold" : "text-[#8EA9AE]"
                  }`}
                >
                  <Clock size={12} />
                  <span>Timeline</span>
                </button>
                <button
                  onClick={() => setViewMode("graph")}
                  className={`flex items-center gap-1 px-3 py-1 rounded cursor-pointer transition-colors ${
                    viewMode === "graph" ? "bg-[#16C7A3] text-[#061015] font-bold" : "text-[#8EA9AE]"
                  }`}
                >
                  <Network size={12} />
                  <span>Graph</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── 5-Column Metrics Panel (70-80px Height) ────────────────── */}
          <div className="grid grid-cols-5 divide-x divide-[#16C7A3]/15 bg-[#0E1B20] border border-[#16C7A3]/20 rounded-xl my-3 p-3 text-center shrink-0">
            <div className="flex flex-col items-center justify-center px-1">
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#8EA9AE] tracking-wider mb-0.5">
                <CheckCircle2 size={12} className="text-[#16C7A3]" />
                <span>Success</span>
              </div>
              <div className="text-base font-bold text-[#16C7A3] font-mono leading-none">
                {activeTrace.successRate}
              </div>
              <span className="text-[9.5px] text-[#8EA9AE] mt-0.5">Request completed</span>
            </div>

            <div className="flex flex-col items-center justify-center px-1">
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#8EA9AE] tracking-wider mb-0.5">
                <Clock size={12} className="text-[#3288F5]" />
                <span>Duration</span>
              </div>
              <div className="text-base font-bold text-[#F7FAFA] font-mono leading-none">
                {activeTrace.durationMs} ms
              </div>
              <span className="text-[9.5px] text-[#16C7A3] mt-0.5">{activeTrace.durationCompare}</span>
            </div>

            <div className="flex flex-col items-center justify-center px-1">
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#8EA9AE] tracking-wider mb-0.5">
                <Database size={12} className="text-[#8B5CF6]" />
                <span>DB Queries</span>
              </div>
              <div className="text-base font-bold text-[#F7FAFA] font-mono leading-none">
                {activeTrace.dbQueries}
              </div>
              <span className="text-[9.5px] text-[#8EA9AE] mt-0.5">{activeTrace.dbNote}</span>
            </div>

            <div className="flex flex-col items-center justify-center px-1">
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#8EA9AE] tracking-wider mb-0.5">
                <Shield size={12} className="text-[#F5A623]" />
                <span>Auth Flow</span>
              </div>
              <div className="text-base font-bold text-[#F7FAFA] font-mono leading-none">
                {activeTrace.authFlow}
              </div>
              <span className="text-[9.5px] text-[#8EA9AE] mt-0.5">{activeTrace.authNote}</span>
            </div>

            <div className="flex flex-col items-center justify-center px-1">
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#8EA9AE] tracking-wider mb-0.5">
                <Activity size={12} className="text-[#E83E5B]" />
                <span>Complexity</span>
              </div>
              <div className="text-base font-bold text-[#F7FAFA] font-mono leading-none">
                Σ {activeTrace.complexityScore}
              </div>
              <span className="text-[9.5px] text-[#8EA9AE] mt-0.5">{activeTrace.complexityNote}</span>
            </div>
          </div>

          {/* ── Main Trace View (Timeline vs ReactFlow Graph) ───────────── */}
          <div className="flex-1 overflow-y-auto my-1 pr-1">
            {viewMode === "timeline" ? (
              <div className="relative pl-10 pr-2 py-2 space-y-4 select-none">
                <div className="absolute left-[22px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-[#16C7A3] via-[#3288F5] to-[#8B5CF6] z-0" />

                {activeTrace.steps.map((step) => {
                  const IconComp = step.icon || Globe;
                  const isSelected = selectedStepId === step.id;
                  const isExpanded = expandedSteps[step.id];

                  return (
                    <div key={step.id} className="relative z-10 flex items-start gap-4">
                      <div
                        onClick={() => setSelectedStepId(step.id)}
                        className={`w-[36px] h-[36px] rounded-full flex items-center justify-center font-bold text-xs font-mono shrink-0 cursor-pointer shadow-lg transition-transform ${
                          isSelected ? "scale-110 ring-4 ring-[#16C7A3]/30" : ""
                        }`}
                        style={{
                          backgroundColor: step.color,
                          color: "#061015",
                        }}
                      >
                        {step.stepNum}
                      </div>

                      <div
                        onClick={() => setSelectedStepId(step.id)}
                        className={`flex-1 rounded-xl p-3.5 border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-[#0E1B20] border-[#16C7A3] shadow-xl"
                            : "bg-[#0E1B20]/80 border-[#16C7A3]/20 hover:border-[#16C7A3]/50 hover:bg-[#0E1B20]"
                        }`}
                        style={{
                          borderLeftWidth: "4px",
                          borderLeftColor: step.color,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 truncate">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                              style={{ backgroundColor: step.bgColor, border: `1px solid ${step.borderColor}` }}
                            >
                              <IconComp size={14} style={{ color: step.color }} />
                            </div>
                            <div className="truncate">
                              <h3 className="text-xs font-bold text-[#F7FAFA] font-mono leading-tight truncate">
                                {step.title}
                              </h3>
                              <span className="text-[11px] font-mono text-[#8EA9AE] truncate block">
                                {step.name}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-mono font-semibold text-[#8EA9AE]">
                              {step.durationMs} ms
                            </span>
                            <button
                              onClick={(e) => toggleStepExpanded(step.id, e)}
                              className="p-1 rounded bg-white/5 hover:bg-white/10 text-[#8EA9AE] hover:text-white"
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                        </div>

                        {isExpanded && step.substeps && step.substeps.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-[#16C7A3]/10 pl-4 relative space-y-1.5">
                            <div className="absolute left-[6px] top-3 bottom-3 w-[1.5px] bg-[#F5A623]/40" />

                            {step.substeps.map((sub, sIdx) => (
                              <div
                                key={sIdx}
                                className="flex items-center justify-between text-xs font-mono text-[#C3D5D8] pl-2"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623]" />
                                  <span>{sub.name}</span>
                                </div>
                                <span className="text-[#8EA9AE] text-[11px]">{sub.durationMs} ms</span>
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
              <div className="w-full h-full rounded-xl border border-[#16C7A3]/20 bg-[#0A171F] overflow-hidden relative">
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

          {/* ── Bottom Proportional Execution Timeline ──────────────────── */}
          <div className="mt-2 pt-3 border-t border-[#16C7A3]/15 shrink-0">
            <div className="flex items-center justify-between text-xs font-mono text-[#8EA9AE] mb-1.5">
              <span className="font-bold text-[#F7FAFA]">Execution Timeline</span>
              <span>Total: {activeTrace.durationMs} ms</span>
            </div>

            <div className="w-full h-3 rounded-full bg-[#0A171F] overflow-hidden flex p-0.5 border border-[#16C7A3]/20">
              <div className="h-full bg-[#16C7A3] rounded-l-full" style={{ width: "5%" }} />
              <div className="h-full bg-[#3288F5]" style={{ width: "4%" }} />
              <div className="h-full bg-[#F5A623]" style={{ width: "63%" }} />
              <div className="h-full bg-[#8B5CF6] rounded-r-full" style={{ width: "28%" }} />
            </div>

            <div className="flex items-center gap-4 text-[11px] font-mono text-[#8EA9AE] mt-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16C7A3]" />
                HTTP (12ms)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3288F5]" />
                Controller (8ms)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F5A623]" />
                Service (156ms)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                Response (72ms)
              </span>
            </div>
          </div>
        </main>

        {/* ── Right Step Details Inspector Column (~320px) ────────────────── */}
        <aside className="w-[320px] shrink-0 h-full bg-[#0A171F] border border-[#16C7A3]/15 rounded-xl p-4 flex flex-col overflow-y-auto select-none text-left">
          <div className="flex items-start justify-between pb-3 border-b border-[#16C7A3]/15 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: activeStep.bgColor, border: `1px solid ${activeStep.borderColor}` }}
              >
                {React.createElement(activeStep.icon || Zap, {
                  size: 18,
                  style: { color: activeStep.color },
                })}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#F7FAFA] font-mono truncate">
                  {activeStep.title}
                </h3>
                <span className="text-[11px] text-[#8EA9AE] font-mono truncate block">
                  {activeStep.name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2 py-0.5 rounded bg-[#16C7A3]/15 border border-[#16C7A3]/30 text-[#16C7A3] font-mono text-[10.5px] font-bold">
                {activeStep.durationMs} ms
              </span>
              <button
                onClick={() => setSelectedStepId("step-3")}
                className="text-[#8EA9AE] hover:text-white cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 border-b border-[#16C7A3]/15 my-3 pb-1 shrink-0">
            {(["Overview", "Logs", "Code", "Dependencies"] as InspectorTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveInspectorTab(tab)}
                className={`px-2.5 py-1 text-xs font-bold transition-all cursor-pointer relative ${
                  activeInspectorTab === tab
                    ? "text-[#16C7A3]"
                    : "text-[#8EA9AE] hover:text-[#F7FAFA]"
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

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-0.5">
            {activeInspectorTab === "Overview" && (
              <>
                <div>
                  <h4 className="text-[10px] font-bold text-[#8EA9AE] uppercase tracking-wider mb-1">
                    Description
                  </h4>
                  <p className="text-xs text-[#C3D5D8] leading-relaxed">
                    {activeStep.description ||
                      "Handles background job processing using BullMQ. Adds the analysis job to the queue and handles metadata."}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#8EA9AE] uppercase tracking-wider mb-1">
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
                  <pre className="bg-[#050B10] border border-[#16C7A3]/15 p-2.5 rounded-lg text-[10.5px] font-mono text-[#16C7A3] overflow-x-auto select-text">
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
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#8EA9AE] uppercase tracking-wider mb-1">
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
                  <pre className="bg-[#050B10] border border-[#16C7A3]/15 p-2.5 rounded-lg text-[10.5px] font-mono text-[#3288F5] overflow-x-auto select-text">
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
                  <h4 className="text-[10px] font-bold text-[#8EA9AE] uppercase tracking-wider mb-1.5">
                    Dependencies
                  </h4>
                  <div className="space-y-1.5">
                    {(
                      activeStep.dependencies || [
                        { name: "Redis", role: "Cache & Queue Store", healthy: true },
                        { name: "Queue Manager", role: "BullMQ", healthy: true },
                      ]
                    ).map((dep, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-[#050B10] border border-[#16C7A3]/15 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-[#F7FAFA] font-mono">{dep.name}</div>
                          <div className="text-[10px] text-[#8EA9AE]">{dep.role}</div>
                        </div>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#16C7A3]">
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
                    className="p-2 rounded bg-[#050B10] border border-[#16C7A3]/10 font-mono text-[11px] text-[#C3D5D8] flex items-start gap-2 select-text"
                  >
                    <span className="text-[#8EA9AE] text-[10px] shrink-0">{log.timestamp}</span>
                    <span className="flex-1">{log.message}</span>
                  </div>
                ))}
              </div>
            )}

            {activeInspectorTab === "Code" && (
              <div className="bg-[#050B10] border border-[#16C7A3]/15 p-3 rounded-lg text-left select-text">
                <div className="text-[10px] font-mono font-bold text-[#8EA9AE] mb-2 flex items-center gap-1.5">
                  <FileCode size={13} className="text-[#16C7A3]" />
                  <span>{activeStep.path || "src/jobs/analysis.queue.ts"}</span>
                </div>
                <pre className="font-mono text-[10.5px] text-[#C3D5D8] leading-relaxed overflow-x-auto">
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
              <div className="space-y-2">
                {(
                  activeStep.dependencies || [
                    { name: "Redis", role: "Cache & Queue Store", healthy: true },
                    { name: "Queue Manager", role: "BullMQ", healthy: true },
                  ]
                ).map((dep, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#050B10] border border-[#16C7A3]/20 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#F7FAFA] font-mono">{dep.name}</div>
                      <div className="text-[10px] text-[#8EA9AE]">{dep.role}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#16C7A3]/15 text-[#16C7A3] text-[10px] font-bold border border-[#16C7A3]/30">
                      Healthy
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#16C7A3]/15 shrink-0 mt-2">
            <button
              onClick={() => onSwitchTab?.("file")}
              className="w-full h-9 rounded-lg bg-[#16C7A3] hover:bg-[#16C7A3]/90 text-[#061015] font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#16C7A3]/20 cursor-pointer"
            >
              <ExternalLink size={13} />
              <span>View in Graph</span>
            </button>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {copiedNotification && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 right-4 bg-[#16C7A3] text-[#061015] font-bold text-xs px-3 py-1.5 rounded-lg shadow-xl z-50 flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>{copiedNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

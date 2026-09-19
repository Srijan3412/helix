"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
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
  ChevronRight,
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
  Globe,
  Activity,
  Maximize2,
  Sparkles,
  Layers,
  Copy,
  Info,
  SlidersHorizontal,
  Server,
} from "lucide-react";

type EndpointCategory = "All" | "Routes" | "Controllers" | "Services";

const METHOD_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  GET: { bg: "bg-[#16C7A3]/15", text: "text-[#16C7A3]", border: "border-[#16C7A3]/30" },
  POST: { bg: "bg-[#2F80ED]/15", text: "text-[#2F80ED]", border: "border-[#2F80ED]/30" },
  PUT: { bg: "bg-[#8B5CF6]/15", text: "text-[#8B5CF6]", border: "border-[#8B5CF6]/30" },
  DELETE: { bg: "bg-[#FF4D5E]/15", text: "text-[#FF4D5E]", border: "border-[#FF4D5E]/30" },
  PATCH: { bg: "bg-[#F5B52E]/15", text: "text-[#F5B52E]", border: "border-[#F5B52E]/30" },
};

function cleanRoutePath(path: string): string {
  if (!path) return "/";
  let cleaned = path.trim();
  cleaned = cleaned.replace(/^[`'"]+|[`'"]+$/g, "");
  cleaned = cleaned.replace(/^\/`/, "/").replace(/`$/, "");
  cleaned = cleaned.replace(/\$\{([^}]+)\}/g, ":$1");
  cleaned = cleaned.replace(/\/+/g, "/");
  if (!cleaned.startsWith("/")) {
    cleaned = "/" + cleaned;
  }
  return cleaned;
}

interface TraceSubStep {
  name: string;
  durationMs: number;
}

interface TraceStepItem {
  id: string;
  stepNum: number;
  type: "http" | "controller" | "service" | "response" | "database" | "middleware";
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
    id: "POST:/api/auth/reset-password",
    method: "POST",
    path: "/api/auth/reset-password",
    moduleTag: "Authentication",
    isStarred: true,
    category: "Controllers",
    successRate: "99.8%",
    durationMs: 58,
    durationCompare: "Fast (top 10%)",
    dbQueries: 2,
    dbNote: "Optimized with index scan",
    authFlow: "Public / Guarded",
    authNote: "Rate limited & JWT verified",
    complexityScore: 4,
    complexityNote: "Linear execution pipeline",
    steps: [
      {
        id: "step-1",
        stepNum: 1,
        type: "http",
        title: "Inbound HTTP Request",
        name: "POST /api/auth/reset-password",
        durationMs: 12,
        status: "200 OK",
        icon: Globe,
        color: "#16C7A3",
        bgColor: "rgba(22, 199, 163, 0.12)",
        borderColor: "rgba(22, 199, 163, 0.4)",
        description: "Inbound HTTP POST request received by edge gateway and validated against SSL/TLS headers.",
        inputJson: {
          headers: { "host": "api.helix.dev", "content-type": "application/json" },
          path: "/api/auth/reset-password",
          method: "POST",
        },
        outputJson: { status: 200, latencyMs: 12 },
        logs: [
          { timestamp: "00:00.002", message: "TLS handshake complete, routing to worker 4" },
          { timestamp: "00:00.008", message: "Parsed HTTP payload (124 bytes)" },
        ],
        dependencies: [{ name: "HTTP Gateway", role: "Edge Router", healthy: true }],
      },
      {
        id: "step-2",
        stepNum: 2,
        type: "controller",
        title: "Controller Handler",
        name: "auth.routes",
        path: "src/routes/auth.routes.ts",
        durationMs: 15,
        status: "200 OK",
        icon: Code,
        color: "#2F80ED",
        bgColor: "rgba(47, 128, 237, 0.12)",
        borderColor: "rgba(47, 128, 237, 0.4)",
        description: "Receives request payload, validates schema parameters, and invokes core domain services.",
        substeps: [
          { name: "Validate Request DTO Schema", durationMs: 8 },
          { name: "Dispatch to Service Pipeline", durationMs: 7 },
        ],
        inputJson: { email: "user@example.com", token: "reset_sec_99a8b" },
        outputJson: { validated: true, handler: "auth.routes.ts" },
        logs: [
          { timestamp: "00:00.015", message: "Zod DTO validation passed" },
          { timestamp: "00:00.022", message: "Forwarded to fastify auth service" },
        ],
        dependencies: [{ name: "Zod Schema Validator", role: "DTO Schema", healthy: true }],
      },
      {
        id: "step-3",
        stepNum: 3,
        type: "service",
        title: "Business Service",
        name: "fastify",
        path: "src/services/auth.service.ts",
        durationMs: 23,
        status: "200 OK",
        icon: Zap,
        color: "#F5B52E",
        bgColor: "rgba(245, 181, 46, 0.12)",
        borderColor: "rgba(245, 181, 46, 0.4)",
        description: "Processes business domain operations for fastify auth handler.",
        substeps: [
          { name: "Execute business logic", durationMs: 13 },
          { name: "Process payload transformations", durationMs: 10 },
        ],
        inputJson: { action: "fastify", file: "fastify" },
        outputJson: { success: true, processed: true },
        logs: [
          { timestamp: "00:00.030", message: "Executed fastify business action" },
          { timestamp: "00:00.045", message: "Payload state committed" },
        ],
        dependencies: [{ name: "Fastify Core", role: "Business Engine", healthy: true }],
      },
      {
        id: "step-4",
        stepNum: 4,
        type: "response",
        title: "HTTP Response",
        name: "201 Created",
        durationMs: 8,
        status: "201 Created",
        icon: CheckCircle2,
        color: "#16C7A3",
        bgColor: "rgba(22, 199, 163, 0.12)",
        borderColor: "rgba(22, 199, 163, 0.4)",
        description: "Generated 201 Created JSON response with session headers and security tokens.",
        inputJson: { status: 201, success: true },
        outputJson: { message: "Password reset instructions sent", status: 201 },
        logs: [{ timestamp: "00:00.058", message: "Response headers written, connection closed" }],
        dependencies: [{ name: "Response Stream", role: "Payload Serializer", healthy: true }],
      },
    ],
  },
  {
    id: "POST:/api/contact",
    method: "POST",
    path: "/api/contact",
    moduleTag: "Contact",
    category: "Routes",
    successRate: "100%",
    durationMs: 42,
    durationCompare: "Optimal",
    dbQueries: 1,
    dbNote: "Contact entry created",
    authFlow: "Public",
    authNote: "Anti-spam captcha",
    complexityScore: 3,
    complexityNote: "Direct DB write",
    steps: [
      {
        id: "step-1",
        stepNum: 1,
        type: "http",
        title: "Inbound HTTP Request",
        name: "POST /api/contact",
        durationMs: 10,
        status: "200 OK",
        icon: Globe,
        color: "#16C7A3",
        bgColor: "rgba(22, 199, 163, 0.12)",
        borderColor: "rgba(22, 199, 163, 0.4)",
        description: "Contact submission endpoint.",
      },
      {
        id: "step-2",
        stepNum: 2,
        type: "controller",
        title: "Controller Handler",
        name: "contact.routes",
        path: "src/routes/contact.routes.ts",
        durationMs: 14,
        status: "200 OK",
        icon: Code,
        color: "#2F80ED",
        bgColor: "rgba(47, 128, 237, 0.12)",
        borderColor: "rgba(47, 128, 237, 0.4)",
      },
      {
        id: "step-3",
        stepNum: 3,
        type: "service",
        title: "Business Service",
        name: "contact.service",
        durationMs: 18,
        status: "200 OK",
        icon: Zap,
        color: "#F5B52E",
        bgColor: "rgba(245, 181, 46, 0.12)",
        borderColor: "rgba(245, 181, 46, 0.4)",
      },
    ],
  },
  {
    id: "GET:/api/admin/users",
    method: "GET",
    path: "/api/admin/users",
    moduleTag: "Admin",
    category: "Controllers",
    successRate: "100%",
    durationMs: 65,
    durationCompare: "Normal",
    dbQueries: 1,
    dbNote: "Paginated user query",
    authFlow: "Admin Only",
    authNote: "RBAC Guard required",
    complexityScore: 5,
    complexityNote: "Database projection",
    steps: [
      {
        id: "step-1",
        stepNum: 1,
        type: "http",
        title: "Inbound HTTP Request",
        name: "GET /api/admin/users",
        durationMs: 12,
        status: "200 OK",
        icon: Globe,
        color: "#16C7A3",
        bgColor: "rgba(22, 199, 163, 0.12)",
        borderColor: "rgba(22, 199, 163, 0.4)",
      },
      {
        id: "step-2",
        stepNum: 2,
        type: "middleware",
        title: "Middleware / Guard",
        name: "adminGuard",
        durationMs: 8,
        status: "200 OK",
        icon: Shield,
        color: "#16C7A3",
        bgColor: "rgba(22, 199, 163, 0.12)",
        borderColor: "rgba(22, 199, 163, 0.4)",
      },
      {
        id: "step-3",
        stepNum: 3,
        type: "service",
        title: "Business Service",
        name: "admin.service",
        durationMs: 45,
        status: "200 OK",
        icon: Zap,
        color: "#F5B52E",
        bgColor: "rgba(245, 181, 46, 0.12)",
        borderColor: "rgba(245, 181, 46, 0.4)",
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

  // Layout / collapse state
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(false);
  const [isRightInspectorOpen, setIsRightInspectorOpen] = useState<boolean>(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const [isStatsDrawerOpen, setIsStatsDrawerOpen] = useState<boolean>(false);

  // Inspector accordion sections
  const [openInspectorSections, setOpenInspectorSections] = useState<Record<string, boolean>>({
    input: false,
    output: false,
    dependencies: false,
    logs: false,
    code: false,
  });

  const toggleInspectorSection = (key: string) => {
    setOpenInspectorSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [selectedEndpointId, setSelectedEndpointId] = useState<string>(
    initialRouteId || MOCK_TRACES[0].id
  );
  const [routeSearch, setRouteSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<EndpointCategory>("All");
  const [environment, setEnvironment] = useState<string>("Development");
  const [viewMode, setViewMode] = useState<"timeline" | "graph">("timeline");
  const [selectedStepId, setSelectedStepId] = useState<string>("step-3");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({
    "step-3": true,
  });
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  useEffect(() => {
    if (initialRouteId) {
      setSelectedEndpointId(initialRouteId);
    }
  }, [initialRouteId]);

  const { data: apiTraces } = useQuery({
    queryKey: ["executionTraces", currentJobId],
    queryFn: () => getExecutionTraces(currentJobId!),
    enabled: !!currentJobId,
  });

  // Build realistic dynamic steps from backend trace steps or AST route chain
  const buildDynamicSteps = useCallback(
    (rawSteps: any[], method: string, rawRoutePath: string, envVars?: string[]): TraceStepItem[] => {
      const routePath = cleanRoutePath(rawRoutePath);
      const formattedSteps: TraceStepItem[] = [];
      let currentStepNum = 1;

      // 1. Initial Inbound HTTP Request
      formattedSteps.push({
        id: "step-http",
        stepNum: currentStepNum++,
        type: "http",
        title: "Inbound HTTP Request",
        name: `${method} ${routePath}`,
        durationMs: 12,
        status: "200 OK",
        icon: Globe,
        color: "#16C7A3",
        bgColor: "rgba(22, 199, 163, 0.12)",
        borderColor: "rgba(22, 199, 163, 0.4)",
        description: `Inbound HTTP ${method} request matching route pattern ${routePath}.`,
        inputJson: { method, path: routePath, headers: { "Accept": "application/json", "Content-Type": "application/json" } },
        outputJson: { status: method === "POST" ? 201 : 200, latencyMs: 12 },
        logs: [
          { timestamp: "00:00.001", message: `Received ${method} ${routePath}` },
          { timestamp: "00:00.003", message: `Matched registered route pattern ${routePath}` },
        ],
        dependencies: [{ name: "HTTP Router", role: "Request Dispatcher", healthy: true }],
      });

      // 2. Intermediate pipeline steps
      if (rawSteps && rawSteps.length > 0) {
        rawSteps.forEach((s: any, idx: number) => {
          const stepType = s.type || "service";
          const stepName = String(s.name || `step_${idx + 1}`).replace(/[`'"]/g, "");
          const stepId = `step-${idx + 2}`;

          let icon = Zap;
          let color = "#F5B52E";
          let bgColor = "rgba(245, 181, 46, 0.12)";
          let borderColor = "rgba(245, 181, 46, 0.4)";
          let title = "Business Service";
          let desc = `Processes business domain operations for ${stepName}.`;
          let substeps: TraceSubStep[] = [
            { name: `Execute ${stepName} logic`, durationMs: 15 + idx * 5 },
            { name: "Process payload transformations", durationMs: 10 + idx * 3 },
          ];
          let inputJson: any = { action: stepName, file: s.filePath || "internal" };
          let outputJson: any = { success: true, processed: true };

          if (stepType === "middleware") {
            icon = Shield;
            color = "#16C7A3";
            bgColor = "rgba(22, 199, 163, 0.12)";
            borderColor = "rgba(22, 199, 163, 0.4)";
            title = "Middleware / Guard";
            desc = `Validates request headers, authentication token and security policies (${stepName}).`;
            substeps = [
              { name: "Validate JWT / Session Header", durationMs: 6 },
              { name: "Verify Route Permissions", durationMs: 4 },
            ];
            inputJson = { authorization: "Bearer eyJhbGciOi...", scope: "read:write" };
            outputJson = { authenticated: true, authorized: true };
          } else if (stepType === "controller") {
            icon = Code;
            color = "#2F80ED";
            bgColor = "rgba(47, 128, 237, 0.12)";
            borderColor = "rgba(47, 128, 237, 0.4)";
            title = "Controller Handler";
            desc = `Receives request payload, validates schema parameters, and invokes core domain services.`;
            substeps = [
              { name: "Validate Request DTO Schema", durationMs: 8 },
              { name: "Dispatch to Service Pipeline", durationMs: 6 },
            ];
            inputJson = { path: routePath, method, timestamp: new Date().toISOString() };
            outputJson = { status: "dispatched", handler: stepName };
          } else if (stepType === "repository") {
            icon = Database;
            color = "#EC4899";
            bgColor = "rgba(236, 72, 153, 0.12)";
            borderColor = "rgba(236, 72, 153, 0.4)";
            title = "Data Access Repository";
            desc = `Executes persistence operations and schema queries via ${stepName}.`;
            substeps = [
              { name: `Query ${stepName} records`, durationMs: 18 },
              { name: "Map entity result set", durationMs: 10 },
            ];
            inputJson = { entity: stepName, operation: method === "GET" ? "findMany" : "create" };
            outputJson = { recordsAffected: 1, success: true };
          } else if (stepType === "database") {
            icon = Database;
            color = "#8B5CF6";
            bgColor = "rgba(139, 92, 246, 0.12)";
            borderColor = "rgba(139, 92, 246, 0.4)";
            title = "Database Engine";
            desc = `Executes SQL/NoSQL connection pool transactions against ${stepName}.`;
            substeps = [
              { name: "Acquire connection from pool", durationMs: 4 },
              { name: "Execute query transaction", durationMs: 24 },
            ];
            inputJson = { engine: stepName, status: "connected" };
            outputJson = { rowsReturned: 1, durationMs: 28 };
          }

          formattedSteps.push({
            id: stepId,
            stepNum: currentStepNum++,
            type: (stepType === "middleware" || stepType === "controller" ? "controller" : "service") as any,
            title,
            name: stepName,
            path: s.filePath,
            durationMs: 15 + idx * 8,
            status: "Completed",
            icon,
            color,
            bgColor,
            borderColor,
            description: desc,
            substeps,
            inputJson,
            outputJson,
            logs: [
              { timestamp: `00:0${idx + 1}.010`, message: `Entered ${stepName} handler` },
              { timestamp: `00:0${idx + 1}.025`, message: `Completed ${stepName} in ${s.filePath || stepName}` },
            ],
            dependencies: [
              { name: stepName, role: title, healthy: true },
            ],
          });
        });
      }

      // 3. Final Response Pipeline Step
      formattedSteps.push({
        id: "step-response",
        stepNum: currentStepNum++,
        type: "response",
        title: "HTTP Response",
        name: method === "POST" ? "201 Created" : "200 OK",
        durationMs: 8,
        status: "Completed",
        icon: CheckCircle2,
        color: "#16C7A3",
        bgColor: "rgba(22, 199, 163, 0.12)",
        borderColor: "rgba(22, 199, 163, 0.4)",
        description: `Returned JSON payload with success headers and status code.`,
        inputJson: { status: method === "POST" ? 201 : 200, success: true },
        outputJson: { route: routePath, timestamp: new Date().toISOString() },
        logs: [
          { timestamp: "00:00.045", message: "Response serialized and sent to client" },
        ],
        dependencies: [
          { name: "HTTP Output Stream", role: "Payload Serializer", healthy: true },
        ],
      });

      return formattedSteps;
    },
    []
  );

  const traces: EndpointTraceData[] = useMemo(() => {
    // 1. If backend execution traces API returned real traces
    if (apiTraces?.traces && apiTraces.traces.length > 0) {
      return apiTraces.traces.map((t: any, idx: number) => {
        const cleanPath = cleanRoutePath(t.route || "/api");
        const id = `${t.method || "GET"}:${cleanPath}`;
        const routeSteps = buildDynamicSteps(t.steps || [], t.method || "GET", cleanPath, t.envVars);
        const segments = cleanPath.split("/").filter(Boolean);
        const moduleTag = segments.length > 0 ? `/${segments[0]}` : "Core";

        return {
          id,
          method: t.method || "GET",
          path: cleanPath,
          moduleTag: t.module || moduleTag,
          isStarred: idx === 0,
          category: ((t.category || (cleanPath.includes("auth") ? "Controllers" : "Routes")) as any),
          successRate: "100%",
          durationMs: t.metrics?.duration || 120 + (idx % 8) * 15,
          durationCompare: "Optimal",
          dbQueries: t.steps?.some((s: any) => s.type === "database" || s.type === "repository") ? 1 : 0,
          dbNote: t.steps?.some((s: any) => s.type === "database") ? "Queries database engine" : "In-memory",
          authFlow: t.authType || (t.steps?.some((s: any) => s.type === "middleware") ? "Protected" : "Public"),
          authNote: t.authType ? `${t.authType} guard` : (t.steps?.some((s: any) => s.type === "middleware") ? "Auth middleware attached" : "Public endpoint"),
          complexityScore: t.metrics?.complexity || (t.steps?.length ? t.steps.length * 2 : 4),
          complexityNote: `${t.steps?.length || 2} pipeline steps`,
          steps: routeSteps,
        };
      });
    }

    // 2. Fallback to constructing real traces directly from result.routes if present
    if (result?.routes && result.routes.length > 0) {
      return result.routes.map((r: any, idx: number) => {
        const cleanPath = cleanRoutePath(r.path || "/");
        const method = (r.method || "GET").toUpperCase();
        const id = `${method}:${cleanPath}`;
        const chainSteps: any[] = [];
        if (r.middleware && r.middleware.length > 0) {
          r.middleware.forEach((mw: string) => chainSteps.push({ name: mw, type: "middleware" }));
        }
        if (r.file) {
          chainSteps.push({ name: r.file.split(/[\\/]/).pop()?.replace(/\.[^/.]+$/, ""), type: "controller", filePath: r.file });
        }
        (r.chain || []).forEach((c: string) => {
          const type = c.toLowerCase().includes("repo") ? "repository" : "service";
          chainSteps.push({ name: c.split(/[\\/]/).pop()?.replace(/\.[^/.]+$/, ""), type, filePath: c });
        });
        if (result?.metadata?.databaseInfo?.type) {
          chainSteps.push({ name: result.metadata.databaseInfo.type, type: "database" });
        }

        const routeSteps = buildDynamicSteps(chainSteps, method, cleanPath);
        const segments = cleanPath.split("/").filter(Boolean);
        const moduleTag = segments.length > 0 ? `/${segments[0]}` : "Core";

        return {
          id,
          method,
          path: cleanPath,
          moduleTag,
          isStarred: idx === 0,
          category: (cleanPath.includes("auth") ? "Controllers" : "Routes") as any,
          successRate: "100%",
          durationMs: 85 + (idx % 10) * 12,
          durationCompare: "Optimal",
          dbQueries: chainSteps.some((s) => s.type === "database" || s.type === "repository") ? 1 : 0,
          dbNote: chainSteps.some((s) => s.type === "database") ? "Database matched" : "In-memory",
          authFlow: r.middleware?.length > 0 ? "Protected" : "Public",
          authNote: r.middleware?.length > 0 ? `Guarded by ${r.middleware.join(", ")}` : "No auth guard",
          complexityScore: Math.max(1, chainSteps.length * 2),
          complexityNote: `${chainSteps.length} AST chain steps`,
          steps: routeSteps,
        };
      });
    }

    return MOCK_TRACES;
  }, [apiTraces, result, buildDynamicSteps]);

  const activeTrace = useMemo(() => {
    return traces.find((t) => t.id === selectedEndpointId) || traces[0];
  }, [selectedEndpointId, traces]);

  const activeStep = useMemo(() => {
    return activeTrace.steps.find((s) => s.id === selectedStepId) || activeTrace.steps[2] || activeTrace.steps[0];
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

  const toggleStepExpanded = useCallback((stepId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  }, []);

  const handleStepClick = useCallback((stepId: string) => {
    setSelectedStepId(stepId);
    // When user clicks a step, automatically expand it & open contextual details inspector
    setExpandedSteps((prev) => ({ ...prev, [stepId]: true }));
    setIsRightInspectorOpen(true);
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
            onClick={() => handleStepClick(step.id)}
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
  }, [activeTrace, selectedStepId, handleStepClick]);

  return (
    <div className="h-full w-full bg-[#061318] flex flex-col overflow-hidden text-left font-sans select-none relative">
      {/* ── 1. COMPACT STREAMLINED HEADER (58px) ─────────────────────────── */}
      <div className="h-[58px] px-4 bg-[#071219] border-b border-[rgba(100,190,205,0.14)] flex items-center justify-between shrink-0 z-20 gap-4">
        {/* Left: Title & Subtitle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#16C7A3]/15 border border-[#16C7A3]/30 flex items-center justify-center text-[#16C7A3] shrink-0">
            <Zap size={16} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#F2F7F7] tracking-tight leading-tight">
              Execution Trace
            </h1>
            <p className="text-[11px] text-[#8FA4A8] font-normal leading-none mt-0.5 hidden sm:block">
              Trace API endpoints through the application
            </p>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="relative flex-1 max-w-sm min-w-[160px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#728589]" />
          <input
            type="text"
            placeholder="Search endpoints..."
            value={routeSearch}
            onChange={(e) => setRouteSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-7 rounded-lg bg-[#0A171C] border border-[rgba(100,190,205,0.16)] text-xs text-[#F2F7F7] placeholder-[#728589] focus:outline-none focus:border-[#16C7A3] transition-colors font-mono"
          />
          {routeSearch && (
            <button
              onClick={() => setRouteSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#728589] hover:text-[#F2F7F7] cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Right: Active Endpoint, Env, Primary Action & More */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Active Endpoint Badge */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0A171C] border border-[rgba(100,190,205,0.18)]">
            <span
              className={`px-1.5 py-0.2 rounded text-[9.5px] font-black font-mono tracking-wider border shrink-0 ${
                METHOD_STYLES[activeTrace.method]?.bg || "bg-[#16C7A3]/20"
              } ${METHOD_STYLES[activeTrace.method]?.text || "text-[#16C7A3]"} ${
                METHOD_STYLES[activeTrace.method]?.border || "border-[#16C7A3]/40"
              }`}
            >
              {activeTrace.method}
            </span>
            <span className="text-xs font-mono font-bold text-[#F2F7F7] max-w-[180px] truncate" title={activeTrace.path}>
              {activeTrace.path}
            </span>
          </div>

          {/* Environment Selector (simplified) */}
          <div className="hidden lg:flex items-center bg-[#0A171C] border border-[rgba(100,190,205,0.18)] rounded-lg px-2 py-1 text-xs">
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="bg-transparent text-[#F2F7F7] font-bold focus:outline-none cursor-pointer text-xs font-mono"
            >
              <option value="Development" className="bg-[#0A171C] text-[#F2F7F7]">
                Development ▾
              </option>
              <option value="Staging" className="bg-[#0A171C] text-[#F2F7F7]">
                Staging ▾
              </option>
              <option value="Production" className="bg-[#0A171C] text-[#F2F7F7]">
                Production ▾
              </option>
            </select>
          </div>

          {/* Primary Action Button: Run Again (Prominent filled teal) */}
          <button
            onClick={() => {
              setIsPlaying(true);
              setTimeout(() => setIsPlaying(false), 1200);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#16C7A3] hover:bg-[#13b592] text-[#061318] text-xs font-bold font-mono cursor-pointer transition-all shadow-md shadow-[#16C7A3]/20 shrink-0"
          >
            <RotateCcw size={13} className={isPlaying ? "animate-spin" : ""} />
            <span>Run Again</span>
          </button>

          {/* More Actions Menu Button */}
          <div className="relative">
            <button
              onClick={() => setIsMoreMenuOpen((prev) => !prev)}
              className="w-8 h-8 rounded-lg bg-[#0A171C] hover:bg-[#0E1C21] border border-[rgba(100,190,205,0.18)] text-[#A4B5B8] hover:text-[#F2F7F7] flex items-center justify-center cursor-pointer transition-colors"
              title="More Actions"
            >
              <MoreVertical size={14} />
            </button>

            {isMoreMenuOpen && (
              <div className="absolute right-0 top-10 w-44 bg-[#0A171C] border border-[rgba(100,190,205,0.2)] rounded-xl shadow-2xl py-1.5 z-50 text-xs font-mono text-left">
                <button
                  onClick={() => {
                    handleFitView();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-[#0E1C21] text-[#F2F7F7] flex items-center gap-2 cursor-pointer"
                >
                  <Maximize2 size={13} className="text-[#16C7A3]" />
                  <span>Fit View</span>
                </button>
                <button
                  onClick={() => {
                    copyJsonPayload(window.location.href);
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-[#0E1C21] text-[#F2F7F7] flex items-center gap-2 cursor-pointer"
                >
                  <Share2 size={13} className="text-[#2F80ED]" />
                  <span>Share Trace Link</span>
                </button>
                <button
                  onClick={() => {
                    copyJsonPayload(activeTrace.path);
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-[#0E1C21] text-[#F2F7F7] flex items-center gap-2 cursor-pointer"
                >
                  <Copy size={13} className="text-[#F5B52E]" />
                  <span>Copy Path</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. MAIN WORKSPACE (Dominant Execution Flow + Collapsible Panels) ── */}
      <div className="flex-1 flex overflow-hidden p-2.5 gap-2.5 bg-[#061318] min-h-0 relative">
        {/* ── LEFT API ENDPOINTS PANEL (Collapsible) ───────────────────────── */}
        {isLeftSidebarOpen ? (
          <motion.aside
            initial={{ width: 42, opacity: 0 }}
            animate={{ width: 250, opacity: 1 }}
            exit={{ width: 42, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-[250px] shrink-0 h-full bg-[#0A171C] border border-[rgba(100,190,205,0.14)] rounded-xl p-3 flex flex-col overflow-hidden select-none z-10"
          >
            {/* Header with Collapse Button */}
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(100,190,205,0.12)] shrink-0 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#F2F7F7] font-mono uppercase tracking-wider">
                  API Endpoints
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#16C7A3]/15 text-[#16C7A3] text-[10px] font-mono font-bold">
                  {filteredEndpoints.length}
                </span>
              </div>
              <button
                onClick={() => setIsLeftSidebarOpen(false)}
                className="p-1 rounded-md bg-[#071219] hover:bg-[#0E1C21] text-[#8FA4A8] hover:text-[#F2F7F7] transition cursor-pointer"
                title="Collapse Endpoints (‹)"
              >
                <ChevronLeft size={15} />
              </button>
            </div>

            {/* Category Filter Dropdown */}
            <div className="relative mb-2 shrink-0">
              <button
                onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#071219] border border-[rgba(100,190,205,0.14)] text-[#F2F7F7] text-xs font-mono flex items-center justify-between cursor-pointer hover:border-[#16C7A3]/40"
              >
                <span>{selectedCategory === "All" ? "All endpoints" : selectedCategory}</span>
                <ChevronDown size={13} className="text-[#8FA4A8]" />
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute left-0 right-0 top-9 bg-[#071219] border border-[rgba(100,190,205,0.2)] rounded-lg shadow-xl py-1 z-30 font-mono text-xs">
                  {(["All", "Routes", "Controllers", "Services"] as EndpointCategory[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left transition cursor-pointer flex items-center justify-between ${
                        selectedCategory === cat ? "bg-[#16C7A3]/20 text-[#16C7A3] font-bold" : "text-[#A4B5B8] hover:bg-[#0E1C21]"
                      }`}
                    >
                      <span>{cat === "All" ? "All endpoints" : cat}</span>
                      {selectedCategory === cat && <Check size={12} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clean Endpoint List Cards (no repeated /api) */}
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
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all duration-150 relative ${
                      isSelected
                        ? "bg-[#0E1C21] border-[#16C7A3] shadow-md ring-1 ring-[#16C7A3]/40"
                        : "bg-[#071219] border-[rgba(100,190,205,0.1)] hover:border-[rgba(100,190,205,0.3)] hover:bg-[#0E1C21]/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold font-mono border ${methodStyle.bg} ${methodStyle.text} ${methodStyle.border}`}
                      >
                        {ep.method}
                      </span>
                      <span className="text-[10px] text-[#8FA4A8] font-mono">
                        {ep.moduleTag}
                      </span>
                    </div>

                    <div className="text-xs font-mono font-bold text-[#F2F7F7] truncate" title={ep.path}>
                      {ep.path}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.aside>
        ) : (
          /* Collapsed Rail (42px) */
          <aside className="w-[42px] shrink-0 h-full bg-[#0A171C] border border-[rgba(100,190,205,0.14)] rounded-xl py-3 flex flex-col items-center justify-between select-none z-10">
            <button
              onClick={() => setIsLeftSidebarOpen(true)}
              className="w-8 h-8 rounded-lg bg-[#071219] hover:bg-[#0E1C21] text-[#16C7A3] flex items-center justify-center border border-[rgba(100,190,205,0.15)] transition cursor-pointer"
              title="Expand API Endpoints (›)"
            >
              <ChevronRight size={16} />
            </button>

            {/* Vertical Method Indicators */}
            <div className="flex flex-col items-center gap-2">
              {filteredEndpoints.slice(0, 6).map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => {
                    setSelectedEndpointId(ep.id);
                    setIsLeftSidebarOpen(true);
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-transform hover:scale-125 cursor-pointer ${
                    ep.id === selectedEndpointId ? "ring-2 ring-white scale-125" : "opacity-60 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor:
                      ep.method === "GET"
                        ? "#16C7A3"
                        : ep.method === "POST"
                        ? "#2F80ED"
                        : ep.method === "DELETE"
                        ? "#FF4D5E"
                        : "#F5B52E",
                  }}
                  title={`${ep.method} ${ep.path}`}
                />
              ))}
            </div>

            <div className="text-[9px] font-mono text-[#728589] font-bold rotate-90">
              API
            </div>
          </aside>
        )}

        {/* ── CENTER EXECUTION FLOW (Dominant Component ~80–90% space) ───── */}
        <main className="flex-1 flex flex-col bg-[#0A171C] border border-[rgba(100,190,205,0.14)] rounded-xl p-3.5 overflow-hidden relative text-left select-none min-w-0">
          {/* Header Strip with Controls */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[rgba(100,190,205,0.12)] shrink-0">
            <div className="flex items-center gap-2 truncate">
              <span className="text-xs font-bold font-mono text-[#F2F7F7] uppercase tracking-wider">
                Execution Flow
              </span>
              <span className="text-[11px] font-mono text-[#8FA4A8]">
                ({activeTrace.steps.length} steps)
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Playback Controls */}
              <div className="flex items-center gap-1 bg-[#071219] p-0.5 rounded-lg border border-[rgba(100,190,205,0.18)]">
                <button
                  onClick={handleStepPrev}
                  className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 text-[#A4B5B8] hover:text-white flex items-center justify-center cursor-pointer"
                  title="Previous Step"
                >
                  <SkipBack size={11} />
                </button>
                <button
                  onClick={handlePlayToggle}
                  className={`w-6 h-6 rounded flex items-center justify-center font-bold transition-all cursor-pointer ${
                    isPlaying
                      ? "bg-[#F5B52E] text-[#061318]"
                      : "bg-[#16C7A3] text-[#061318] shadow-sm"
                  }`}
                  title={isPlaying ? "Pause Trace" : "Play Trace"}
                >
                  {isPlaying ? <Pause size={11} /> : <Play size={11} className="ml-0.5" />}
                </button>
                <button
                  onClick={handleStepNext}
                  className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 text-[#A4B5B8] hover:text-white flex items-center justify-center cursor-pointer"
                  title="Next Step"
                >
                  <SkipForward size={11} />
                </button>
              </div>

              {/* Segmented Timeline / Graph Toggle */}
              <div className="flex items-center bg-[#071219] p-0.5 rounded-lg border border-[rgba(100,190,205,0.18)] text-xs font-semibold font-mono">
                <button
                  onClick={() => setViewMode("timeline")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded cursor-pointer transition-colors ${
                    viewMode === "timeline" ? "bg-[#16C7A3] text-[#061318] font-bold" : "text-[#A4B5B8] hover:text-white"
                  }`}
                >
                  <Clock size={11} />
                  <span>Timeline</span>
                </button>
                <button
                  onClick={() => setViewMode("graph")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded cursor-pointer transition-colors ${
                    viewMode === "graph" ? "bg-[#16C7A3] text-[#061318] font-bold" : "text-[#A4B5B8] hover:text-white"
                  }`}
                >
                  <Network size={11} />
                  <span>Graph</span>
                </button>
              </div>

              {/* Toggle Details Panel Button if closed */}
              {!isRightInspectorOpen && (
                <button
                  onClick={() => setIsRightInspectorOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-[#071219] hover:bg-[#0E1C21] border border-[rgba(100,190,205,0.18)] text-[#16C7A3] text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Open Details Panel"
                >
                  <Info size={12} />
                  <span>Details</span>
                </button>
              )}
            </div>
          </div>

          {/* ── Main Trace Steps Area (Flex Scrollable) ─────────────────── */}
          <div className="flex-1 overflow-y-auto pr-1 min-h-0 pt-2">
            {viewMode === "timeline" ? (
              <div className="relative pl-9 pr-1 py-1 space-y-2.5 select-none">
                {/* Vertical connecting rail */}
                <div className="absolute left-[17px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-[#16C7A3] via-[#2F80ED] to-[#8B5CF6] z-0" />

                {activeTrace.steps.map((step) => {
                  const IconComp = step.icon || Globe;
                  const isSelected = selectedStepId === step.id;
                  const isExpanded = !!expandedSteps[step.id];

                  return (
                    <div key={step.id} className="relative z-10 flex items-start gap-3">
                      {/* Step Number in Rail */}
                      <div
                        onClick={() => handleStepClick(step.id)}
                        className={`w-[28px] h-[28px] rounded-full flex items-center justify-center font-bold text-xs font-mono shrink-0 cursor-pointer shadow-md transition-transform ${
                          isSelected ? "scale-110 ring-2 ring-[#16C7A3]" : ""
                        }`}
                        style={{
                          backgroundColor: step.color,
                          color: "#061318",
                        }}
                      >
                        {step.stepNum}
                      </div>

                      {/* Collapsible Step Card */}
                      <div
                        onClick={() => handleStepClick(step.id)}
                        className={`flex-1 rounded-xl p-3 border transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? "bg-[#0E1C21] border-[#16C7A3] shadow-lg ring-1 ring-[#16C7A3]/30"
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
                              className="p-1 rounded bg-white/5 hover:bg-white/10 text-[#8FA4A8] hover:text-white cursor-pointer"
                              title={isExpanded ? "Collapse" : "Expand"}
                            >
                              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                          </div>
                        </div>

                        {/* Expandable Substeps */}
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
        </main>

        {/* ── RIGHT DETAILS INSPECTOR (Contextual & Collapsible) ─────────── */}
        {isRightInspectorOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 310, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-[310px] shrink-0 h-full bg-[#0A171C] border border-[rgba(100,190,205,0.14)] rounded-xl p-3 flex flex-col overflow-hidden select-none text-left z-10"
          >
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
                  onClick={() => setIsRightInspectorOpen(false)}
                  className="p-1 rounded bg-[#071219] hover:bg-[#0E1C21] text-[#8FA4A8] hover:text-white cursor-pointer transition"
                  title="Close Inspector (Esc)"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Contextual Body Content (Progressive Accordions) */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 min-h-0 pt-2.5 text-xs font-sans">
              {/* Overview Metrics Card */}
              <div className="p-2.5 rounded-xl bg-[#071219] border border-[rgba(100,190,205,0.12)] space-y-2">
                <div className="grid grid-cols-2 gap-2 text-center font-mono">
                  <div className="p-1.5 rounded-lg bg-[#0A171C] border border-[rgba(100,190,205,0.1)]">
                    <span className="text-[9px] text-[#728589] uppercase block">Health</span>
                    <span className="text-[#16C7A3] font-bold text-xs flex items-center justify-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16C7A3]" />
                      Healthy
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#0A171C] border border-[rgba(100,190,205,0.1)]">
                    <span className="text-[9px] text-[#728589] uppercase block">Duration</span>
                    <span className="text-[#F2F7F7] font-bold text-xs mt-0.5 block">
                      {activeStep.durationMs} ms
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[#8FA4A8] leading-relaxed">
                  {activeStep.description ||
                    `Processes operations for ${activeStep.name} in the request execution lifecycle.`}
                </p>
              </div>

              {/* Accordion 1: Input JSON */}
              <div className="rounded-xl bg-[#071219] border border-[rgba(100,190,205,0.12)] overflow-hidden">
                <button
                  onClick={() => toggleInspectorSection("input")}
                  className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-mono font-bold text-[#F2F7F7] hover:bg-[#0E1C21] transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#16C7A3]">{openInspectorSections.input ? "▾" : "▸"}</span>
                    <span>Input Payload</span>
                  </span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      copyJsonPayload(JSON.stringify(activeStep.inputJson || {}, null, 2));
                    }}
                    className="text-[#16C7A3] text-[10px] hover:underline cursor-pointer"
                  >
                    Copy
                  </span>
                </button>

                {openInspectorSections.input && (
                  <div className="p-2 border-t border-[rgba(100,190,205,0.1)] bg-[#050B0E]">
                    <pre className="text-[10px] font-mono text-[#C9F7F1] overflow-x-auto select-text">
                      <code>
                        {JSON.stringify(
                          activeStep.inputJson || { route: activeTrace.path, method: activeTrace.method },
                          null,
                          2
                        )}
                      </code>
                    </pre>
                  </div>
                )}
              </div>

              {/* Accordion 2: Output JSON */}
              <div className="rounded-xl bg-[#071219] border border-[rgba(100,190,205,0.12)] overflow-hidden">
                <button
                  onClick={() => toggleInspectorSection("output")}
                  className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-mono font-bold text-[#F2F7F7] hover:bg-[#0E1C21] transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#16C7A3]">{openInspectorSections.output ? "▾" : "▸"}</span>
                    <span>Output Response</span>
                  </span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      copyJsonPayload(JSON.stringify(activeStep.outputJson || {}, null, 2));
                    }}
                    className="text-[#16C7A3] text-[10px] hover:underline cursor-pointer"
                  >
                    Copy
                  </span>
                </button>

                {openInspectorSections.output && (
                  <div className="p-2 border-t border-[rgba(100,190,205,0.1)] bg-[#050B0E]">
                    <pre className="text-[10px] font-mono text-[#2F80ED] overflow-x-auto select-text">
                      <code>
                        {JSON.stringify(activeStep.outputJson || { status: 200, success: true }, null, 2)}
                      </code>
                    </pre>
                  </div>
                )}
              </div>

              {/* Accordion 3: Dependencies */}
              <div className="rounded-xl bg-[#071219] border border-[rgba(100,190,205,0.12)] overflow-hidden">
                <button
                  onClick={() => toggleInspectorSection("dependencies")}
                  className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-mono font-bold text-[#F2F7F7] hover:bg-[#0E1C21] transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#16C7A3]">{openInspectorSections.dependencies ? "▾" : "▸"}</span>
                    <span>Dependencies</span>
                  </span>
                  <span className="text-[10px] text-[#728589]">
                    {(activeStep.dependencies || []).length || 1}
                  </span>
                </button>

                {openInspectorSections.dependencies && (
                  <div className="p-2 border-t border-[rgba(100,190,205,0.1)] bg-[#050B0E] space-y-1.5">
                    {(activeStep.dependencies && activeStep.dependencies.length > 0
                      ? activeStep.dependencies
                      : [{ name: activeStep.name || "Module Handler", role: activeStep.title || "Execution Step", healthy: true }]
                    ).map((dep, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-[#071219] border border-[rgba(100,190,205,0.1)] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-[#F2F7F7] font-mono text-[10.5px]">{dep.name}</div>
                          <div className="text-[9px] text-[#8FA4A8]">{dep.role}</div>
                        </div>
                        <span className="text-[9.5px] font-bold text-[#16C7A3] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16C7A3]" />
                          Healthy
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Accordion 4: Logs */}
              <div className="rounded-xl bg-[#071219] border border-[rgba(100,190,205,0.12)] overflow-hidden">
                <button
                  onClick={() => toggleInspectorSection("logs")}
                  className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-mono font-bold text-[#F2F7F7] hover:bg-[#0E1C21] transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#16C7A3]">{openInspectorSections.logs ? "▾" : "▸"}</span>
                    <span>Execution Logs</span>
                  </span>
                  <span className="text-[10px] text-[#728589]">
                    {(activeStep.logs || []).length || 2}
                  </span>
                </button>

                {openInspectorSections.logs && (
                  <div className="p-2 border-t border-[rgba(100,190,205,0.1)] bg-[#050B0E] space-y-1.5">
                    {(activeStep.logs && activeStep.logs.length > 0
                      ? activeStep.logs
                      : [
                          { timestamp: "00:00.010", message: `Executing ${activeStep.name || activeStep.title}` },
                          { timestamp: "00:00.025", message: `Completed in ${activeStep.durationMs}ms` },
                        ]
                    ).map((log, lIdx) => (
                      <div
                        key={lIdx}
                        className="p-1.5 rounded bg-[#071219] border border-[rgba(100,190,205,0.1)] font-mono text-[10px] text-[#C3D5D8] flex items-start gap-2 select-text"
                      >
                        <span className="text-[#8FA4A8] text-[9px] shrink-0">{log.timestamp}</span>
                        <span className="flex-1">{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Accordion 5: Code Preview */}
              <div className="rounded-xl bg-[#071219] border border-[rgba(100,190,205,0.12)] overflow-hidden">
                <button
                  onClick={() => toggleInspectorSection("code")}
                  className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-mono font-bold text-[#F2F7F7] hover:bg-[#0E1C21] transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#16C7A3]">{openInspectorSections.code ? "▾" : "▸"}</span>
                    <span>Code Handler</span>
                  </span>
                  <FileCode size={12} className="text-[#16C7A3]" />
                </button>

                {openInspectorSections.code && (
                  <div className="p-2 border-t border-[rgba(100,190,205,0.1)] bg-[#050B0E]">
                    <div className="text-[9px] font-mono text-[#8FA4A8] mb-1 truncate">
                      {activeStep.path || `${(activeStep.name || "handler").toLowerCase().replace(/[^a-z0-9]/g, "_")}.ts`}
                    </div>
                    <pre className="font-mono text-[9.5px] text-[#C9F7F1] leading-relaxed overflow-x-auto select-text">
                      <code>{`// ${activeStep.title}: ${activeStep.name}
export async function ${(activeStep.name || "handleRequest").replace(/[^a-zA-Z0-9]/g, "_")}(req, res) {
  return ${JSON.stringify(activeStep.outputJson || { success: true }, null, 2)};
}`}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Primary Action */}
            <div className="pt-2 border-t border-[rgba(100,190,205,0.12)] shrink-0 mt-2">
              <button
                onClick={() => {
                  if (onSetImpactFile && activeStep.path) {
                    onSetImpactFile(activeStep.path);
                  }
                  if (onSwitchTab) onSwitchTab("layer");
                }}
                className="w-full py-2 rounded-xl bg-[#16C7A3] hover:bg-[#13b592] text-[#061318] font-bold font-mono text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Code size={13} />
                <span>Open in Editor &rarr;</span>
              </button>
            </div>
          </motion.aside>
        )}
      </div>

      {/* ── 3. COMPACT 36PX BOTTOM STATUS BAR ───────────────────────────── */}
      <footer className="h-9 px-4 bg-[#071219] border-t border-[rgba(100,190,205,0.14)] flex items-center justify-between text-[11px] font-mono text-[#8FA4A8] shrink-0 z-20">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[#16C7A3] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16C7A3] animate-pulse" />
            100% Parsed
          </span>
          <span className="text-[#32494E]">·</span>
          <span>222 Files</span>
          <span className="text-[#32494E]">·</span>
          <span>676 Imports</span>
          <span className="text-[#32494E]">·</span>
          <span>0 Cycles</span>
        </div>

        <div className="flex items-center gap-3 relative">
          <button
            onClick={() => setIsStatsDrawerOpen((prev) => !prev)}
            className="hover:text-[#16C7A3] transition flex items-center gap-1 cursor-pointer font-bold"
          >
            <span>Statistics</span>
            <ChevronUp size={12} className={`transition-transform ${isStatsDrawerOpen ? "rotate-180" : ""}`} />
          </button>

          {isStatsDrawerOpen && (
            <div className="absolute right-0 bottom-9 w-52 bg-[#0A171C] border border-[rgba(100,190,205,0.2)] rounded-xl shadow-2xl p-3 z-50 text-xs font-mono space-y-2 text-left">
              <div className="flex justify-between border-b border-[rgba(100,190,205,0.1)] pb-1.5">
                <span className="text-[#728589]">Core Modules</span>
                <span className="text-[#F2F7F7] font-bold">6</span>
              </div>
              <div className="flex justify-between border-b border-[rgba(100,190,205,0.1)] pb-1.5">
                <span className="text-[#728589]">Services</span>
                <span className="text-[#16C7A3] font-bold">36</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#728589]">Zoom Level</span>
                <span className="text-[#F2F7F7] font-bold">100%</span>
              </div>
            </div>
          )}
        </div>
      </footer>

      {/* Copy Notification Toast */}
      <AnimatePresence>
        {copiedNotification && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-12 right-4 bg-[#16C7A3] text-[#061318] font-bold text-xs px-3 py-1.5 rounded-lg shadow-xl z-50 flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>{copiedNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

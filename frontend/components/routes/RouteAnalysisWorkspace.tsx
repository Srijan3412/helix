"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Copy,
  Check,
  Star,
  Play,
  Layers,
  Zap,
  Clock,
  Database,
  BarChart3,
  Shield,
  Lock,
  Globe,
  FileCode,
  SlidersHorizontal,
  Folder,
  Code2,
  CheckCircle2,
  ArrowRight,
  Server,
  Settings,
  Bell,
  User,
  Key,
  Home,
  FileText,
  Network,
  GitBranch,
  Pencil,
  Box,
  Link2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface RouteItem {
  id: string;
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  module: string;
  description: string;
  detailedDescription?: string;
  isPublic: boolean;
  version: string;
  tag: string;
  file: string;
  lines: string;
  controller: string;
  service: string;
  metrics: {
    successRate: string;
    avgResponseTime: string;
    dbActivity: string;
    usage: string;
  };
  dependencies: { name: string; version: string; type: "package" | "internal" }[];
  request: {
    contentType: string;
    body: Record<string, any>;
    headers: { key: string; value: string }[];
    queryParams: { key: string; value: string }[];
  };
  response: {
    statusCode: number;
    statusText: string;
    body: Record<string, any>;
    headers: { key: string; value: string }[];
  };
  relatedRoutes?: string[];
}

const DEFAULT_ROUTES: RouteItem[] = [
  // ── Analysis.queue (Matches Image 2 primary selection) ──
  {
    id: "analysis-queue-key",
    path: "/key",
    method: "GET",
    module: "Analysis.queue",
    description: "GET handler for /key",
    detailedDescription:
      "Handles HTTP GET requests for /key. Execution call graph: bullmq.",
    isPublic: true,
    version: "v1",
    tag: "@analysis.queue",
    file: "backend/src/jobs/analysis.queue.ts",
    lines: "1 - 35",
    controller: "Analysis.queueController",
    service: "Analysis.queueService",
    metrics: {
      successRate: "100%",
      avgResponseTime: "405 ms",
      dbActivity: "AST Flow",
      usage: "380",
    },
    dependencies: [
      { name: "bullmq", version: "^1.0.0", type: "package" },
      { name: "ioredis", version: "^5.3.2", type: "package" },
    ],
    request: {
      contentType: "application/json",
      body: {},
      headers: [
        { key: "Content-Type", value: "application/json" },
        { key: "Accept", value: "application/json" },
      ],
      queryParams: [],
    },
    response: {
      statusCode: 200,
      statusText: "OK",
      body: {
        success: true,
        path: "/key",
        timestamp: "2026-09-18T20:46:08.549Z",
      },
      headers: [
        { key: "Content-Type", value: "application/json" },
        { key: "Cache-Control", value: "no-cache" },
      ],
    },
    relatedRoutes: ["/api/auth/signup", "/api/auth/verify-otp"],
  },
  // ── Analysis.worker ──
  {
    id: "worker-job-status",
    path: "/`job:${jobId}:status`",
    method: "GET",
    module: "Analysis.worker",
    description: "GET handler for /`job:${jobId}:status`",
    detailedDescription: "Polls current execution status for asynchronous analysis jobs.",
    isPublic: true,
    version: "v1",
    tag: "@analysis.worker",
    file: "backend/src/jobs/analysis.worker.ts",
    lines: "10 - 45",
    controller: "Analysis.workerController",
    service: "Analysis.workerService",
    metrics: {
      successRate: "99.8%",
      avgResponseTime: "120 ms",
      dbActivity: "AST Flow",
      usage: "1.4K",
    },
    dependencies: [{ name: "bullmq", version: "^1.0.0", type: "package" }],
    request: {
      contentType: "application/json",
      body: {},
      headers: [{ key: "Content-Type", value: "application/json" }],
      queryParams: [],
    },
    response: {
      statusCode: 200,
      statusText: "OK",
      body: { status: "completed", progress: 100 },
      headers: [{ key: "Content-Type", value: "application/json" }],
    },
  },
  {
    id: "worker-job-result",
    path: "/`job:${jobId}:result`",
    method: "GET",
    module: "Analysis.worker",
    description: "GET handler for /`job:${jobId}:result`",
    detailedDescription: "Retrieves finished static and dynamic code architecture payloads.",
    isPublic: true,
    version: "v1",
    tag: "@analysis.worker",
    file: "backend/src/jobs/analysis.worker.ts",
    lines: "50 - 90",
    controller: "Analysis.workerController",
    service: "Analysis.workerService",
    metrics: {
      successRate: "100%",
      avgResponseTime: "310 ms",
      dbActivity: "AST Flow",
      usage: "950",
    },
    dependencies: [{ name: "bullmq", version: "^1.0.0", type: "package" }],
    request: {
      contentType: "application/json",
      body: {},
      headers: [{ key: "Content-Type", value: "application/json" }],
      queryParams: [],
    },
    response: {
      statusCode: 200,
      statusText: "OK",
      body: { success: true, filesAnalyzed: 142 },
      headers: [{ key: "Content-Type", value: "application/json" }],
    },
  },
  {
    id: "worker-job-graph",
    path: "/`job:${jobId}:graph`",
    method: "GET",
    module: "Analysis.worker",
    description: "GET handler for /`job:${jobId}:graph`",
    detailedDescription: "Returns complete dependency and execution graph structures.",
    isPublic: true,
    version: "v1",
    tag: "@analysis.worker",
    file: "backend/src/jobs/analysis.worker.ts",
    lines: "95 - 130",
    controller: "Analysis.workerController",
    service: "Analysis.workerService",
    metrics: {
      successRate: "100%",
      avgResponseTime: "280 ms",
      dbActivity: "AST Flow",
      usage: "620",
    },
    dependencies: [{ name: "bullmq", version: "^1.0.0", type: "package" }],
    request: {
      contentType: "application/json",
      body: {},
      headers: [{ key: "Content-Type", value: "application/json" }],
      queryParams: [],
    },
    response: {
      statusCode: 200,
      statusText: "OK",
      body: { nodes: 64, edges: 112 },
      headers: [{ key: "Content-Type", value: "application/json" }],
    },
  },
  {
    id: "worker-job-repopath",
    path: "/`job:${jobId}:repoPath`",
    method: "GET",
    module: "Analysis.worker",
    description: "GET handler for /`job:${jobId}:repoPath`",
    detailedDescription: "Resolves workspace paths for clone and local processing targets.",
    isPublic: true,
    version: "v1",
    tag: "@analysis.worker",
    file: "backend/src/jobs/analysis.worker.ts",
    lines: "135 - 160",
    controller: "Analysis.workerController",
    service: "Analysis.workerService",
    metrics: {
      successRate: "100%",
      avgResponseTime: "95 ms",
      dbActivity: "AST Flow",
      usage: "480",
    },
    dependencies: [{ name: "bullmq", version: "^1.0.0", type: "package" }],
    request: {
      contentType: "application/json",
      body: {},
      headers: [{ key: "Content-Type", value: "application/json" }],
      queryParams: [],
    },
    response: {
      statusCode: 200,
      statusText: "OK",
      body: { path: "helix-main/src" },
      headers: [{ key: "Content-Type", value: "application/json" }],
    },
  },
  {
    id: "worker-job-metadata",
    path: "/`job:${jobId}:metadata`",
    method: "GET",
    module: "Analysis.worker",
    description: "GET handler for /`job:${jobId}:metadata`",
    detailedDescription: "Queries language, package, and AST meta statistics.",
    isPublic: true,
    version: "v1",
    tag: "@analysis.worker",
    file: "backend/src/jobs/analysis.worker.ts",
    lines: "165 - 200",
    controller: "Analysis.workerController",
    service: "Analysis.workerService",
    metrics: {
      successRate: "100%",
      avgResponseTime: "110 ms",
      dbActivity: "AST Flow",
      usage: "890",
    },
    dependencies: [{ name: "bullmq", version: "^1.0.0", type: "package" }],
    request: {
      contentType: "application/json",
      body: {},
      headers: [{ key: "Content-Type", value: "application/json" }],
      queryParams: [],
    },
    response: {
      statusCode: 200,
      statusText: "OK",
      body: { language: "typescript", framework: "Next.js" },
      headers: [{ key: "Content-Type", value: "application/json" }],
    },
  },
  // ── Authentication ──
  {
    id: "auth-signin",
    path: "/api/auth/signin",
    method: "POST",
    module: "Authentication",
    description: "Handle login for existing users",
    detailedDescription:
      "Authenticates an existing user with email and password. Returns a JWT token and user details on successful login.",
    isPublic: true,
    version: "v1",
    tag: "@auth",
    file: "backend/src/routes/auth.routes.ts",
    lines: "12 - 28",
    controller: "AuthController.signin",
    service: "AuthService",
    metrics: {
      successRate: "100%",
      avgResponseTime: "248 ms",
      dbActivity: "No queries",
      usage: "1.2K",
    },
    dependencies: [
      { name: "bcrypt", version: "^5.1.0", type: "package" },
      { name: "jsonwebtoken", version: "^9.0.0", type: "package" },
      { name: "UserService", version: "Internal", type: "internal" },
    ],
    request: {
      contentType: "application/json",
      body: { email: "user@example.com", password: "••••••••" },
      headers: [{ key: "Content-Type", value: "application/json" }],
      queryParams: [],
    },
    response: {
      statusCode: 200,
      statusText: "OK",
      body: { success: true, token: "eyJhbGciOi..." },
      headers: [{ key: "Content-Type", value: "application/json" }],
    },
  },
];

const MODULE_ICONS: Record<string, any> = {
  "Analysis.queue": Folder,
  "Analysis.worker": Folder,
  Authentication: Key,
  "User Management": User,
  Admin: Shield,
  Analytics: BarChart3,
  Notifications: Bell,
  "Core System": Server,
};

interface RouteAnalysisWorkspaceProps {
  result?: any;
  onSwitchTab?: (tab: string) => void;
  onSelectTraceRouteId?: (routeId: string) => void;
  initialSelectedRouteId?: string;
}

export default function RouteAnalysisWorkspace({
  result,
  onSwitchTab,
  onSelectTraceRouteId,
  initialSelectedRouteId,
}: RouteAnalysisWorkspaceProps) {
  // Global & Local Search State
  const [globalSearch, setGlobalSearch] = useState("");
  const [browserSearch, setBrowserSearch] = useState("");
  const [activeMethodFilter, setActiveMethodFilter] = useState<string | null>(null);

  // Selected Route State
  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    initialSelectedRouteId || "analysis-queue-key"
  );
  const [starredRoutes, setStarredRoutes] = useState<Set<string>>(new Set());
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    "overview" | "request" | "response" | "dependencies" | "traces" | "tests"
  >("overview");

  // Accordion Toggles
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({
    "Analysis.queue": true,
    "Analysis.worker": true,
    Authentication: true,
    "User Management": true,
    Admin: true,
    Analytics: true,
    Notifications: true,
    "Core System": true,
  });
  const [isRequestOpen, setIsRequestOpen] = useState(true);
  const [isResponseOpen, setIsResponseOpen] = useState(true);
  const [isDependenciesOpen, setIsDependenciesOpen] = useState(true);

  // Subtabs within Request & Response
  const [requestSubTab, setRequestSubTab] = useState<"body" | "headers" | "params">("body");
  const [responseSubTab, setResponseSubTab] = useState<"body" | "headers" | "schema">("body");

  // Interactive Run simulator
  const [isRunning, setIsRunning] = useState(false);
  const [runCompleted, setRunCompleted] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleStar = (id: string) => {
    setStarredRoutes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleModule = (module: string) => {
    setOpenModules((prev) => ({ ...prev, [module]: !prev[module] }));
  };

  // Convert and generate rich route items from scan results
  const allRoutes: RouteItem[] = useMemo(() => {
    const depsMap: Record<string, string> = {
      ...(result?.metadata?.frameworkMetadata?.dependencies || {}),
      ...(result?.metadata?.frameworkMetadata?.devDependencies || {}),
    };
    const dbType = result?.metadata?.databaseInfo?.type || "Database";
    const dbFlows = result?.metadata?.databaseInfo?.flows || [];

    if (!result?.routes || !Array.isArray(result.routes) || result.routes.length === 0) {
      return DEFAULT_ROUTES;
    }

    const items: RouteItem[] = [];
    const seenIds = new Set<string>();

    result.routes.forEach((r: any, idx: number) => {
      let rawPath = String(r?.path || r?.route || "").trim();
      if (rawPath.startsWith("ROUTE:")) {
        const parts = rawPath.split(":");
        rawPath = parts.slice(2).join(":") || parts[1] || rawPath;
      }
      if (!rawPath.startsWith("/")) rawPath = "/" + rawPath;

      const rawMethod = String(r?.method || "GET").toUpperCase();
      const method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" =
        ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(rawMethod) ? (rawMethod as any) : "GET";

      const routeId = `route-${idx}-${method.toLowerCase()}-${rawPath.replace(/[^a-zA-Z0-9]/g, "-")}`;
      if (seenIds.has(routeId)) return;
      seenIds.add(routeId);

      // Derive Module Name
      let moduleName = "Core System";
      const pathSegs = rawPath.split("/").filter(Boolean);
      const fileBase = r?.file ? String(r.file).split(/[\\/]/).pop()?.replace(/\.(routes|router|controller|service|ts|js|py)$/i, "") : "";

      if (rawPath.includes("/auth") || rawPath.includes("/login") || rawPath.includes("/token")) {
        moduleName = "Authentication";
      } else if (rawPath.includes("/user") || rawPath.includes("/member") || rawPath.includes("/profile") || rawPath.includes("/account")) {
        moduleName = "User Management";
      } else if (rawPath.includes("/admin") || rawPath.includes("/tenant") || rawPath.includes("/organization")) {
        moduleName = "Admin";
      } else if (rawPath.includes("/analysis") || rawPath.includes("/metric") || rawPath.includes("/scan") || rawPath.includes("/report") || rawPath === "/key") {
        moduleName = fileBase?.includes("queue") ? "Analysis.queue" : "Analysis.worker";
      } else if (rawPath.includes("/notification") || rawPath.includes("/webhook") || rawPath.includes("/email") || rawPath.includes("/alert")) {
        moduleName = "Notifications";
      } else if (rawPath.includes("/billing") || rawPath.includes("/payment") || rawPath.includes("/invoice") || rawPath.includes("/checkout")) {
        moduleName = "Billing & Payments";
      } else if (pathSegs.length > 1 && pathSegs[0] === "api") {
        moduleName = pathSegs[1].charAt(0).toUpperCase() + pathSegs[1].slice(1);
      } else if (fileBase && fileBase.length > 2) {
        moduleName = fileBase.charAt(0).toUpperCase() + fileBase.slice(1);
      }

      // Check if public or protected
      const hasAuthMiddleware = (r?.middleware || []).some((m: string) =>
        typeof m === "string" && /auth|jwt|guard|protect|verify|session|token/i.test(m)
      );
      const isPublic = !hasAuthMiddleware && !rawPath.includes("/admin") && !rawPath.includes("/private");

      // Controller & Service
      const controller = r?.handler || (r?.controller ? `${r.controller}.${method.toLowerCase()}` : `${moduleName.replace(/\s+/g, "")}Controller`);
      const service = (r?.chain || []).find((c: string) => typeof c === "string" && /service|manager|engine/i.test(c)) || `${moduleName.replace(/\s+/g, "")}Service`;

      // Associated dependencies
      const routeFileObj = (result?.files || []).find((f: any) => f?.path === r?.file || (r?.file && typeof f?.path === "string" && f.path.endsWith(r.file)));
      const fileExternalImports = routeFileObj?.externalImports || [];
      const fileInternalImports = routeFileObj?.internalImports || [];

      const dependencies: { name: string; version: string; type: "package" | "internal" }[] = [];
      fileExternalImports.slice(0, 4).forEach((pkg: string) => {
        dependencies.push({
          name: pkg,
          version: depsMap[pkg] || "^1.0.0",
          type: "package",
        });
      });
      if (fileInternalImports.length > 0) {
        dependencies.push({
          name: String(fileInternalImports[0]).split(/[\\/]/).pop()?.replace(/\.[^.]+$/, "") || "InternalService",
          version: "Internal",
          type: "internal",
        });
      }
      // Check database flow
      const matchedDbFlow = dbFlows.find((f: any) => f?.route === rawPath || rawPath.includes(f?.route || ""));
      if (matchedDbFlow && matchedDbFlow.entities?.length > 0) {
        dependencies.push({
          name: `${dbType} (${matchedDbFlow.entities.slice(0, 2).join(", ")})`,
          version: dbType,
          type: "internal",
        });
      }

      // Parameters
      const pathParams = (rawPath.match(/:([a-zA-Z0-9_]+)/g) || []).map((p: string) => p.replace(":", ""));
      const queryParams = (r?.params || pathParams).map((p: string) => ({ key: p, value: `sample_${p}` }));

      // Request Body
      let requestBody: Record<string, any> = {};
      if (method === "POST" || method === "PUT" || method === "PATCH") {
        if (rawPath.includes("auth") || rawPath.includes("login")) {
          requestBody = { email: "user@example.com", password: "••••••••" };
        } else if (rawPath.includes("scan") || rawPath.includes("analyze")) {
          requestBody = { repoUrl: "https://github.com/organization/repo", branch: "main" };
        } else if (pathParams.length > 0) {
          pathParams.forEach((param: string) => {
            requestBody[param] = `val_${param}`;
          });
        } else {
          requestBody = { name: "Sample Item", active: true };
        }
      }

      const headers = [
        { key: "Content-Type", value: "application/json" },
        ...(hasAuthMiddleware || !isPublic ? [{ key: "Authorization", value: "Bearer eyJhbGciOi..." }] : []),
      ];

      // Detailed Description
      const middlewareList = (r?.middleware || []).join(", ");
      const chainList = (r?.chain || []).join(" → ");
      let detailedDescription = `Handles HTTP ${method} requests for ${rawPath}.`;
      if (middlewareList) detailedDescription += ` Dispatches through middleware pipeline [${middlewareList}].`;
      if (chainList) detailedDescription += ` Execution call graph: ${chainList}.`;

      items.push({
        id: routeId,
        path: rawPath,
        method,
        module: moduleName,
        description: r?.description || `${method} handler for ${rawPath}`,
        detailedDescription,
        isPublic,
        version: "v1",
        tag: `@${moduleName.toLowerCase().replace(/\s+/g, "-")}`,
        file: r?.file || "backend/src/routes/api.routes.ts",
        lines: r?.lines || `${r?.lineStart || 1} - ${r?.lineEnd || 35}`,
        controller,
        service,
        metrics: {
          successRate: "100%",
          avgResponseTime: `${Math.max(45, (routeFileObj?.lineCount || 30) * 3)} ms`,
          dbActivity: matchedDbFlow ? `${matchedDbFlow.entities.length} tables` : "AST Flow",
          usage: `${Math.max(120, (idx + 1) * 380)}`,
        },
        dependencies: dependencies.length > 0 ? dependencies : [{ name: "bullmq", version: "^1.0.0", type: "package" }],
        request: {
          contentType: "application/json",
          body: requestBody,
          headers,
          queryParams,
        },
        response: {
          statusCode: method === "POST" ? 201 : 200,
          statusText: method === "POST" ? "Created" : "OK",
          body: {
            success: true,
            path: rawPath,
            timestamp: new Date().toISOString(),
            ...(matchedDbFlow?.entities?.length ? { entities: matchedDbFlow.entities } : {}),
          },
          headers: [{ key: "Content-Type", value: "application/json" }],
        },
        relatedRoutes: [],
      });
    });

    // Populate related routes by matching module
    items.forEach((item) => {
      item.relatedRoutes = items
        .filter((other) => other.id !== item.id && other.module === item.module)
        .slice(0, 3)
        .map((other) => other.path);
    });

    return items.length > 0 ? items : DEFAULT_ROUTES;
  }, [result]);

  // Method Counts for Header Badges
  const methodCounts = useMemo(() => {
    const counts = { GET: 59, POST: 12, DELETE: 11, PATCH: 4, PUT: 0, total: allRoutes.length };
    let foundGet = 0, foundPost = 0, foundDel = 0, foundPatch = 0, foundPut = 0;
    allRoutes.forEach((r) => {
      if (r.method === "GET") foundGet++;
      if (r.method === "POST") foundPost++;
      if (r.method === "DELETE") foundDel++;
      if (r.method === "PATCH") foundPatch++;
      if (r.method === "PUT") foundPut++;
    });
    if (foundGet > 0 || foundPost > 0) {
      counts.GET = foundGet;
      counts.POST = foundPost;
      counts.DELETE = foundDel;
      counts.PATCH = foundPatch;
      counts.PUT = foundPut;
    }
    return counts;
  }, [allRoutes]);

  // Filtered Routes
  const filteredRoutes = useMemo(() => {
    const searchFilter = (globalSearch || browserSearch).toLowerCase().trim();
    return allRoutes.filter((route) => {
      if (activeMethodFilter && route.method !== activeMethodFilter) return false;
      if (!searchFilter) return true;

      return (
        route.path.toLowerCase().includes(searchFilter) ||
        route.method.toLowerCase().includes(searchFilter) ||
        route.description.toLowerCase().includes(searchFilter) ||
        route.module.toLowerCase().includes(searchFilter) ||
        route.file.toLowerCase().includes(searchFilter) ||
        route.controller.toLowerCase().includes(searchFilter) ||
        route.tag.toLowerCase().includes(searchFilter)
      );
    });
  }, [allRoutes, globalSearch, browserSearch, activeMethodFilter]);

  // Group filtered routes by module
  const groupedRoutes = useMemo(() => {
    const groups: Record<string, RouteItem[]> = {};
    filteredRoutes.forEach((r) => {
      if (!groups[r.module]) groups[r.module] = [];
      groups[r.module].push(r);
    });
    return groups;
  }, [filteredRoutes]);

  // Active Selected Route Data
  const selectedRoute: RouteItem = useMemo(() => {
    return (
      allRoutes.find((r) => r.id === selectedRouteId || r.path === selectedRouteId) ||
      allRoutes[0] ||
      DEFAULT_ROUTES[0]
    );
  }, [allRoutes, selectedRouteId]);

  const handleRunEndpoint = () => {
    setIsRunning(true);
    setRunCompleted(false);
    setTimeout(() => {
      setIsRunning(false);
      setRunCompleted(true);
      setTimeout(() => setRunCompleted(false), 3000);
    }, 650);
  };

  const handleViewInMetroMap = () => {
    onSelectTraceRouteId?.(selectedRoute?.path || "/key");
    onSwitchTab?.("arch");
  };

  return (
    <div className="w-full h-full min-h-0 bg-[#063D48] text-[#F2F7F7] font-sans flex flex-col gap-3 text-left select-none overflow-hidden p-3.5 sm:p-4 rounded-2xl relative">
      
      {/* ── BACKGROUND DECORATIVE SHAPES (Image 3) ────────────────── */}
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-[#F2384B]/12 blur-3xl pointer-events-none -translate-y-20 translate-x-20 z-0" />
      <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-[#F2384B]/8 blur-3xl pointer-events-none translate-y-16 -translate-x-16 z-0" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-[#16C7A1]/5 blur-3xl pointer-events-none translate-y-32 z-0" />

      {/* ── 1. GLOBAL ROUTE ANALYSIS HEADER (Image 3 - Compact) ───────────────────── */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2.5 border-b border-white/[0.08] shrink-0 relative z-10">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[2px] text-[#20D6D8]">
            ROUTE ANALYSIS
          </p>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight mt-0.5">
            API Endpoints
          </h1>
          <p className="text-[11.5px] text-[#9BC9CE] mt-0.5">
            Browse and explore all API endpoints
          </p>
        </div>

        {/* Search Bar + Method Counter Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Defined Search Bar with Ctrl + K */}
          <div className="relative w-full sm:w-[320px] lg:w-[360px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#82AEB5]" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setBrowserSearch(e.target.value);
              }}
              placeholder="Search routes by path, method, or file..."
              className="w-full h-9 pl-9 pr-16 rounded-xl bg-[#073C44] border border-[rgba(100,210,220,0.2)] text-xs text-white placeholder-[#82AEB5] focus:outline-none focus:border-[#20D6D8] focus:ring-1 focus:ring-[#20D6D8]/30 transition shadow-xs"
            />
            {globalSearch ? (
              <button
                onClick={() => {
                  setGlobalSearch("");
                  setBrowserSearch("");
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                ×
              </button>
            ) : (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded bg-white/[0.08] text-[10px] font-mono font-semibold text-[#82AEB5]">
                  Ctrl K
                </span>
              </div>
            )}
          </div>

          {/* Filled Method Badges (Image 3) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveMethodFilter((prev) => (prev === "GET" ? null : "GET"))}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all shadow-xs cursor-pointer ${
                activeMethodFilter === "GET"
                  ? "bg-[#8EDBD5] text-[#063C42] ring-1 ring-white/40 scale-105"
                  : "bg-[#8EDBD5] text-[#063C42] hover:brightness-105"
              }`}
            >
              GET: {methodCounts.GET}
            </button>

            <button
              onClick={() => setActiveMethodFilter((prev) => (prev === "POST" ? null : "POST"))}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all shadow-xs cursor-pointer ${
                activeMethodFilter === "POST"
                  ? "bg-[#F2EEE5] text-[#24363A] ring-1 ring-white/40 scale-105"
                  : "bg-[#F2EEE5] text-[#24363A] hover:brightness-105"
              }`}
            >
              POST: {methodCounts.POST}
            </button>

            <button
              onClick={() => setActiveMethodFilter((prev) => (prev === "DELETE" ? null : "DELETE"))}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all shadow-xs cursor-pointer ${
                activeMethodFilter === "DELETE"
                  ? "bg-[#E55360] text-white ring-1 ring-white/40 scale-105"
                  : "bg-[#E55360] text-white hover:brightness-105"
              }`}
            >
              DELETE: {methodCounts.DELETE}
            </button>

            <button
              onClick={() => setActiveMethodFilter((prev) => (prev === "PATCH" ? null : "PATCH"))}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all shadow-xs cursor-pointer ${
                activeMethodFilter === "PATCH"
                  ? "bg-[#A7DDE0] text-[#063C42] ring-1 ring-white/40 scale-105"
                  : "bg-[#A7DDE0] text-[#063C42] hover:brightness-105"
              }`}
            >
              PATCH: {methodCounts.PATCH}
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. THREE-COLUMN WORKSPACE (Image 3) ─────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch min-h-0 overflow-hidden relative z-10">
        
        {/* ── COLUMN 1: ENDPOINT BROWSER (3 cols) ────────────────── */}
        <aside className="lg:col-span-3 xl:col-span-3 bg-[#084851] border border-[rgba(100,210,220,0.18)] rounded-2xl p-2.5 flex flex-col gap-2 overflow-hidden h-full min-h-0 select-none shadow-sm">
          {/* Top Search & Filter Bar */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="relative flex-1">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#82AEB5]" />
              <input
                type="text"
                value={browserSearch}
                onChange={(e) => setBrowserSearch(e.target.value)}
                placeholder="Search endpoints, tags, or files..."
                className="w-full h-7.5 pl-7.5 pr-2.5 rounded-lg bg-[#053B43] border border-[rgba(100,210,220,0.18)] text-[10.5px] text-white placeholder-[#82AEB5]/70 focus:outline-none focus:border-[#20D6D8] transition"
              />
            </div>
            <button
              onClick={() => setActiveMethodFilter(null)}
              className="w-7.5 h-7.5 rounded-lg bg-[#053B43] border border-[rgba(100,210,220,0.18)] text-[#82AEB5] hover:text-white flex items-center justify-center transition cursor-pointer"
              title="Reset Method Filters"
            >
              <SlidersHorizontal size={12} />
            </button>
          </div>

          {/* Quick Method Buttons (All 86 has red active highlight) */}
          <div className="flex items-center gap-1 shrink-0 overflow-x-auto pb-0.5 custom-scrollbar">
            <button
              onClick={() => setActiveMethodFilter(null)}
              className={`px-2 py-0.5 rounded-md text-[9.5px] font-mono font-bold transition cursor-pointer shrink-0 ${
                activeMethodFilter === null
                  ? "bg-[#F2384B] text-white shadow-xs"
                  : "bg-[#053B43] text-[#82AEB5] hover:text-white"
              }`}
            >
              All {allRoutes.length}
            </button>
            <button
              onClick={() => setActiveMethodFilter(activeMethodFilter === "GET" ? null : "GET")}
              className={`px-2 py-0.5 rounded-md text-[9.5px] font-mono font-bold transition cursor-pointer shrink-0 ${
                activeMethodFilter === "GET"
                  ? "bg-[#8EDBD5] text-[#063C42]"
                  : "bg-[#053B43] text-[#8EDBD5] hover:text-white"
              }`}
            >
              GET {methodCounts.GET}
            </button>
            <button
              onClick={() => setActiveMethodFilter(activeMethodFilter === "POST" ? null : "POST")}
              className={`px-2 py-0.5 rounded-md text-[9.5px] font-mono font-bold transition cursor-pointer shrink-0 ${
                activeMethodFilter === "POST"
                  ? "bg-[#F2EEE5] text-[#24363A]"
                  : "bg-[#053B43] text-[#F2EEE5] hover:text-white"
              }`}
            >
              POST {methodCounts.POST}
            </button>
            <button
              onClick={() => setActiveMethodFilter(activeMethodFilter === "PUT" ? null : "PUT")}
              className={`px-2 py-0.5 rounded-md text-[9.5px] font-mono font-bold transition cursor-pointer shrink-0 ${
                activeMethodFilter === "PUT"
                  ? "bg-[#A7DDE0] text-[#063C42]"
                  : "bg-[#053B43] text-[#A7DDE0] hover:text-white"
              }`}
            >
              PUT 0
            </button>
            <button
              onClick={() => setActiveMethodFilter(activeMethodFilter === "DELETE" ? null : "DELETE")}
              className={`px-2 py-0.5 rounded-md text-[9.5px] font-mono font-bold transition cursor-pointer shrink-0 ${
                activeMethodFilter === "DELETE"
                  ? "bg-[#E55360] text-white"
                  : "bg-[#053B43] text-[#E55360] hover:text-white"
              }`}
            >
              DELETE {methodCounts.DELETE}
            </button>
          </div>

          {/* Accordion Grouped Module List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar min-h-0">
            {Object.entries(groupedRoutes).map(([moduleName, routes]) => {
              const isOpen = openModules[moduleName] ?? true;
              const ModuleIcon = MODULE_ICONS[moduleName] || Folder;

              return (
                <div key={moduleName} className="space-y-1">
                  {/* Module Group Header */}
                  <button
                    onClick={() => toggleModule(moduleName)}
                    className="w-full flex items-center justify-between p-1.5 rounded-lg bg-[#053B43]/80 hover:bg-[#074751] border border-white/[0.05] transition text-[11px] font-bold text-white cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ModuleIcon size={13} className="text-[#20D6D8] shrink-0" />
                      <span className="truncate">{moduleName}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[9px] font-mono font-bold text-[#82AEB5] bg-[#084851] px-1.5 py-0.2 rounded border border-white/[0.05]">
                        {routes.length}
                      </span>
                      <ChevronDown
                        size={11}
                        className={`text-[#82AEB5] transition-transform duration-200 ${
                          isOpen ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                    </div>
                  </button>

                  {/* Route Items List (Selected route has red border, subtle red tint, and red dot) */}
                  {isOpen && (
                    <div className="space-y-1 pl-1">
                      {routes.map((route) => {
                        const isSelected = selectedRoute.id === route.id || selectedRoute.path === route.path;

                        return (
                          <div
                            key={route.id}
                            onClick={() => setSelectedRouteId(route.id)}
                            className={`p-2 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-2 ${
                              isSelected
                                ? "bg-[#F2384B]/10 border-[#F2384B] shadow-[0_0_10px_rgba(242,56,75,0.15)]"
                                : "bg-[#071F26] border-white/[0.04] hover:border-white/[0.15] hover:bg-[#0A2E38]"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {/* Light Cyan GET badge */}
                              <span className="px-1.5 py-0.5 rounded text-[9.5px] font-black font-mono tracking-wider bg-[#91DDD7] text-[#073C42] shrink-0 leading-tight">
                                {route.method}
                              </span>
                              <div className="min-w-0 flex-1">
                                <span className="text-[11.5px] font-mono font-bold text-white truncate block leading-tight">
                                  {route.path}
                                </span>
                                <span className="text-[9.5px] text-[#82AEB5] truncate block mt-0.5">
                                  {route.description}
                                </span>
                              </div>
                            </div>

                            {/* Active Red Status Dot indicator */}
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-[#F2384B] shadow-[0_0_6px_#F2384B] shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── COLUMN 2: SELECTED ENDPOINT WORKSPACE (Center / 6 cols) ───────── */}
        <main className="lg:col-span-6 xl:col-span-6 bg-[#084851] border border-[rgba(100,210,220,0.18)] rounded-2xl p-3 sm:p-3.5 flex flex-col gap-2.5 overflow-y-auto h-full min-h-0 custom-scrollbar text-left shadow-sm">
          
          {/* Breadcrumbs with Diamond Icon */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#82AEB5] shrink-0">
            <span className="text-[#20D6D8] font-bold">◇</span>
            <span>Endpoints</span>
            <span>&gt;</span>
            <span>{selectedRoute.module}</span>
            <span>&gt;</span>
            <span className="text-[#20D6D8] font-bold">{selectedRoute.path}</span>
          </div>

          {/* Compact Endpoint Title Header + Actions (Image 3) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/[0.06] shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Diamond Icon Container */}
              <div className="w-8 h-8 rounded-lg bg-[#06333C] border border-[#20D6D8]/30 flex items-center justify-center text-[#20D6D8] shrink-0 font-bold">
                ◇
              </div>

              {/* Compact GET badge (Image 3) */}
              <div className="h-7 px-2.5 rounded-md bg-[#8EDBD5] text-[#063C42] font-black text-xs tracking-wider flex items-center justify-center shrink-0 shadow-xs leading-none">
                {selectedRoute.method}
              </div>

              <div className="min-w-0">
                <h2 className="text-xl sm:text-[26px] font-bold font-mono text-white tracking-tight leading-none truncate">
                  {selectedRoute.path}
                </h2>
                <p className="text-[11px] text-[#82AEB5] mt-0.5 font-normal truncate">
                  {selectedRoute.description}
                </p>
              </div>
            </div>

            {/* Top-Right Action Controls (Compact 32px icon buttons + Run Button) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => toggleStar(selectedRoute.id)}
                className={`w-7.5 h-7.5 rounded-lg border flex items-center justify-center transition cursor-pointer ${
                  starredRoutes.has(selectedRoute.id)
                    ? "bg-amber-400/20 border-amber-400/40 text-amber-400"
                    : "bg-[#073C44] border-[rgba(100,210,220,0.18)] text-[#82AEB5] hover:text-white"
                }`}
                title="Star Endpoint"
              >
                <Star
                  size={12}
                  className={starredRoutes.has(selectedRoute.id) ? "fill-amber-400" : ""}
                />
              </button>

              <button
                onClick={() => handleCopy(selectedRoute.path, "path")}
                className="w-7.5 h-7.5 rounded-lg bg-[#073C44] border border-[rgba(100,210,220,0.18)] text-[#82AEB5] hover:text-white flex items-center justify-center transition cursor-pointer"
                title="Copy Path"
              >
                {copiedKey === "path" ? (
                  <Check size={12} className="text-[#20D6D8]" />
                ) : (
                  <Copy size={12} />
                )}
              </button>

              <button
                onClick={() => handleCopy(`curl -X ${selectedRoute.method} http://localhost:3000${selectedRoute.path}`, "curl")}
                className="w-7.5 h-7.5 rounded-lg bg-[#073C44] border border-[rgba(100,210,220,0.18)] text-[#82AEB5] hover:text-white flex items-center justify-center transition cursor-pointer"
                title="Copy cURL"
              >
                <ExternalLink size={12} />
              </button>

              {/* Compact Teal/Cyan Run CTA Button (Image 3) */}
              <button
                onClick={handleRunEndpoint}
                disabled={isRunning}
                className={`h-7.5 px-3 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                  runCompleted
                    ? "bg-emerald-500 text-white"
                    : "bg-[#20D6D8] hover:bg-[#3be0e2] text-[#063C42]"
                }`}
              >
                <Play size={11} className={isRunning ? "animate-spin" : "fill-current"} />
                <span>{isRunning ? "..." : runCompleted ? "200 OK" : "Run"}</span>
              </button>
            </div>
          </div>

          {/* Compact Semantic Badges Row */}
          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10.5px] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Active
            </span>

            <span className="px-2 py-0.5 rounded-md bg-[#073C44] border border-[rgba(100,210,220,0.18)] text-[#A8C8CC] text-[10.5px] font-semibold flex items-center gap-1">
              {selectedRoute.isPublic ? <Globe size={10} /> : <Lock size={10} />}
              {selectedRoute.isPublic ? "Public" : "Protected"}
            </span>

            <span className="px-1.5 py-0.5 rounded-md bg-[#073C44] border border-[rgba(100,210,220,0.18)] text-[#A8C8CC] text-[10.5px] font-mono">
              {selectedRoute.version}
            </span>

            <span className="px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10.5px] font-semibold">
              {selectedRoute.module}
            </span>

            <span className="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10.5px] font-mono">
              {selectedRoute.tag}
            </span>
          </div>

          {/* Compact Source File Bar (Fitting content width, Image 3) */}
          <div className="w-fit px-2 py-0.5 rounded-md bg-[#073C44] border border-[rgba(100,210,220,0.18)] text-[10.5px] font-mono text-[#A8C8CC] flex items-center gap-1.5 shrink-0">
            <FileCode size={11} className="text-[#20D6D8]" />
            <span>{selectedRoute.file}</span>
            <button
              onClick={() => handleCopy(selectedRoute.file, "file-path-main")}
              className="text-[#82AEB5] hover:text-white ml-0.5"
              title="Copy Path"
            >
              {copiedKey === "file-path-main" ? <Check size={10} className="text-[#20D6D8]" /> : <Copy size={10} />}
            </button>
          </div>

          {/* Compact Workspace Tabs Navigation */}
          <div className="flex items-center gap-3 border-b border-white/[0.08] shrink-0 overflow-x-auto custom-scrollbar">
            {(
              [
                { id: "overview", label: "Overview", icon: Layers },
                { id: "request", label: "Request", icon: ArrowRight },
                { id: "response", label: "Response", icon: Server },
                { id: "dependencies", label: "Dependencies", icon: GitBranch },
                { id: "traces", label: "Traces", icon: Zap },
              ] as const
            ).map((tab) => {
              const isActive = activeWorkspaceTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveWorkspaceTab(tab.id)}
                  className={`flex items-center gap-1.5 pb-1.5 text-[11px] font-bold transition-all cursor-pointer relative shrink-0 ${
                    isActive ? "text-[#20D6D8]" : "text-[#82AEB5] hover:text-white"
                  }`}
                >
                  <Icon size={12} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="routeWorkspaceTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#20D6D8]"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content: OVERVIEW (Dense Layout, Image 3) */}
          {activeWorkspaceTab === "overview" && (
            <div className="space-y-2.5">
              {/* Compact Description Card */}
              <div className="p-2.5 rounded-xl bg-[#073B43] border border-[rgba(100,210,220,0.12)] text-[11px] text-[#C5E2E6] leading-relaxed">
                {selectedRoute.detailedDescription}
              </div>

              {/* REQUEST ACCORDION PANEL (Compact Horizontal Meta + Denser Body, Image 3) */}
              <div className="bg-[#073B43] border border-[rgba(100,210,220,0.14)] rounded-xl overflow-hidden shadow-xs">
                <div
                  onClick={() => setIsRequestOpen(!isRequestOpen)}
                  className="px-3 py-2 bg-[#063239] flex items-center justify-between cursor-pointer border-b border-white/[0.06]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[#20D6D8] font-bold text-xs">◇</span>
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                      REQUEST
                    </span>
                  </div>
                  <ChevronDown
                    size={13}
                    className={`text-[#82AEB5] transition-transform ${
                      isRequestOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </div>

                {isRequestOpen && (
                  <div className="p-3 space-y-2.5">
                    {/* Horizontal 1-line Meta pills (Image 3) */}
                    <div className="flex items-center gap-3 text-[10.5px] font-mono text-[#82AEB5] flex-wrap pb-1.5 border-b border-white/[0.06]">
                      <div className="flex items-center gap-1.5">
                        <span>HTTP Method</span>
                        <span className="px-1.5 py-0.2 rounded bg-[#084851] border border-[rgba(100,210,220,0.3)] text-[#20D6D8] font-bold text-[9.5px]">
                          {selectedRoute.method}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>Endpoint</span>
                        <span className="font-bold text-white">{selectedRoute.path}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>Content Type</span>
                        <span className="text-[#20D6D8]">{selectedRoute.request.contentType}</span>
                      </div>
                    </div>

                    {/* Sub-tabs with Teal Active Pill + Copy/Schema Actions */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setRequestSubTab("body")}
                          className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold cursor-pointer transition ${
                            requestSubTab === "body"
                              ? "bg-[#06333C] text-[#20D6D8] border border-[#20D6D8]/60 shadow-xs"
                              : "text-[#82AEB5] hover:text-white"
                          }`}
                        >
                          Body (JSON)
                        </button>
                        <button
                          onClick={() => setRequestSubTab("headers")}
                          className={`px-2.5 py-1 rounded-md text-[10.5px] font-semibold cursor-pointer transition ${
                            requestSubTab === "headers"
                              ? "bg-[#06333C] text-[#20D6D8] border border-[#20D6D8]/60 shadow-xs"
                              : "text-[#82AEB5] hover:text-white"
                          }`}
                        >
                          Headers ({selectedRoute.request.headers.length})
                        </button>
                        <button
                          onClick={() => setRequestSubTab("params")}
                          className={`px-2.5 py-1 rounded-md text-[10.5px] font-semibold cursor-pointer transition ${
                            requestSubTab === "params"
                              ? "bg-[#06333C] text-[#20D6D8] border border-[#20D6D8]/60 shadow-xs"
                              : "text-[#82AEB5] hover:text-white"
                          }`}
                        >
                          Query Params ({selectedRoute.request.queryParams.length})
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            handleCopy(
                              JSON.stringify(selectedRoute.request.body, null, 2),
                              "req-body"
                            )
                          }
                          className="px-2 py-0.5 rounded-md bg-[#053B43] hover:bg-[#084851] border border-[rgba(100,210,220,0.15)] text-[10px] text-[#82AEB5] hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          <Copy size={11} />
                          <span>{copiedKey === "req-body" ? "Copied" : "Copy"}</span>
                        </button>
                        <button className="px-2 py-0.5 rounded-md bg-[#053B43] hover:bg-[#084851] border border-[rgba(100,210,220,0.15)] text-[10px] text-[#82AEB5] hover:text-white flex items-center gap-1 cursor-pointer">
                          <Code2 size={11} />
                          <span>Schema</span>
                        </button>
                      </div>
                    </div>

                    {/* Compact Code Block / No body required (Image 3) */}
                    <div className="bg-[#05282F] border border-[rgba(100,210,220,0.1)] rounded-lg p-2.5 font-mono text-xs">
                      {requestSubTab === "body" && (
                        <div className="space-y-1">
                          {Object.entries(selectedRoute.request.body).length > 0 ? (
                            Object.entries(selectedRoute.request.body).map(([k, v], idx) => (
                              <div key={k} className="flex items-center gap-2.5 text-[11px]">
                                <span className="text-[#82AEB5]/40 select-none w-3 text-right">
                                  {idx + 1}
                                </span>
                                <div>
                                  <span className="text-[#20D6D8]">"{k}"</span>
                                  <span className="text-white">: </span>
                                  <span className="text-amber-300">"{String(v)}"</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className="text-[#82AEB5] italic text-[11px] block py-1 font-sans">
                              No request body required
                            </span>
                          )}
                        </div>
                      )}

                      {requestSubTab === "headers" && (
                        <div className="space-y-1">
                          {selectedRoute.request.headers.map((h, idx) => (
                            <div key={h.key} className="flex items-center gap-2.5 text-[11px]">
                              <span className="text-[#82AEB5]/40 select-none w-3 text-right">
                                {idx + 1}
                              </span>
                              <div>
                                <span className="text-[#20D6D8]">{h.key}</span>
                                <span className="text-white">: </span>
                                <span className="text-[#C084FC]">{h.value}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {requestSubTab === "params" && (
                        <div className="space-y-1">
                          {selectedRoute.request.queryParams.length > 0 ? (
                            selectedRoute.request.queryParams.map((p, idx) => (
                              <div key={p.key} className="flex items-center gap-2.5 text-[11px]">
                                <span className="text-[#82AEB5]/40 select-none w-3 text-right">
                                  {idx + 1}
                                </span>
                                <div>
                                  <span className="text-[#20D6D8]">{p.key}</span>
                                  <span className="text-white">: </span>
                                  <span className="text-amber-300">{p.value}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className="text-[#82AEB5] italic text-[11px] block py-1 font-sans">
                              No query params required
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* RESPONSE ACCORDION PANEL */}
              <div className="bg-[#073B43] border border-[rgba(100,210,220,0.14)] rounded-xl overflow-hidden shadow-xs">
                <div
                  onClick={() => setIsResponseOpen(!isResponseOpen)}
                  className="px-3 py-2 bg-[#063239] flex items-center justify-between cursor-pointer border-b border-white/[0.06]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                      RESPONSE
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                      {selectedRoute.response.statusCode} {selectedRoute.response.statusText}
                    </span>
                  </div>
                  <ChevronDown
                    size={13}
                    className={`text-[#82AEB5] transition-transform ${
                      isResponseOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </div>

                {isResponseOpen && (
                  <div className="p-3 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setResponseSubTab("body")}
                          className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold cursor-pointer transition ${
                            responseSubTab === "body"
                              ? "bg-[#06333C] text-[#20D6D8] border border-[#20D6D8]/60 shadow-xs"
                              : "text-[#82AEB5] hover:text-white"
                          }`}
                        >
                          Body (JSON)
                        </button>
                        <button
                          onClick={() => setResponseSubTab("headers")}
                          className={`px-2.5 py-1 rounded-md text-[10.5px] font-semibold cursor-pointer transition ${
                            responseSubTab === "headers"
                              ? "bg-[#06333C] text-[#20D6D8] border border-[#20D6D8]/60 shadow-xs"
                              : "text-[#82AEB5] hover:text-white"
                          }`}
                        >
                          Headers ({selectedRoute.response.headers.length})
                        </button>
                        <button
                          onClick={() => setResponseSubTab("schema")}
                          className={`px-2.5 py-1 rounded-md text-[10.5px] font-semibold cursor-pointer transition ${
                            responseSubTab === "schema"
                              ? "bg-[#06333C] text-[#20D6D8] border border-[#20D6D8]/60 shadow-xs"
                              : "text-[#82AEB5] hover:text-white"
                          }`}
                        >
                          Schema
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            handleCopy(
                              JSON.stringify(selectedRoute.response.body, null, 2),
                              "res-body"
                            )
                          }
                          className="px-2 py-0.5 rounded-md bg-[#053B43] hover:bg-[#084851] border border-[rgba(100,210,220,0.15)] text-[10px] text-[#82AEB5] hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          <Copy size={11} />
                          <span>{copiedKey === "res-body" ? "Copied" : "Copy"}</span>
                        </button>
                        <button className="px-2 py-0.5 rounded-md bg-[#053B43] hover:bg-[#084851] border border-[rgba(100,210,220,0.15)] text-[10px] text-[#82AEB5] hover:text-white flex items-center gap-1 cursor-pointer">
                          <Code2 size={11} />
                          <span>Schema</span>
                        </button>
                      </div>
                    </div>

                    {/* JSON Code View (Image 3) */}
                    <div className="bg-[#05282F] border border-[rgba(100,210,220,0.1)] rounded-lg p-2.5 font-mono text-[11px] overflow-x-auto">
                      <pre className="text-[#20D6D8] leading-relaxed">
                        {JSON.stringify(selectedRoute.response.body, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Content: TRACES */}
          {activeWorkspaceTab === "traces" && (
            <div className="space-y-3">
              <div className="bg-[#073B43] border border-[rgba(100,210,220,0.14)] rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Execution Pipeline</span>
                  <button
                    onClick={handleViewInMetroMap}
                    className="text-xs font-bold text-[#20D6D8] hover:underline flex items-center gap-1"
                  >
                    <span>View in Metro Map</span>
                    <ExternalLink size={11} />
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="p-2.5 rounded-lg bg-[#053B43] border border-[#20D6D8]/30 flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-[#20D6D8]">
                      1. HTTP Route Endpoint
                    </span>
                    <span className="text-[10.5px] text-[#82AEB5] font-mono">{selectedRoute.path}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#053B43] border border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-[#3B82F6]">
                      2. Controller Handler
                    </span>
                    <span className="text-[10.5px] text-[#82AEB5] font-mono">{selectedRoute.controller}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#053B43] border border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-amber-400">
                      3. Business Service
                    </span>
                    <span className="text-[10.5px] text-[#82AEB5] font-mono">{selectedRoute.service}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#053B43] border border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-purple-400">
                      4. Data Repository & DB
                    </span>
                    <span className="text-[10.5px] text-[#82AEB5] font-mono">Database Execution</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: DEPENDENCIES */}
          {activeWorkspaceTab === "dependencies" && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedRoute.dependencies.map((dep) => (
                  <div
                    key={dep.name}
                    className="p-2.5 rounded-xl bg-[#073B43] border border-[rgba(100,210,220,0.12)] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Shield size={13} className="text-[#20D6D8]" />
                      <div>
                        <span className="text-[11.5px] font-bold text-white block">{dep.name}</span>
                        <span className="text-[9.5px] text-[#82AEB5]">{dep.type}</span>
                      </div>
                    </div>
                    <span className="text-[10.5px] font-mono text-[#20D6D8] bg-[#053B43] px-2 py-0.2 rounded border border-white/[0.06]">
                      {dep.version}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* ── COLUMN 3: ROUTE INFORMATION INSPECTOR (Right / 3 cols) ─────────── */}
        <aside className="lg:col-span-3 xl:col-span-3 bg-[#084851] border border-[rgba(100,210,220,0.18)] rounded-2xl p-3 flex flex-col gap-2.5 overflow-y-auto h-full min-h-0 custom-scrollbar text-left select-none shadow-sm">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-[#FF3348] shrink-0" />
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider leading-none">
                ROUTE INFORMATION
              </h3>
            </div>
          </div>

          {/* Streamlined Structured Category Cards without filler subtitles */}
          <div className="space-y-1.5">
            {/* 1. Controller */}
            <div className="p-2 rounded-xl bg-[#073941] border border-[rgba(80,200,210,0.16)] flex items-center justify-between gap-2 shadow-xs hover:border-[rgba(100,210,220,0.3)] transition">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#9BE7E5] text-[#063C42] flex items-center justify-center shrink-0 shadow-xs">
                  <Code2 size={15} className="stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-[#82AEB5] block font-medium">Controller</span>
                  <span className="text-[11.5px] font-mono font-bold text-white truncate block leading-tight">
                    {selectedRoute.controller}
                  </span>
                </div>
              </div>
              <ExternalLink size={12} className="text-[#82AEB5] hover:text-white shrink-0 cursor-pointer" />
            </div>

            {/* 2. Service */}
            <div className="p-2 rounded-xl bg-[#073941] border border-[rgba(80,200,210,0.16)] flex items-center justify-between gap-2 shadow-xs hover:border-[rgba(100,210,220,0.3)] transition">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#E34A5F] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Settings size={15} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-[#82AEB5] block font-medium">Service</span>
                  <span className="text-[11.5px] font-mono font-bold text-white truncate block leading-tight">
                    {selectedRoute.service}
                  </span>
                </div>
              </div>
              <ExternalLink size={12} className="text-[#82AEB5] hover:text-white shrink-0 cursor-pointer" />
            </div>

            {/* 3. File */}
            <div className="p-2 rounded-xl bg-[#073941] border border-[rgba(80,200,210,0.16)] flex items-center justify-between gap-2 shadow-xs hover:border-[rgba(100,210,220,0.3)] transition">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#5794E8] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileText size={15} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-[#82AEB5] block font-medium">File</span>
                  <span className="text-[11.5px] font-mono font-bold text-white truncate block leading-tight">
                    {selectedRoute.file.split(/[\\/]/).pop()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleCopy(selectedRoute.file, "file-path")}
                className="text-[#82AEB5] hover:text-white p-1 cursor-pointer"
                title="Copy File Path"
              >
                {copiedKey === "file-path" ? (
                  <Check size={12} className="text-[#20D6D8]" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            </div>

            {/* 4. Lines */}
            <div className="p-2 rounded-xl bg-[#073941] border border-[rgba(80,200,210,0.16)] flex items-center justify-between gap-2 shadow-xs hover:border-[rgba(100,210,220,0.3)] transition">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#F28BA5] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Layers size={15} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-[#82AEB5] block font-medium">Lines</span>
                  <span className="text-[11.5px] font-mono font-bold text-white block leading-tight">
                    {selectedRoute.lines}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleCopy(selectedRoute.lines, "lines-copy")}
                className="text-[#82AEB5] hover:text-white p-1 cursor-pointer"
                title="Copy Lines"
              >
                {copiedKey === "lines-copy" ? (
                  <Check size={12} className="text-[#20D6D8]" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            </div>

            {/* 5. Module */}
            <div className="p-2 rounded-xl bg-[#073941] border border-[rgba(80,200,210,0.16)] flex items-center justify-between gap-2 shadow-xs hover:border-[rgba(100,210,220,0.3)] transition">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#9B6AFF] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Folder size={15} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-[#82AEB5] block font-medium">Module</span>
                  <span className="text-[11.5px] font-mono font-bold text-white truncate block leading-tight">
                    {selectedRoute.module}
                  </span>
                </div>
              </div>
              <ExternalLink size={12} className="text-[#82AEB5] hover:text-white shrink-0 cursor-pointer" />
            </div>
          </div>

          {/* Dependencies List with Expandable Box Header */}
          <div className="space-y-1.5 pt-1 border-t border-white/[0.08]">
            <div
              onClick={() => setIsDependenciesOpen(!isDependenciesOpen)}
              className="flex items-center justify-between text-[11px] font-bold text-white cursor-pointer select-none"
            >
              <div className="flex items-center gap-1.5">
                <Box size={13} className="text-[#20D6D8]" />
                <span>Dependencies ({selectedRoute.dependencies.length})</span>
              </div>
              <ChevronDown
                size={12}
                className={`text-[#82AEB5] transition-transform ${
                  isDependenciesOpen ? "rotate-0" : "-rotate-90"
                }`}
              />
            </div>

            {isDependenciesOpen && (
              <div className="space-y-1 mt-1">
                {selectedRoute.dependencies.map((dep, idx) => (
                  <div
                    key={dep.name}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#06333C] border border-[rgba(100,210,220,0.12)] text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Shield
                        size={12}
                        className={idx % 2 === 0 ? "text-[#5794E8]" : "text-[#9B6AFF]"}
                      />
                      <span className="font-mono text-white truncate text-[11px] font-medium">
                        {dep.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#82AEB5] shrink-0 font-medium">
                      {dep.version}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Related Endpoints Header & Full-width Light Cyan View in Metro Map CTA */}
          <div className="space-y-1.5 pt-1 mt-auto border-t border-white/[0.08]">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-white">
              <Link2 size={12} className="text-[#20D6D8]" />
              <span>Related Endpoints</span>
            </div>

            <button
              onClick={handleViewInMetroMap}
              className="w-full py-2.5 px-3 rounded-xl bg-[#8EDBD5] hover:bg-[#A3E5DF] text-[#063C42] font-extrabold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm shadow-[#8EDBD5]/15"
            >
              <div className="flex items-center gap-2">
                <Network size={14} className="stroke-[2.5]" />
                <span>View in Metro Map</span>
              </div>
              <ArrowRight size={13} className="stroke-[2.5]" />
            </button>
          </div>
        </aside>

      </div>
    </div>
  );
}

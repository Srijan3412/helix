"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  Boxes,
  Route as RouteIcon,
  Shield,
  Database,
  AlertTriangle,
  FileCode,
  Search,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Zap,
  Radio,
  Lock,
  X,
  Copy,
  Check,
  Network,
  Settings as SettingsIcon,
  User,
  Folder,
  BarChart3,
  Terminal,
  FileText,
  Sparkles,
} from "lucide-react";

// --- Method Color Configuration ---
const METHOD_CONFIG: Record<
  string,
  { bg: string; text: string; border: string; edgeColor: string; pillColor: string }
> = {
  GET: {
    bg: "bg-[#16C7A3]",
    text: "text-[#061412]",
    border: "border-[#16C7A3]/40",
    edgeColor: "#16C7A3",
    pillColor: "#16C7A3",
  },
  POST: {
    bg: "bg-[#3288F5]",
    text: "text-white",
    border: "border-[#3288F5]/40",
    edgeColor: "#3288F5",
    pillColor: "#3288F5",
  },
  PUT: {
    bg: "bg-[#8B5CF6]",
    text: "text-white",
    border: "border-[#8B5CF6]/40",
    edgeColor: "#8B5CF6",
    pillColor: "#8B5CF6",
  },
  DELETE: {
    bg: "bg-[#FF4D5E]",
    text: "text-white",
    border: "border-[#FF4D5E]/40",
    edgeColor: "#FF4D5E",
    pillColor: "#FF4D5E",
  },
  PATCH: {
    bg: "bg-[#F5A623]",
    text: "text-[#1A0F00]",
    border: "border-[#F5A623]/40",
    edgeColor: "#F5A623",
    pillColor: "#F5A623",
  },
};

// --- Namespace Metadata & Visual System ---
interface NamespaceMeta {
  color: string;
  icon: any;
  title: string;
}

const NAMESPACE_PRESETS: Record<string, NamespaceMeta> = {
  "/": { color: "#16C7A1", icon: RouteIcon, title: "ROOT" },
  "/auth": { color: "#2F80ED", icon: Lock, title: "AUTHENTICATION" },
  "/users": { color: "#8B5CF6", icon: User, title: "USER MANAGEMENT" },
  "/projects": { color: "#00B8D9", icon: Folder, title: "PROJECTS" },
  "/analysis": { color: "#F5B800", icon: BarChart3, title: "ANALYSIS" },
  "/scans": { color: "#FF4D5E", icon: Radio, title: "SCANS" },
  "/reports": { color: "#38BDF8", icon: FileText, title: "REPORTING" },
  "/admin": { color: "#F59E0B", icon: Shield, title: "ADMINISTRATION" },
  "/webhooks": { color: "#06B6D4", icon: Network, title: "WEBHOOKS" },
  "/settings": { color: "#A855F7", icon: SettingsIcon, title: "SETTINGS" },
};

function getNamespaceMeta(ns: string): NamespaceMeta {
  if (NAMESPACE_PRESETS[ns]) return NAMESPACE_PRESETS[ns];
  const lower = String(ns || "").toLowerCase();
  for (const [key, meta] of Object.entries(NAMESPACE_PRESETS)) {
    if (key !== "/" && lower.includes(key.replace("/", ""))) {
      return meta;
    }
  }
  return { color: "#16C7A1", icon: RouteIcon, title: String(ns || "").replace("/", "").toUpperCase() || "CORE" };
}

// --- Subfamily Classifier ---
function categorizeEndpointFamily(path: string, method: string): string {
  const lower = String(path || "").toLowerCase();
  const m = String(method || "GET").toUpperCase();

  if (lower.includes("session") || lower.includes("token") || lower.includes("refresh")) return "Session";
  if (lower.includes("login") || lower.includes("signup") || lower.includes("logout") || lower.includes("auth"))
    return "Authentication";
  if (lower.includes("role") || lower.includes("permission")) return "Roles";
  if (lower.includes("user") || lower.includes("profile") || lower.includes("account") || lower.includes("member"))
    return "User";
  if (lower.includes("result") || lower.includes("export") || lower.includes("template") || lower.includes("report"))
    return "Results";
  if (lower.includes("log") || lower.includes("cache") || lower.includes("metric") || lower.includes("stat"))
    return "Logs";
  if (lower.includes("setting") || lower.includes("config") || lower.includes("key")) return "Settings";
  if (lower.includes("webhook") || lower.includes("event") || lower.includes("trigger")) return "Management";
  if (m === "POST" || m === "PUT" || m === "DELETE" || m === "PATCH") return "Mutations";
  return "Core";
}

// ==========================================
// 1. TOP API ROOT NODE COMPONENT
// ==========================================
function ApiRootNode({ data }: { data: { groupCount: number; endpointCount: number } }) {
  return (
    <div className="relative w-[210px] h-[52px] rounded-[14px] bg-[#0A1A22]/95 border border-[#16C7A1]/40 shadow-xl backdrop-blur-md px-3.5 py-2 flex items-center gap-3 text-left">
      <div className="w-8 h-8 rounded-lg bg-[#16C7A1]/15 border border-[#16C7A1]/30 flex items-center justify-center text-[#16C7A1] shrink-0">
        <Boxes size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-bold text-[#F7FAFA] uppercase tracking-wider flex items-center gap-1.5 leading-tight">
          API
        </div>
        <div className="text-[10px] text-[#82AEB5] font-medium truncate mt-0.5">
          {data.groupCount} route groups · {data.endpointCount} endpoints
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-[7px] !h-[7px] !bg-[#16C7A1] !border-none opacity-80"
      />
    </div>
  );
}

// ==========================================
// 2. NAMESPACE PARENT GROUP NODE COMPONENT
// ==========================================
interface RouteItemData {
  id: string;
  method: string;
  path: string;
  controller: string;
  hasAuth: boolean;
  accessesDB: boolean;
  middleware: string[];
  subfamily: string;
}

interface NamespaceGroupData {
  namespace: string;
  meta: NamespaceMeta;
  routes: RouteItemData[];
  families: Record<string, RouteItemData[]>;
  selectedRouteId: string | null;
  selectedNamespace: string | null;
  activeMethodFilter: string | null;
  searchQuery: string;
  onSelectRoute: (route: RouteItemData) => void;
  onSelectNamespace: (ns: string) => void;
}

function NamespaceGroupNode({ data }: { data: NamespaceGroupData }) {
  const {
    namespace,
    meta,
    routes,
    families,
    selectedRouteId,
    selectedNamespace,
    activeMethodFilter,
    searchQuery,
    onSelectRoute,
    onSelectNamespace,
  } = data;

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const isGroupSelected = selectedNamespace === namespace;
  const isAnyGroupSelected = selectedNamespace !== null;
  const isDimmed = isAnyGroupSelected && !isGroupSelected;

  const IconComponent = meta.icon;

  // Dynamic width based on namespace & route count (135px - 160px)
  const cardWidth = useMemo(() => {
    if (routes.length <= 3) return 135;
    if (routes.length >= 8) return 155;
    return 145;
  }, [routes.length]);

  return (
    <div
      onClick={() => onSelectNamespace(namespace)}
      className={`relative rounded-[16px] transition-all duration-200 text-left select-none overflow-hidden ${
        isGroupSelected
          ? "ring-2 ring-[#16C7A1] shadow-2xl bg-[#0B151D]"
          : "bg-[#09131B]/95 hover:bg-[#0C1924] shadow-xl"
      }`}
      style={{
        width: `${cardWidth}px`,
        opacity: isDimmed ? 0.35 : 1,
        border: `1px solid ${isGroupSelected ? meta.color : `${meta.color}35`}`,
        boxShadow: isGroupSelected
          ? `0 0 25px ${meta.color}30, 0 10px 30px rgba(0,0,0,0.5)`
          : `0 4px 20px rgba(0,0,0,0.35)`,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-[6px] !h-[6px] !border-none !-top-[3px]"
        style={{ backgroundColor: meta.color }}
      />

      {/* ── Top Header of Namespace Card ── */}
      <div
        className="p-2.5 pb-2 border-b border-white/[0.06] relative"
        style={{
          borderTop: `3px solid ${meta.color}`,
          background: `linear-gradient(180deg, ${meta.color}15 0%, transparent 100%)`,
        }}
      >
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div
              className="w-6 h-6 rounded-[7px] flex items-center justify-center shrink-0 shadow-sm"
              style={{
                backgroundColor: `${meta.color}25`,
                border: `1px solid ${meta.color}50`,
                color: meta.color,
              }}
            >
              <IconComponent size={13} />
            </div>
            <div className="min-w-0 flex-1">
              <span
                className="text-[12px] font-bold text-[#F7FAFA] truncate block font-mono leading-none"
                title={namespace}
              >
                {namespace}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-[#82AEB5] bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06] shrink-0">
            {routes.length}
          </span>
        </div>

        <div className="mt-1 flex items-center justify-between text-[9.5px]">
          <span className="font-extrabold uppercase tracking-wider text-[#A5B0BA] truncate">
            {meta.title}
          </span>
          <span className="text-[#64748B] font-mono text-[9px] shrink-0">
            {routes.length} endpoints
          </span>
        </div>
      </div>

      {/* ── Subfamily Sections & Endpoint Rows ── */}
      <div className="p-1.5 space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar">
        {Object.entries(families).map(([familyName, familyRoutes]) => {
          const isCollapsed = !!collapsedSections[familyName];

          return (
            <div key={familyName} className="space-y-1">
              {/* Section Header */}
              <div
                onClick={(e) => toggleSection(familyName, e)}
                className="flex items-center justify-between px-1.5 py-0.5 text-[9.5px] font-semibold text-[#82AEB5] hover:text-[#F7FAFA] cursor-pointer rounded transition-colors"
              >
                <span className="tracking-wide uppercase text-[9px] font-bold text-[#94A3B8]">
                  {familyName}
                </span>
                {isCollapsed ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
              </div>

              {/* Endpoint Rows */}
              {!isCollapsed && (
                <div className="space-y-1">
                  {familyRoutes.map((route) => {
                    const isSelected = selectedRouteId === route.id;
                    const method = String(route.method || "GET").toUpperCase();
                    const cfg = METHOD_CONFIG[method] || METHOD_CONFIG.GET;

                    // Method Dimming logic: if filter is active and doesn't match, dim to 0.2
                    const matchesMethod =
                      !activeMethodFilter || activeMethodFilter === "all" || activeMethodFilter === method;

                    // Search Dimming logic
                    const q = String(searchQuery || "").toLowerCase();
                    const matchesSearch =
                      !searchQuery ||
                      String(route.path || "").toLowerCase().includes(q) ||
                      String(route.controller || "").toLowerCase().includes(q) ||
                      String(route.method || "").toLowerCase().includes(q);

                    const isRowDimmed = !matchesMethod || !matchesSearch;

                    return (
                      <div
                        key={route.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRoute(route);
                        }}
                        className={`group flex items-center justify-between gap-1 px-1.5 py-1 rounded-[7px] border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#142332] border-[#38BDF8] ring-1 ring-[#38BDF8] shadow-md"
                            : "bg-[#070F16]/90 border-white/[0.05] hover:border-white/[0.18] hover:bg-[#0B1A26]"
                        }`}
                        style={{
                          opacity: isRowDimmed ? 0.22 : 1,
                        }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span
                            className={`h-[15px] px-1 rounded-[3px] text-[8px] font-black shrink-0 flex items-center justify-center leading-none ${cfg.bg} ${cfg.text}`}
                          >
                            {method}
                          </span>
                          <span
                            className="text-[10px] font-mono text-[#F1F5F9] truncate font-medium group-hover:text-white"
                            title={route.path}
                          >
                            {route.path}
                          </span>
                        </div>
                        <ChevronRight
                          size={11}
                          className="text-[#64748B] group-hover:text-[#38BDF8] group-hover:translate-x-0.5 transition-transform shrink-0"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-[6px] !h-[6px] !border-none !-bottom-[3px]"
        style={{ backgroundColor: meta.color }}
      />
    </div>
  );
}

// ==========================================
// 3. EXECUTION CHAIN CHILD NODES (DRILL-DOWN)
// ==========================================
function ExecutionChainNode({
  data,
}: {
  data: {
    type: "controller" | "service" | "database";
    label: string;
    sublabel: string;
    icon: any;
    color: string;
  };
}) {
  const Icon = data.icon;
  return (
    <div
      className="relative w-[150px] rounded-[10px] p-2 bg-[#09141D] border text-left shadow-lg"
      style={{
        borderColor: `${data.color}50`,
        boxShadow: `0 4px 15px ${data.color}20`,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-[6px] !h-[6px] !border-none !-top-[3px]"
        style={{ backgroundColor: data.color }}
      />
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${data.color}20`, color: data.color }}
        >
          <Icon size={12} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold text-white truncate font-sans">{data.label}</div>
          <div className="text-[9px] text-[#82AEB5] truncate font-mono">{data.sublabel}</div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-[6px] !h-[6px] !border-none !-bottom-[3px]"
        style={{ backgroundColor: data.color }}
      />
    </div>
  );
}

const nodeTypes = {
  apiRootNode: ApiRootNode,
  namespaceGroupNode: NamespaceGroupNode,
  executionChainNode: ExecutionChainNode,
};

// ==========================================
// 4. MAIN INTERNAL COMPONENT WITH CANVAS & CONTROLS
// ==========================================
interface RouteGraphProps {
  result: any;
  externalSearchQuery?: string;
  isFullScreen?: boolean;
  fitViewTrigger?: number;
  fitRepoTrigger?: number;
  onOpenExecutionTrace?: (routeId: string) => void;
}

function RouteGraphCanvas({
  result,
  externalSearchQuery,
  isFullScreen,
  fitViewTrigger,
  fitRepoTrigger,
  onOpenExecutionTrace,
}: RouteGraphProps) {
  const reactFlow = useReactFlow();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMethodFilter, setActiveMethodFilter] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteItemData | null>(null);
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(70);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external search query
  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  // Handle Fit View trigger
  useEffect(() => {
    if (fitViewTrigger && fitViewTrigger > 0) {
      reactFlow.fitView({ duration: 300, padding: 0.2 });
    }
  }, [fitViewTrigger, reactFlow]);

  // Handle Fit Repository trigger
  useEffect(() => {
    if (fitRepoTrigger && fitRepoTrigger > 0) {
      setActiveMethodFilter(null);
      setSelectedNamespace(null);
      setSearchQuery("");
      reactFlow.fitView({ duration: 400, padding: 0.15 });
    }
  }, [fitRepoTrigger, reactFlow]);

  // Parse raw result routes into normalized items
  const allRoutes: RouteItemData[] = useMemo(() => {
    if (result?.routes && result.routes.length > 0) {
      return result.routes.map((r: any, idx: number) => {
        const controllerBasename = r.file ? r.file.split(/[\\/]/).pop() || r.file : (r.handler ? `${r.handler}.ts` : "AppController.ts");
        const hasAuth =
          r.middleware?.some((m: string) => /auth|protect|jwt|passport|login|session|require/i.test(m)) ||
          r.chain?.some((c: any) => /auth|protect|jwt|passport/i.test(c.name || c)) ||
          false;

        const accessesDB = (result?.metadata?.databaseInfo?.flows ?? []).some(
          (f: any) => f.route === r.path && f.method?.toUpperCase() === r.method?.toUpperCase()
        );

        const subfamily = categorizeEndpointFamily(r.path, r.method);

        return {
          id: `route:${r.method}:${r.path}-${idx}`,
          method: (r.method || "GET") as string,
          path: r.path,
          controller: controllerBasename,
          middleware: r.middleware || [],
          hasAuth,
          accessesDB,
          subfamily,
        };
      });
    }

    // If files are scanned, extract route files dynamically
    const routeFiles = (result?.files || []).filter((f: any) => {
      const p = (f.path || f).toLowerCase();
      return p.includes('route') || p.includes('api') || p.includes('endpoint');
    });

    if (routeFiles.length > 0) {
      return routeFiles.map((rf: any, idx: number) => {
        const p = rf.path || rf;
        const name = p.split(/[\\/]/).pop()?.replace(/\.[^/.]+$/, "") || "api";
        return {
          id: `route:GET:/${name}-${idx}`,
          method: "GET",
          path: `/${name.replace(/routes?$/i, "")}`,
          controller: p.split(/[\\/]/).pop() || `${name}.ts`,
          middleware: [],
          hasAuth: false,
          accessesDB: false,
          subfamily: "Core",
        };
      });
    }

    return [];
  }, [result]);

  // Group routes by top-level namespace domain
  const namespaceGroups = useMemo(() => {
    const groups: Record<string, RouteItemData[]> = {};

    allRoutes.forEach((route) => {
      const segments = route.path.split("/").filter(Boolean);
      let ns = "/";
      if (segments.length === 1) {
        ns = `/${segments[0]}`;
      } else if (segments.length > 1) {
        if (segments[0] === "api" || segments[0] === "v1" || segments[0] === "v2") {
          ns = `/${segments[1]}`;
        } else {
          ns = `/${segments[0]}`;
        }
      }
      if (!groups[ns]) groups[ns] = [];
      groups[ns].push(route);
    });

    return groups;
  }, [allRoutes]);

  const distinctServicesCount = useMemo(() => {
    const services = new Set<string>();
    allRoutes.forEach((r) => {
      if (r.controller) services.add(r.controller);
    });
    return Math.max(1, services.size);
  }, [allRoutes]);

  const sharedDepsCount = useMemo(() => {
    const extImports = new Set<string>();
    (result?.files || []).forEach((f: any) => {
      (f.externalImports || []).forEach((imp: string) => extImports.add(imp));
    });
    const frameworkDeps = Object.keys(result?.metadata?.frameworkMetadata?.dependencies || {}).length;
    return Math.max(extImports.size, frameworkDeps);
  }, [result]);

  // Build hierarchical layout for React Flow nodes & edges
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const groupKeys = Object.keys(namespaceGroups);
    const totalGroups = groupKeys.length;
    const totalEndpoints = allRoutes.length;

    // 1. API ROOT NODE (Top Center)
    const apiNodeId = "api-root";
    const groupSpacing = 185;
    const totalWidth = groupKeys.length * groupSpacing;
    const apiX = Math.max(100, (totalWidth - 210) / 2);
    const apiY = 25;

    nodes.push({
      id: apiNodeId,
      type: "apiRootNode",
      position: { x: apiX, y: apiY },
      data: { groupCount: totalGroups, endpointCount: totalEndpoints },
    });

    // 2. NAMESPACE GROUP NODES (Horizontal Row on Baseline Y = 135)
    const baselineY = 135;

    groupKeys.forEach((ns, index) => {
      const groupRoutes = namespaceGroups[ns];
      const meta = getNamespaceMeta(ns);
      const groupId = `group-${ns}`;

      // Organize by internal subfamilies
      const families: Record<string, RouteItemData[]> = {};
      groupRoutes.forEach((r) => {
        if (!families[r.subfamily]) families[r.subfamily] = [];
        families[r.subfamily].push(r);
      });

      const groupX = 30 + index * groupSpacing;

      nodes.push({
        id: groupId,
        type: "namespaceGroupNode",
        position: { x: groupX, y: baselineY },
        data: {
          namespace: ns,
          groupTitle: meta.title,
          icon: meta.icon,
          color: meta.color,
          families,
          totalEndpoints: groupRoutes.length,
          selectedRouteId: selectedRoute?.id,
          selectedNamespace: selectedNamespace,
          onSelectRoute: (route: any) => {
            setSelectedRoute((prev) => (prev?.id === route.id ? null : route));
            setSelectedNamespace(ns);
          },
          onSelectNamespace: (namespace: string) => {
            setSelectedNamespace((prev) => (prev === namespace ? null : namespace));
          },
          onOpenExecutionTrace: onOpenExecutionTrace,
          activeFilterMethod: activeMethodFilter,
        },
      });

      // Connect API Root -> Namespace Group
      edges.push({
        id: `edge-root-${ns}`,
        source: apiNodeId,
        target: groupId,
        type: "smoothstep",
        style: {
          stroke: meta.color,
          strokeWidth: selectedNamespace === ns ? 2.5 : 1.5,
          opacity: selectedNamespace && selectedNamespace !== ns ? 0.25 : 0.8,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 6,
          height: 6,
          color: meta.color,
        },
      });

      // 3. IF SELECTED ROUTE IS INSIDE THIS GROUP -> RENDER DRILL-DOWN CHAIN FROM REAL AST DATA
      if (selectedRoute && groupRoutes.some((r) => r.id === selectedRoute.id)) {
        const rawMatch = (result?.routes || []).find(
          (r: any) => r.path === selectedRoute.path && r.method?.toUpperCase() === selectedRoute.method?.toUpperCase()
        );

        const matchingDbFlow = (result?.metadata?.databaseInfo?.flows || []).find(
          (f: any) => f.route === selectedRoute.path && f.method?.toUpperCase() === selectedRoute.method?.toUpperCase()
        );

        const chainX = groupX - 10;
        let chainCurrentY = baselineY + 380;
        let lastChainNodeId = groupId;

        // Controller Handler Node
        const controllerNodeId = `chain-ctrl-${selectedRoute.id}`;
        nodes.push({
          id: controllerNodeId,
          type: "executionChainNode",
          position: { x: chainX, y: chainCurrentY },
          data: {
            type: "controller",
            label: selectedRoute.controller,
            sublabel: "Controller Handler",
            icon: Terminal,
            color: "#9B5CFF",
          },
        });

        edges.push({
          id: `edge-chain-ctrl-${selectedRoute.id}`,
          source: lastChainNodeId,
          target: controllerNodeId,
          type: "smoothstep",
          style: { stroke: "#9B5CFF", strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, width: 5, height: 5, color: "#9B5CFF" },
        });

        lastChainNodeId = controllerNodeId;
        chainCurrentY += 70;

        // Scanned Service Chains or Middleware
        const chainItems = rawMatch?.chain || [];
        if (chainItems.length > 0) {
          chainItems.slice(0, 2).forEach((cFile: string, cIdx: number) => {
            const srvName = cFile.split(/[\\/]/).pop()?.replace(/\.[^/.]+$/, "") || cFile;
            const serviceNodeId = `chain-srv-${cIdx}-${selectedRoute.id}`;
            nodes.push({
              id: serviceNodeId,
              type: "executionChainNode",
              position: { x: chainX, y: chainCurrentY },
              data: {
                type: "service",
                label: srvName,
                sublabel: "Business Logic",
                icon: Zap,
                color: "#F5B800",
              },
            });

            edges.push({
              id: `edge-chain-srv-${cIdx}-${selectedRoute.id}`,
              source: lastChainNodeId,
              target: serviceNodeId,
              type: "smoothstep",
              style: { stroke: "#F5B800", strokeWidth: 1.5 },
              markerEnd: { type: MarkerType.ArrowClosed, width: 5, height: 5, color: "#F5B800" },
            });

            lastChainNodeId = serviceNodeId;
            chainCurrentY += 70;
          });
        }

        // Real Database entity node if matched from DB flows or metadata
        const dbTableLabel = matchingDbFlow?.entities?.[0] || result?.metadata?.databaseInfo?.type || `${ns.replace("/", "") || "data"}_store`;
        const dbNodeId = `chain-db-${selectedRoute.id}`;
        nodes.push({
          id: dbNodeId,
          type: "executionChainNode",
          position: { x: chainX, y: chainCurrentY },
          data: {
            type: "database",
            label: dbTableLabel,
            sublabel: matchingDbFlow ? "Database Flow Entity" : "Database Persistence",
            icon: Database,
            color: "#FF4D5E",
          },
        });

        edges.push({
          id: `edge-chain-db-${selectedRoute.id}`,
          source: lastChainNodeId,
          target: dbNodeId,
          type: "smoothstep",
          style: { stroke: "#FF4D5E", strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, width: 5, height: 5, color: "#FF4D5E" },
        });
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [namespaceGroups, allRoutes, selectedNamespace, selectedRoute, activeMethodFilter, result]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state cleanly with ref guards
  const lastNodesKey = useRef("");
  const lastEdgesKey = useRef("");

  useEffect(() => {
    const key = initialNodes
      .map((n) => `${n.id}:${n.position.x}:${n.position.y}:${selectedRoute?.id}:${selectedNamespace}`)
      .join("|");
    if (key !== lastNodesKey.current) {
      lastNodesKey.current = key;
      setNodes(initialNodes);
    }
  }, [initialNodes, selectedRoute, selectedNamespace, setNodes]);

  useEffect(() => {
    const key = initialEdges.map((e) => `${e.id}:${e.source}:${e.target}`).join("|");
    if (key !== lastEdgesKey.current) {
      lastEdgesKey.current = key;
      setEdges(initialEdges);
    }
  }, [initialEdges, setEdges]);

  // Auto Layout trigger
  const handleAutoLayout = useCallback(() => {
    reactFlow.fitView({ padding: 0.15, duration: 600 });
  }, [reactFlow]);

  // Zoom controls
  const handleZoomIn = () => {
    reactFlow.zoomIn({ duration: 300 });
    setZoomLevel((prev) => Math.min(prev + 10, 150));
  };

  const handleZoomOut = () => {
    reactFlow.zoomOut({ duration: 300 });
    setZoomLevel((prev) => Math.max(prev - 10, 30));
  };

  const handleCopyRoute = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      ref={containerRef}
      className={`h-full w-full relative bg-[#040C12] text-left select-none overflow-hidden ${
        isFullscreen ? "fixed inset-0 z-50 bg-[#040C12]" : ""
      }`}
    >
      {/* ── TOP HEADER CONTROL BAR ────────────────────────────────────── */}
      <div className="absolute top-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-[#08151E]/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/[0.08] shadow-2xl">
        {/* Left: Title & Subtitle */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-[#16C7A1]/15 border border-[#16C7A1]/30 flex items-center justify-center text-[#16C7A1] shrink-0">
            <RouteIcon size={17} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-[#F7FAFA] leading-tight flex items-center gap-2">
              Route Endpoint Graph
            </h2>
            <p className="text-[11px] text-[#82AEB5] leading-none mt-0.5">
              Visualize your API routes, handlers and service dependencies
            </p>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="relative flex-1 max-w-sm min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#82AEB5]" />
          <input
            type="text"
            placeholder="Search endpoints, services, or paths..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-12 py-1.5 text-xs font-mono bg-[#050E14] border border-white/[0.08] rounded-xl text-[#F7FAFA] placeholder-[#82AEB5] focus:outline-none focus:border-[#16C7A1] transition-colors"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X size={12} />
            </button>
          ) : (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9.5px] font-mono px-1 py-0.2 rounded bg-white/[0.05] border border-white/[0.08] text-[#82AEB5]">
              ⌘ K
            </span>
          )}
        </div>

        {/* Right: Controls & Method Filters */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Group By Dropdown */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-[#050E14] border border-white/[0.08] rounded-xl text-[11px] text-[#82AEB5]">
            <span className="text-[10px] text-[#64748B]">Group by</span>
            <span className="font-semibold text-white">Route Namespace</span>
            <ChevronDown size={11} className="text-[#82AEB5]" />
          </div>

          {/* Show Dropdown */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#050E14] border border-white/[0.08] rounded-xl text-[11px] text-[#82AEB5]">
            <span className="text-[10px] text-[#64748B]">Show</span>
            <span className="font-semibold text-white">
              {activeMethodFilter ? activeMethodFilter : "All Methods"}
            </span>
            <ChevronDown size={11} className="text-[#82AEB5]" />
          </div>

          {/* Method Filter Pills */}
          <div className="flex items-center gap-1 bg-[#050E14] p-1 rounded-xl border border-white/[0.08]">
            {(["GET", "POST", "PUT", "DELETE", "PATCH"] as const).map((method) => {
              const cfg = METHOD_CONFIG[method];
              const isActive = activeMethodFilter === method;

              return (
                <button
                  key={method}
                  onClick={() => setActiveMethodFilter((prev) => (prev === method ? null : method))}
                  className={`h-[22px] px-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    isActive
                      ? `${cfg.bg} ${cfg.text} shadow-sm scale-105`
                      : "text-[#82AEB5] hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: cfg.pillColor }}
                  />
                  {method}
                </button>
              );
            })}
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="w-8 h-8 rounded-xl bg-[#050E14] border border-white/[0.08] text-[#82AEB5] hover:text-white hover:border-white/[0.2] flex items-center justify-center transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* ── MAIN REACT FLOW CANVAS ────────────────────────────────────── */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgba(22, 199, 161, 0.04)" gap={22} size={1} />
      </ReactFlow>

      {/* ── BOTTOM-LEFT COMPACT STATUS METRICS ────────────────────────── */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-4 bg-[#08151E]/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/[0.08] shadow-2xl text-[11px]">
        <div className="flex items-center gap-2">
          <Boxes size={14} className="text-[#16C7A1]" />
          <div>
            <span className="font-bold text-[#F7FAFA]">{Object.keys(namespaceGroups).length}</span>{" "}
            <span className="text-[#82AEB5]">Route Groups</span>
          </div>
        </div>

        <div className="w-px h-3.5 bg-white/[0.1]" />

        <div className="flex items-center gap-2">
          <RouteIcon size={14} className="text-[#3288F5]" />
          <div>
            <span className="font-bold text-[#F7FAFA]">{allRoutes.length}</span>{" "}
            <span className="text-[#82AEB5]">Endpoints</span>
          </div>
        </div>

        <div className="w-px h-3.5 bg-white/[0.1]" />

        <div className="flex items-center gap-2">
          <Zap size={14} className="text-[#F5B800]" />
          <div>
            <span className="font-bold text-[#F7FAFA]">{distinctServicesCount}</span>{" "}
            <span className="text-[#82AEB5]">Services</span>
          </div>
        </div>

        <div className="w-px h-3.5 bg-white/[0.1]" />

        <div className="flex items-center gap-2">
          <Network size={14} className="text-[#00B8D9]" />
          <div>
            <span className="font-bold text-[#F7FAFA]">{sharedDepsCount}</span>{" "}
            <span className="text-[#82AEB5]">Shared Dependencies</span>
          </div>
        </div>
      </div>

      {/* ── BOTTOM-RIGHT TOOLBAR (ZOOM + AUTOLAYOUT + MINIMAP) ─────────── */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-3">
        {/* ReactFlow Minimap */}
        <div className="hidden md:block w-36 h-20 rounded-xl overflow-hidden border border-white/[0.08] bg-[#050E14]/90 shadow-xl">
          <MiniMap
            nodeStrokeWidth={2}
            zoomable
            pannable
            className="!w-full !h-full !m-0 !bg-transparent"
            nodeColor={(n) => {
              if (n.type === "apiRootNode") return "#16C7A1";
              if (n.type === "executionChainNode") return "#9B5CFF";
              return "#3288F5";
            }}
            maskColor="rgba(4, 12, 18, 0.75)"
          />
        </div>

        {/* Compact Toolbar */}
        <div className="flex items-center gap-1.5 bg-[#08151E]/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/[0.08] shadow-2xl">
          <button
            onClick={handleZoomOut}
            className="w-7 h-7 rounded-xl bg-[#050E14] border border-white/[0.08] text-[#82AEB5] hover:text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
          >
            −
          </button>
          <span className="px-2 text-[11px] font-mono font-bold text-[#F7FAFA]">
            {zoomLevel}%
          </span>
          <button
            onClick={handleZoomIn}
            className="w-7 h-7 rounded-xl bg-[#050E14] border border-white/[0.08] text-[#82AEB5] hover:text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
          >
            +
          </button>

          <div className="w-px h-4 bg-white/[0.1] mx-0.5" />

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="w-7 h-7 rounded-xl bg-[#050E14] border border-white/[0.08] text-[#82AEB5] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Toggle fullscreen"
          >
            <Maximize2 size={12} />
          </button>

          <button
            onClick={handleAutoLayout}
            className="h-7 px-3 rounded-xl bg-[#16C7A1]/15 hover:bg-[#16C7A1]/25 border border-[#16C7A1]/40 text-[#16C7A1] font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Sparkles size={12} />
            <span>Auto Layout</span>
          </button>
        </div>
      </div>

      {/* ── RIGHT-SIDE ENDPOINT INSPECTOR DRAWER ─────────────────────── */}
      <AnimatePresence>
        {selectedRoute && (
          <motion.div
            initial={{ opacity: 0, x: 320 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 320 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-16 right-4 bottom-16 w-80 bg-[#08151E]/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl shadow-2xl p-4.5 z-30 flex flex-col justify-between overflow-y-auto text-left"
          >
            <div>
              {/* Header with close button */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-5 px-2 rounded text-[10px] font-black flex items-center justify-center ${
                      METHOD_CONFIG[selectedRoute.method.toUpperCase()]?.bg || "bg-emerald-500"
                    } ${
                      METHOD_CONFIG[selectedRoute.method.toUpperCase()]?.text || "text-black"
                    }`}
                  >
                    {selectedRoute.method}
                  </span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Endpoint Detail
                  </span>
                </div>
                <button
                  onClick={() => setSelectedRoute(null)}
                  className="w-6 h-6 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Endpoint Path & Copy */}
              <div className="mt-3.5 p-2.5 rounded-xl bg-[#050E14] border border-white/[0.06] flex items-center justify-between gap-2">
                <span className="text-[12px] font-mono text-[#16C7A1] font-bold truncate">
                  {selectedRoute.path}
                </span>
                <button
                  onClick={() => handleCopyRoute(selectedRoute.path)}
                  className="text-zinc-400 hover:text-white p-1"
                  title="Copy path"
                >
                  {copied ? <Check size={13} className="text-[#16C7A1]" /> : <Copy size={13} />}
                </button>
              </div>

              {/* Core Information Grid */}
              <div className="mt-4 space-y-3 text-[11px]">
                <div>
                  <span className="text-[#64748B] text-[10px] uppercase font-bold tracking-wider block mb-1">
                    SOURCE CONTROLLER
                  </span>
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#050E14] border border-white/[0.06] text-[#F7FAFA]">
                    <FileCode size={13} className="text-[#9B5CFF] shrink-0" />
                    <span className="truncate font-mono">{selectedRoute.controller}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[#64748B] text-[10px] uppercase font-bold tracking-wider block mb-1">
                    AUTHENTICATION STATUS
                  </span>
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#050E14] border border-white/[0.06]">
                    {selectedRoute.hasAuth ? (
                      <span className="text-[#16C7A1] flex items-center gap-1.5 font-semibold">
                        <Shield size={13} />
                        Protected (Auth Middleware)
                      </span>
                    ) : (
                      <span className="text-[#F5B800] flex items-center gap-1.5 font-semibold">
                        <AlertTriangle size={13} />
                        Unprotected Endpoint
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[#64748B] text-[10px] uppercase font-bold tracking-wider block mb-1">
                    DATABASE FLOW
                  </span>
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#050E14] border border-white/[0.06] text-[#F7FAFA]">
                    <Database size={13} className="text-[#00B8D9] shrink-0" />
                    <span>
                      {selectedRoute.accessesDB ? "Queries Database Tables" : "No Direct DB Access"}
                    </span>
                  </div>
                </div>

                {selectedRoute.middleware.length > 0 && (
                  <div>
                    <span className="text-[#64748B] text-[10px] uppercase font-bold tracking-wider block mb-1">
                      MIDDLEWARE CHAIN
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedRoute.middleware.map((m, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-[10px] font-mono text-[#82AEB5]"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-white/[0.08] mt-4 space-y-2">
              <button
                onClick={() => {
                  if (onOpenExecutionTrace) {
                    onOpenExecutionTrace(selectedRoute.id);
                  }
                }}
                className="w-full py-2 rounded-xl bg-[#16C7A1] hover:bg-[#13b390] text-[#050E14] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-[#16C7A1]/20"
              >
                <Zap size={14} />
                <span>View Full Execution Trace</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RouteGraph({
  result,
  externalSearchQuery,
  isFullScreen,
  fitViewTrigger,
  fitRepoTrigger,
  onOpenExecutionTrace,
}: {
  result: any;
  externalSearchQuery?: string;
  isFullScreen?: boolean;
  fitViewTrigger?: number;
  fitRepoTrigger?: number;
  onOpenExecutionTrace?: (routeId: string) => void;
}) {
  return (
    <ReactFlowProvider>
      <RouteGraphCanvas
        result={result}
        externalSearchQuery={externalSearchQuery}
        isFullScreen={isFullScreen}
        fitViewTrigger={fitViewTrigger}
        fitRepoTrigger={fitRepoTrigger}
        onOpenExecutionTrace={onOpenExecutionTrace}
      />
    </ReactFlowProvider>
  );
}

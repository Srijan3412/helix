"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
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
  Package,
  FileCode,
  CheckSquare,
  Square,
  Search,
  X,
  Copy,
  Check,
  Sparkles,
  Layers,
  Database,
  Shield,
  Palette,
  Wrench,
  Globe,
  Cpu,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Terminal,
  Code2,
  Box,
} from "lucide-react";

// ==========================================
// 1. PACKAGE CATEGORIZATION & METADATA
// ==========================================
export type PackageCategory =
  | "Framework"
  | "UI & Styling"
  | "Database & ORM"
  | "Auth & Security"
  | "State & Network"
  | "Dev & Tooling"
  | "Utility";

interface CategoryMeta {
  label: PackageCategory;
  color: string;
  bg: string;
  border: string;
  icon: any;
}

const CATEGORY_MAP: Record<PackageCategory, CategoryMeta> = {
  Framework: {
    label: "Framework",
    color: "#16C7A3",
    bg: "rgba(22, 199, 163, 0.15)",
    border: "rgba(22, 199, 163, 0.4)",
    icon: Sparkles,
  },
  "UI & Styling": {
    label: "UI & Styling",
    color: "#3288F5",
    bg: "rgba(50, 136, 245, 0.15)",
    border: "rgba(50, 136, 245, 0.4)",
    icon: Palette,
  },
  "Database & ORM": {
    label: "Database & ORM",
    color: "#8B5CF6",
    bg: "rgba(139, 92, 246, 0.15)",
    border: "rgba(139, 92, 246, 0.4)",
    icon: Database,
  },
  "Auth & Security": {
    label: "Auth & Security",
    color: "#FF4D5E",
    bg: "rgba(255, 77, 94, 0.15)",
    border: "rgba(255, 77, 94, 0.4)",
    icon: Shield,
  },
  "State & Network": {
    label: "State & Network",
    color: "#F5A623",
    bg: "rgba(245, 166, 35, 0.15)",
    border: "rgba(245, 166, 35, 0.4)",
    icon: Globe,
  },
  "Dev & Tooling": {
    label: "Dev & Tooling",
    color: "#64748B",
    bg: "rgba(100, 116, 139, 0.15)",
    border: "rgba(100, 116, 139, 0.4)",
    icon: Wrench,
  },
  Utility: {
    label: "Utility",
    color: "#00B8D9",
    bg: "rgba(0, 184, 217, 0.15)",
    border: "rgba(0, 184, 217, 0.4)",
    icon: Layers,
  },
};

function categorizePackage(name: string, isDev: boolean): PackageCategory {
  const lower = name.toLowerCase();

  if (
    lower === "next" ||
    lower === "react" ||
    lower === "react-dom" ||
    lower === "vue" ||
    lower === "express" ||
    lower === "nest" ||
    lower.startsWith("@nestjs/") ||
    lower === "fastify" ||
    lower === "koa" ||
    lower === "hono" ||
    lower === "svelte" ||
    lower === "astro" ||
    lower === "nuxt"
  ) {
    return "Framework";
  }

  if (
    lower.includes("tailwind") ||
    lower.includes("lucide") ||
    lower.includes("framer-motion") ||
    lower.includes("radix-ui") ||
    lower.includes("shadcn") ||
    lower.includes("xyflow") ||
    lower.includes("reactflow") ||
    lower.includes("chakra") ||
    lower.includes("material") ||
    lower.includes("mui") ||
    lower.includes("styled") ||
    lower.includes("emotion") ||
    lower.includes("font") ||
    lower.includes("icon") ||
    lower.includes("canvas") ||
    lower.includes("three") ||
    lower.includes("d3")
  ) {
    return "UI & Styling";
  }

  if (
    lower.includes("prisma") ||
    lower.includes("mongoose") ||
    lower.includes("typeorm") ||
    lower.includes("drizzle") ||
    lower.includes("sequelize") ||
    lower.includes("pg") ||
    lower.includes("mysql") ||
    lower.includes("redis") ||
    lower.includes("ioredis") ||
    lower.includes("sqlite") ||
    lower.includes("knex") ||
    lower.includes("supabase") ||
    lower.includes("firebase") ||
    lower.includes("mongo")
  ) {
    return "Database & ORM";
  }

  if (
    lower.includes("auth") ||
    lower.includes("jwt") ||
    lower.includes("token") ||
    lower.includes("bcrypt") ||
    lower.includes("crypto") ||
    lower.includes("passport") ||
    lower.includes("helmet") ||
    lower.includes("cors") ||
    lower.includes("permission")
  ) {
    return "Auth & Security";
  }

  if (
    lower.includes("tanstack") ||
    lower.includes("query") ||
    lower.includes("zustand") ||
    lower.includes("redux") ||
    lower.includes("mobx") ||
    lower.includes("axios") ||
    lower.includes("swr") ||
    lower.includes("apollo") ||
    lower.includes("trpc") ||
    lower.includes("socket.io") ||
    lower.includes("fetch")
  ) {
    return "State & Network";
  }

  if (
    isDev ||
    lower.startsWith("@types/") ||
    lower.includes("typescript") ||
    lower.includes("eslint") ||
    lower.includes("prettier") ||
    lower.includes("jest") ||
    lower.includes("vitest") ||
    lower.includes("cypress") ||
    lower.includes("playwright") ||
    lower.includes("webpack") ||
    lower.includes("vite") ||
    lower.includes("rollup") ||
    lower.includes("turbo") ||
    lower.includes("ts-node") ||
    lower.includes("nodemon") ||
    lower.includes("babel")
  ) {
    return "Dev & Tooling";
  }

  return "Utility";
}

// ==========================================
// 2. CUSTOM REACT FLOW NODES
// ==========================================

// --- Compact File Node Component (130px × 54px) ---
interface CompactFileNodeData {
  id: string;
  name: string;
  path: string;
  importCount: number;
  isSelected?: boolean;
  isDimmed?: boolean;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
}

function CompactFileNode({ data }: { data: CompactFileNodeData }) {
  const isSelected = data.isSelected;
  const isDimmed = data.isDimmed;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        data.onSelect?.(data.id);
      }}
      onMouseEnter={() => data.onHover?.(data.id)}
      onMouseLeave={() => data.onHover?.(null)}
      className="group relative w-[130px] min-h-[52px] rounded-[10px] px-2.5 py-2 text-left transition-all duration-150 select-none cursor-pointer"
      style={{
        opacity: isDimmed ? 0.22 : 1,
        backgroundColor: "#0C141E",
        border: isSelected ? "1.5px solid #3288F5" : "1px solid #1E2D42",
        boxShadow: isSelected
          ? "0 0 16px rgba(50, 136, 245, 0.45)"
          : "0 2px 8px rgba(0, 0, 0, 0.3)",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-[6px] !h-[6px] !rounded-full !bg-[#07090C] !border !border-[#3288F5] !-top-[3px] opacity-40 group-hover:opacity-100"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-[6px] !h-[6px] !rounded-full !bg-[#07090C] !border !border-[#3288F5] !-bottom-[3px] opacity-40 group-hover:opacity-100"
      />

      <div className="flex items-center gap-1.5">
        <FileCode size={13} className="text-[#3288F5] shrink-0" />
        <span
          className="text-[11px] font-bold font-mono text-[#F4F7F7] truncate max-w-[90px] leading-tight"
          title={data.path || data.name}
        >
          {data.name}
        </span>
      </div>

      <div className="text-[9.5px] text-[#82AEB5] mt-1 pl-[17px] font-medium leading-none flex items-center justify-between">
        <span>{data.importCount} imports</span>
      </div>
    </div>
  );
}

// --- Compact Package Node Component (136px × 60px) ---
interface CompactPackageNodeData {
  id: string;
  name: string;
  version?: string;
  packageType: "dependency" | "devDependency";
  category: PackageCategory;
  usedByFiles: number;
  isFramework?: boolean;
  isSelected?: boolean;
  isDimmed?: boolean;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
}

function CompactPackageNode({ data }: { data: CompactPackageNodeData }) {
  const isDev = data.packageType === "devDependency";
  const isSelected = data.isSelected;
  const isDimmed = data.isDimmed;
  const catMeta = CATEGORY_MAP[data.category] || CATEGORY_MAP.Utility;
  const IconComponent = catMeta.icon;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        data.onSelect?.(data.id);
      }}
      onMouseEnter={() => data.onHover?.(data.id)}
      onMouseLeave={() => data.onHover?.(null)}
      className="group relative w-[136px] min-h-[58px] rounded-[10px] px-2.5 py-2 text-left transition-all duration-150 select-none cursor-pointer"
      style={{
        opacity: isDimmed ? 0.22 : 1,
        backgroundColor: "#0B1522",
        border: isSelected
          ? "1.5px solid #16C7A3"
          : isDev
          ? "1px dashed #2C3E55"
          : `1px solid ${catMeta.border}`,
        boxShadow: isSelected
          ? "0 0 16px rgba(22, 199, 163, 0.45)"
          : data.isFramework
          ? "0 0 12px rgba(22, 199, 163, 0.2)"
          : "0 2px 8px rgba(0, 0, 0, 0.3)",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-[6px] !h-[6px] !rounded-full !bg-[#07090C] !border !border-[#16C7A3] !-top-[3px] opacity-40 group-hover:opacity-100"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-[6px] !h-[6px] !rounded-full !bg-[#07090C] !border !border-[#16C7A3] !-bottom-[3px] opacity-40 group-hover:opacity-100"
      />

      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <IconComponent
            size={12}
            className="shrink-0"
            style={{ color: catMeta.color }}
          />
          <span
            className="text-[11.5px] font-bold font-mono text-[#F4F7F7] truncate max-w-[85px] leading-tight"
            title={data.name}
          >
            {data.name}
          </span>
        </div>
        {data.version && (
          <span className="text-[9px] font-mono text-[#82AEB5] shrink-0 truncate max-w-[34px]" title={data.version}>
            {data.version.replace(/^[\^~]/, "")}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-1.5 pl-[16px] text-[9px] text-[#82AEB5] font-mono leading-none">
        <span>{data.usedByFiles} files</span>
        <span
          className="uppercase px-1 py-0.2 rounded font-semibold text-[8px]"
          style={{
            backgroundColor: isDev ? "rgba(100, 116, 139, 0.2)" : "rgba(22, 199, 163, 0.2)",
            color: isDev ? "#94A3B8" : "#16C7A3",
          }}
        >
          {isDev ? "dev" : "prod"}
        </span>
      </div>
    </div>
  );
}

const nodeTypes = {
  fileNode: CompactFileNode,
  packageNode: CompactPackageNode,
};

// ==========================================
// 3. TYPES & DATA STRUCTURES
// ==========================================
interface RawPackageItem {
  id: string;
  name: string;
  version: string;
  type: "dependency" | "devDependency";
  category: PackageCategory;
  isFramework?: boolean;
  usedBy: string[];
}

interface RawFileItem {
  id: string;
  name: string;
  path: string;
  imports: string[];
  rawImports: string[];
}

// ==========================================
// 4. MAIN INTERNAL COMPONENT
// ==========================================
function PackageGraphInternal({
  result,
  externalSearchQuery,
  isFullScreen,
  fitViewTrigger,
  fitRepoTrigger,
}: {
  result: any;
  externalSearchQuery?: string;
  isFullScreen?: boolean;
  fitViewTrigger?: number;
  fitRepoTrigger?: number;
}) {
  const [showDevDeps, setShowDevDeps] = useState(true);
  const [showProdDeps, setShowProdDeps] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const reactFlow = useReactFlow();

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
      setShowDevDeps(true);
      setShowProdDeps(true);
      setSelectedCategory(null);
      setSearchQuery("");
      setSelectedNodeId(null);
      reactFlow.fitView({ duration: 400, padding: 0.15 });
    }
  }, [fitRepoTrigger, reactFlow]);

  // Extract Backend Framework & Runtime Metadata
  const frameworkMeta = useMemo(() => {
    const fwMeta =
      result?.metadata?.frameworkMetadata ||
      result?.frameworkMetadata ||
      result?.manifest ||
      {};
    const frameworks: Array<{ name: string; confidence?: number }> =
      fwMeta.frameworks || result?.frameworks || result?.metadata?.framework ? [result.metadata.framework] : [];
    const packageManager = fwMeta.packageManager || "npm";
    const runtime = fwMeta.runtime || "Node.js";
    const monorepo = !!fwMeta.monorepo;
    const language = fwMeta.language || result?.metadata?.primaryLanguage || "TypeScript";

    return {
      frameworks,
      packageManager,
      runtime,
      monorepo,
      language,
    };
  }, [result]);

  // Map package metadata from scan results dynamically
  const packageNodes: RawPackageItem[] = useMemo(() => {
    const fwMeta =
      result?.metadata?.frameworkMetadata ||
      result?.frameworkMetadata ||
      result?.manifest ||
      {};
    const deps: Record<string, string> =
      fwMeta.dependencies ||
      result?.dependencies_map ||
      result?.packageJson?.dependencies ||
      {};
    const devDeps: Record<string, string> =
      fwMeta.devDependencies ||
      result?.packageJson?.devDependencies ||
      {};
    const seenNames = new Set<string>();

    // Detect known primary framework names
    const detectedFrameworkNames = new Set(
      (frameworkMeta.frameworks || []).map((f) => String(f.name || f).toLowerCase())
    );

    const prodList: RawPackageItem[] = Object.entries(deps).map(([name, ver]) => {
      seenNames.add(name);
      const isFw =
        detectedFrameworkNames.has(name.toLowerCase()) ||
        name.toLowerCase() === "next" ||
        name.toLowerCase() === "react" ||
        name.toLowerCase() === "express";
      return {
        id: name,
        name,
        version: String(ver),
        type: "dependency" as const,
        category: categorizePackage(name, false),
        isFramework: isFw,
        usedBy: [] as string[],
      };
    });

    const devList: RawPackageItem[] = Object.entries(devDeps).map(([name, ver]) => {
      seenNames.add(name);
      return {
        id: name,
        name,
        version: String(ver),
        type: "devDependency" as const,
        category: categorizePackage(name, true),
        isFramework: false,
        usedBy: [] as string[],
      };
    });

    // Extract any additional packages in result.dependencies array from AST
    if (Array.isArray(result?.dependencies)) {
      result.dependencies.forEach((d: any) => {
        const pkgName = typeof d === "string" ? d : d?.name || d?.target;
        if (pkgName && !seenNames.has(pkgName) && !pkgName.startsWith(".") && !pkgName.startsWith("/")) {
          seenNames.add(pkgName);
          const isDev = typeof d === "object" && d?.type === "devDependency";
          prodList.push({
            id: pkgName,
            name: pkgName,
            version: typeof d === "object" && d?.version ? String(d.version) : "*",
            type: isDev ? "devDependency" : "dependency",
            category: categorizePackage(pkgName, isDev),
            isFramework: detectedFrameworkNames.has(pkgName.toLowerCase()),
            usedBy: [],
          });
        }
      });
    }

    // Extract packages from files' external imports so every real package is represented
    (result?.files || []).forEach((f: any) => {
      (f.externalImports || []).forEach((imp: string) => {
        const cleanPkg = imp.startsWith("@") ? imp.split("/").slice(0, 2).join("/") : imp.split("/")[0];
        if (cleanPkg && !seenNames.has(cleanPkg) && !cleanPkg.startsWith(".") && !cleanPkg.startsWith("/")) {
          seenNames.add(cleanPkg);
          prodList.push({
            id: cleanPkg,
            name: cleanPkg,
            version: "*",
            type: "dependency",
            category: categorizePackage(cleanPkg, false),
            isFramework: detectedFrameworkNames.has(cleanPkg.toLowerCase()),
            usedBy: [],
          });
        }
      });
    });

    return [...prodList, ...devList];
  }, [result, frameworkMeta]);

  // Map file structures and their parsed imports dynamically
  const fileNodes: RawFileItem[] = useMemo(() => {
    const files = result?.files || [];
    return files
      .filter(
        (f: any) =>
          !f.path.startsWith("ROUTE:") &&
          !f.path.startsWith("ENV:") &&
          !f.path.startsWith("DB:") &&
          !f.path.startsWith("ENTITY:")
      )
      .map((f: any) => {
        const rawImports: string[] = f.externalImports || [];
        const imports = rawImports
          .map((imp: string) =>
            imp.startsWith("@") ? imp.split("/").slice(0, 2).join("/") : imp.split("/")[0]
          )
          .filter(Boolean);

        return {
          id: f.path,
          name: f.path.split(/[\\/]/).pop() || f.path,
          path: f.path,
          imports,
          rawImports,
        };
      });
  }, [result]);

  // Filter packages based on checkboxes, search query & category pills
  const filteredPackages: RawPackageItem[] = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return packageNodes.filter((p: RawPackageItem) => {
      if (p.type === "dependency" && !showProdDeps) return false;
      if (p.type === "devDependency" && !showDevDeps) return false;
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (query && !p.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [packageNodes, showProdDeps, showDevDeps, selectedCategory, searchQuery]);

  // Generate Deterministic Grid Layout with Multi-Tier Columns
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const seenNodeIds = new Set<string>();

    const query = searchQuery.trim().toLowerCase();

    // Top Row: Files that import the filtered packages
    const topImporters = fileNodes
      .filter((f: RawFileItem) => {
        const matchesPkg = f.imports.some((imp) =>
          filteredPackages.some((p) => p.id === imp)
        );
        if (query) {
          return matchesPkg || f.name.toLowerCase().includes(query) || f.path.toLowerCase().includes(query);
        }
        return matchesPkg;
      })
      .sort((a: RawFileItem, b: RawFileItem) => b.imports.length - a.imports.length)
      .slice(0, 48); // Cap to 48 prominent importers for optimum performance

    const colWidth = 150;
    const fileRowHeight = 75;
    const filesPerRow = Math.max(4, Math.min(12, Math.ceil(Math.sqrt(topImporters.length * 2))));

    // Place files in structured rows
    topImporters.forEach((file: RawFileItem, i: number) => {
      const row = Math.floor(i / filesPerRow);
      const col = i % filesPerRow;
      const x = 60 + col * colWidth;
      const y = 80 + row * fileRowHeight;

      nodes.push({
        id: `file-${file.id}`,
        type: "fileNode",
        position: { x, y },
        data: {
          id: `file-${file.id}`,
          name: file.name,
          path: file.path,
          importCount: file.imports.length,
          onSelect: (id: string) => setSelectedNodeId((prev) => (prev === id ? null : id)),
          onHover: (id: string | null) => setHoveredNodeId(id),
        },
      });

      // Connections to packages
      file.imports.forEach((importId: string) => {
        if (filteredPackages.some((p: RawPackageItem) => p.id === importId)) {
          edges.push({
            id: `edge-${file.id}-${importId}`,
            source: `file-${file.id}`,
            target: importId,
            type: "smoothstep",
            style: { stroke: "#3288F5", strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, width: 7, height: 7, color: "#3288F5" },
          });
        }
      });
    });

    // Lower Tier: Packages
    const fileRowsCount = Math.ceil(topImporters.length / filesPerRow) || 1;
    const packageStartY = 80 + fileRowsCount * fileRowHeight + 110;
    const pkgColWidth = 155;
    const pkgRowHeight = 80;
    const pkgsPerRow = Math.max(4, Math.min(12, Math.ceil(Math.sqrt(filteredPackages.length * 2))));

    filteredPackages.forEach((pkg: RawPackageItem, i: number) => {
      const packageId = pkg.id;

      if (!seenNodeIds.has(packageId)) {
        seenNodeIds.add(packageId);

        const row = Math.floor(i / pkgsPerRow);
        const col = i % pkgsPerRow;
        const x = 60 + col * pkgColWidth;
        const y = packageStartY + row * pkgRowHeight;

        const usedByFiles = fileNodes.filter((f: RawFileItem) => f.imports.includes(pkg.id)).length;

        nodes.push({
          id: packageId,
          type: "packageNode",
          position: { x, y },
          data: {
            id: packageId,
            name: pkg.name,
            version: pkg.version,
            packageType: pkg.type,
            category: pkg.category,
            isFramework: pkg.isFramework,
            usedByFiles,
            onSelect: (id: string) => setSelectedNodeId((prev) => (prev === id ? null : id)),
            onHover: (id: string | null) => setHoveredNodeId(id),
          },
        });
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [filteredPackages, fileNodes, searchQuery]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Synchronization guards
  const lastSyncedNodeIds = useRef<string>("");
  const lastSyncedEdgeIds = useRef<string>("");

  useEffect(() => {
    const newIds = initialNodes.map((n) => n.id).join(",");
    if (newIds !== lastSyncedNodeIds.current) {
      lastSyncedNodeIds.current = newIds;
      setNodes(initialNodes);
    }
  }, [initialNodes, setNodes]);

  useEffect(() => {
    const newIds = initialEdges.map((e) => e.id).join(",");
    if (newIds !== lastSyncedEdgeIds.current) {
      lastSyncedEdgeIds.current = newIds;
      setEdges(initialEdges);
    }
  }, [initialEdges, setEdges]);

  // Interactive edge & node visibility based on hover / selection
  const activeFocusId = selectedNodeId || hoveredNodeId;

  const displayEdges = useMemo(() => {
    return edges.map((edge) => {
      const isConnected =
        activeFocusId && (edge.source === activeFocusId || edge.target === activeFocusId);

      if (isConnected) {
        return {
          ...edge,
          style: {
            stroke: "#16C7A3",
            strokeWidth: 2,
            opacity: 1,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 8,
            height: 8,
            color: "#16C7A3",
          },
        };
      }

      return {
        ...edge,
        style: {
          stroke: "rgba(255, 255, 255, 0.08)",
          strokeWidth: 1,
          opacity: 0,
        },
        markerEnd: undefined,
      };
    });
  }, [edges, activeFocusId]);

  const displayNodes = useMemo(() => {
    if (!activeFocusId) {
      return nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isSelected: false,
          isDimmed: false,
        },
      }));
    }

    const connectedNodeIds = new Set<string>([activeFocusId]);
    edges.forEach((edge) => {
      if (edge.source === activeFocusId) connectedNodeIds.add(edge.target);
      if (edge.target === activeFocusId) connectedNodeIds.add(edge.source);
    });

    return nodes.map((node) => {
      const isSelected = node.id === activeFocusId;
      const isConnected = connectedNodeIds.has(node.id);

      return {
        ...node,
        data: {
          ...node.data,
          isSelected,
          isDimmed: !isConnected,
        },
      };
    });
  }, [nodes, activeFocusId, edges]);

  // Selected Detail Item Calculation
  const selectedPackage = useMemo(() => {
    if (!selectedNodeId || selectedNodeId.startsWith("file-")) return null;
    return packageNodes.find((p) => p.id === selectedNodeId) || null;
  }, [selectedNodeId, packageNodes]);

  const selectedFile = useMemo(() => {
    if (!selectedNodeId || !selectedNodeId.startsWith("file-")) return null;
    const realId = selectedNodeId.replace("file-", "");
    return fileNodes.find((f) => f.id === realId) || null;
  }, [selectedNodeId, fileNodes]);

  // Files importing selected package
  const importingFiles = useMemo(() => {
    if (!selectedPackage) return [];
    return fileNodes.filter((f) => f.imports.includes(selectedPackage.id));
  }, [selectedPackage, fileNodes]);

  const prodCount = packageNodes.filter((p) => p.type === "dependency").length;
  const devCount = packageNodes.filter((p) => p.type === "devDependency").length;

  const handleCopyInstall = (pkgName: string) => {
    const pm = frameworkMeta.packageManager || "npm";
    const cmd =
      pm === "yarn"
        ? `yarn add ${pkgName}`
        : pm === "pnpm"
        ? `pnpm add ${pkgName}`
        : pm === "bun"
        ? `bun add ${pkgName}`
        : `npm install ${pkgName}`;
    navigator.clipboard.writeText(cmd);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div
      className="h-full w-full relative bg-[#07090C] overflow-hidden select-none font-sans"
      onClick={() => setSelectedNodeId(null)}
    >
      {/* ── TOP HEADER CONTROL BAR ────────────────────────────────────── */}
      <div className="absolute top-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-[#08151E]/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/[0.08] shadow-2xl pointer-events-auto">
        {/* Left: Title, Subtitle & Ecosystem Badges */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-[#16C7A3]/15 border border-[#16C7A3]/30 flex items-center justify-center text-[#16C7A3] shrink-0">
            <Package size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[13.5px] font-bold text-[#F7FAFA] leading-tight">
                Package Dependencies
              </h2>
              {/* Runtime & Package Manager Badges from Backend */}
              <span className="px-2 py-0.5 rounded-md bg-[#16C7A3]/15 text-[#16C7A3] border border-[#16C7A3]/30 text-[10px] font-mono font-bold uppercase">
                {frameworkMeta.packageManager}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#3288F5]/15 text-[#3288F5] border border-[#3288F5]/30 text-[10px] font-mono font-bold">
                {frameworkMeta.runtime}
              </span>
              {frameworkMeta.monorepo && (
                <span className="px-1.5 py-0.5 rounded-md bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30 text-[9.5px] font-mono font-semibold">
                  Monorepo
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#82AEB5] leading-none mt-0.5">
              {prodCount} production · {devCount} dev dependencies
            </p>
          </div>
        </div>

        {/* Middle: Search Box */}
        <div className="relative w-48 sm:w-64">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#82AEB5]" />
          <input
            type="text"
            placeholder="Filter packages or files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-8 pl-8 pr-7 bg-[#050E14] border border-white/[0.08] focus:border-[#16C7A3]/50 rounded-lg text-xs text-[#F7FAFA] placeholder:text-[#82AEB5]/60 outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#82AEB5] hover:text-white"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Right: Quick Checkboxes */}
        <div className="flex items-center gap-2.5 shrink-0">
          <label className="h-8 px-2.5 rounded-lg bg-[#050E14] border border-white/[0.08] flex items-center gap-2 cursor-pointer hover:bg-white/[0.04] transition-colors">
            <input
              type="checkbox"
              checked={showProdDeps}
              onChange={(e) => setShowProdDeps(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-[#101827] border-white/20 text-[#16C7A3] focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-[11px] font-medium text-[#F7FAFA]">Prod</span>
          </label>

          <label className="h-8 px-2.5 rounded-lg bg-[#050E14] border border-white/[0.08] flex items-center gap-2 cursor-pointer hover:bg-white/[0.04] transition-colors">
            <input
              type="checkbox"
              checked={showDevDeps}
              onChange={(e) => setShowDevDeps(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-[#101827] border-white/20 text-[#3288F5] focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-[11px] font-medium text-[#F7FAFA]">Dev</span>
          </label>
        </div>
      </div>

      {/* ── Bottom-Left: Category Filter Pills ─────────────────────────── */}
      <div className="absolute bottom-4 left-4 z-20 bg-[#08151E]/95 backdrop-blur-md rounded-2xl p-3 border border-white/[0.08] shadow-2xl max-w-[280px] text-left pointer-events-auto">
        <div className="text-[10.5px] font-bold tracking-[0.08em] text-[#82AEB5] uppercase mb-2">
          ECOSYSTEM CATEGORIES
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCategory(null);
            }}
            className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
              selectedCategory === null
                ? "bg-[#16C7A3] text-[#061412] font-bold"
                : "bg-white/[0.05] text-[#82AEB5] hover:text-white"
            }`}
          >
            All ({packageNodes.length})
          </button>
          {(Object.keys(CATEGORY_MAP) as PackageCategory[]).map((cat) => {
            const count = packageNodes.filter((p) => p.category === cat).length;
            if (count === 0) return null;
            const isSel = selectedCategory === cat;
            const meta = CATEGORY_MAP[cat];
            return (
              <button
                key={cat}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCategory((prev) => (prev === cat ? null : cat));
                }}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                  isSel
                    ? "font-bold text-white"
                    : "bg-white/[0.04] text-[#82AEB5] hover:text-white"
                }`}
                style={{
                  backgroundColor: isSel ? meta.color : undefined,
                  color: isSel ? "#061412" : undefined,
                }}
              >
                <span>{cat}</span>
                <span className="opacity-70 text-[9px]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right-Side Detail Inspector Drawer ─────────────────────────── */}
      <AnimatePresence>
        {(selectedPackage || selectedFile) && (
          <motion.div
            initial={{ x: 380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 380, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-16 right-4 bottom-4 w-[340px] z-30 bg-[#0A1723]/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl shadow-2xl p-4 flex flex-col text-left overflow-y-auto pointer-events-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: selectedPackage
                      ? CATEGORY_MAP[selectedPackage.category].bg
                      : "rgba(50, 136, 245, 0.2)",
                    color: selectedPackage
                      ? CATEGORY_MAP[selectedPackage.category].color
                      : "#3288F5",
                  }}
                >
                  {selectedPackage ? <Package size={16} /> : <FileCode size={16} />}
                </div>
                <div className="min-w-0">
                  <h3
                    className="text-xs font-bold text-[#F7FAFA] font-mono truncate"
                    title={selectedPackage?.name || selectedFile?.name}
                  >
                    {selectedPackage?.name || selectedFile?.name}
                  </h3>
                  <p className="text-[10px] text-[#82AEB5] font-sans">
                    {selectedPackage
                      ? `${selectedPackage.category} · ${selectedPackage.type}`
                      : selectedFile?.path}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedNodeId(null)}
                className="p-1 rounded-md text-[#82AEB5] hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content for Selected Package */}
            {selectedPackage && (
              <div className="mt-3 space-y-3.5 flex-1 text-xs">
                {/* Package Meta Cards */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-[9.5px] uppercase font-mono text-[#82AEB5]">Version</div>
                    <div className="text-xs font-bold font-mono text-[#F7FAFA] mt-0.5">
                      {selectedPackage.version}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-[9.5px] uppercase font-mono text-[#82AEB5]">Category</div>
                    <div
                      className="text-xs font-bold mt-0.5 truncate"
                      style={{ color: CATEGORY_MAP[selectedPackage.category].color }}
                    >
                      {selectedPackage.category}
                    </div>
                  </div>
                </div>

                {/* Primary Framework Indicator */}
                {selectedPackage.isFramework && (
                  <div className="p-2.5 rounded-xl bg-[#16C7A3]/10 border border-[#16C7A3]/30 flex items-center gap-2 text-[#16C7A3]">
                    <Sparkles size={14} className="shrink-0" />
                    <span className="text-[11px] font-semibold">
                      Primary Core Architecture Engine
                    </span>
                  </div>
                )}

                {/* Quick Install Command */}
                <div className="p-2.5 rounded-xl bg-[#060D14] border border-white/[0.08]">
                  <div className="flex items-center justify-between text-[10px] text-[#82AEB5] font-mono mb-1">
                    <span>Install Command</span>
                    <button
                      onClick={() => handleCopyInstall(selectedPackage.name)}
                      className="flex items-center gap-1 text-[#16C7A3] hover:underline cursor-pointer"
                    >
                      {copiedText ? <Check size={11} /> : <Copy size={11} />}
                      <span>{copiedText ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <code className="text-[10.5px] text-[#F7FAFA] font-mono block truncate">
                    {frameworkMeta.packageManager === "yarn"
                      ? `yarn add ${selectedPackage.name}`
                      : frameworkMeta.packageManager === "pnpm"
                      ? `pnpm add ${selectedPackage.name}`
                      : frameworkMeta.packageManager === "bun"
                      ? `bun add ${selectedPackage.name}`
                      : `npm i ${selectedPackage.name}`}
                  </code>
                </div>

                {/* Importers List */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#F7FAFA] mb-1.5">
                    <span>Imported By Codebase Files</span>
                    <span className="text-[10px] font-mono text-[#16C7A3]">
                      {importingFiles.length} files
                    </span>
                  </div>

                  {importingFiles.length === 0 ? (
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center text-[10.5px] text-[#82AEB5]">
                      No direct AST imports detected in scanned files (likely global or configuration dependency).
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {importingFiles.map((file) => (
                        <div
                          key={file.id}
                          onClick={() => setSelectedNodeId(`file-${file.id}`)}
                          className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] transition-colors cursor-pointer flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileCode size={12} className="text-[#3288F5] shrink-0" />
                            <span className="text-[11px] font-mono text-[#F4F7F7] truncate">
                              {file.name}
                            </span>
                          </div>
                          <ChevronRight
                            size={12}
                            className="text-[#82AEB5] group-hover:text-white group-hover:translate-x-0.5 transition-transform shrink-0"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Content for Selected File */}
            {selectedFile && (
              <div className="mt-3 space-y-3.5 flex-1 text-xs">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-[9.5px] uppercase font-mono text-[#82AEB5]">File Path</div>
                  <div className="text-[11px] font-mono text-[#F7FAFA] mt-0.5 break-all">
                    {selectedFile.path}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#F7FAFA] mb-1.5">
                    <span>Imported Packages</span>
                    <span className="text-[10px] font-mono text-[#3288F5]">
                      {selectedFile.imports.length} packages
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                    {selectedFile.imports.map((pkgId) => {
                      const pkg = packageNodes.find((p) => p.id === pkgId);
                      const cat = pkg ? pkg.category : "Utility";
                      const catMeta = CATEGORY_MAP[cat];

                      return (
                        <div
                          key={pkgId}
                          onClick={() => setSelectedNodeId(pkgId)}
                          className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] transition-colors cursor-pointer flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Package size={12} style={{ color: catMeta.color }} className="shrink-0" />
                            <span className="text-[11px] font-mono text-[#F4F7F7] truncate">
                              {pkgId}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono text-[#82AEB5] shrink-0">
                            {pkg?.version || "*"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Canvas ─────────────────────────────────────────────────── */}
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.15}
        maxZoom={1.6}
        proOptions={{ hideAttribution: true }}
      >
        <Controls className="!bg-[#0D1728] !border-white/[0.08] !fill-[#F4F7F7] !text-[#F4F7F7] rounded-xl shadow-xl !left-4 !bottom-36" />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          style={{ width: 180, height: 110 }}
          className="!bg-[#0D1728] !border-white/[0.08] rounded-xl overflow-hidden shadow-2xl !right-4 !bottom-4 !w-[180px] !h-[110px]"
          nodeColor={(n) => {
            return n.type === "packageNode" ? "#16C7A3" : "#3288F5";
          }}
          maskColor="rgba(7, 9, 12, 0.85)"
        />
        <Background gap={22} size={1} color="rgba(255, 255, 255, 0.035)" />
      </ReactFlow>
    </div>
  );
}

export default function PackageGraph({
  result,
  externalSearchQuery,
  isFullScreen,
  fitViewTrigger,
  fitRepoTrigger,
}: {
  result: any;
  externalSearchQuery?: string;
  isFullScreen?: boolean;
  fitViewTrigger?: number;
  fitRepoTrigger?: number;
}) {
  return (
    <ReactFlowProvider>
      <PackageGraphInternal
        result={result}
        externalSearchQuery={externalSearchQuery}
        isFullScreen={isFullScreen}
        fitViewTrigger={fitViewTrigger}
        fitRepoTrigger={fitRepoTrigger}
      />
    </ReactFlowProvider>
  );
}

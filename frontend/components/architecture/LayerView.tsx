import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ReactFlow, Background, Controls, Node as ReactFlowNode, Edge as ReactFlowEdge } from "@xyflow/react";
import { getArchitectureLayers } from "../../lib/api/client";
import LayerNode from "./LayerNode";
import LayerFileNode from "./LayerFileNode";
import LayerDetails from "./LayerDetails";
import { useAnalysisStore } from "../../store/analysis.store";
import { 
  Route, Settings, Cog, Database, Layers, Play, PlayCircle, 
  Pause, SkipForward, X, Loader2, Search 
} from 'lucide-react';

// BFS for focused subgraph - from daadd-main
function getFocusedNodes(
  nodes: any[],
  edges: any[],
  searchTerm: string,
  depth: number = 2
): Set<string> {
  const matched = new Set<string>();
  const lowerSearch = searchTerm.toLowerCase();

  // Find initial matches
  nodes.forEach(node => {
    if (node.data?.label?.toLowerCase().includes(lowerSearch)) {
      matched.add(node.id);
    }
  });

  if (matched.size === 0) return matched;

  // BFS expansion
  const visited = new Set(matched);
  const queue = Array.from(matched).map(id => ({ id, dist: 0 }));

  while (queue.length > 0) {
    const { id, dist } = queue.shift()!;
    if (dist >= depth) continue;

    edges.forEach(edge => {
      if (edge.source === id && !visited.has(edge.target)) {
        visited.add(edge.target);
        matched.add(edge.target);
        queue.push({ id: edge.target, dist: dist + 1 });
      }
      if (edge.target === id && !visited.has(edge.source)) {
        visited.add(edge.source);
        matched.add(edge.source);
        queue.push({ id: edge.source, dist: dist + 1 });
      }
    });
  }

  return matched;
}

const NODE_TYPES = {
  layerNode: LayerNode,
  layerFileNode: LayerFileNode,
};

const LAYER_KEYS = ["routes", "controllers", "services", "repositories", "models", "database"];
const LAYER_LABELS: Record<string, string> = {
  routes: "Routes",
  controllers: "Controllers",
  services: "Services",
  repositories: "Repositories",
  models: "Models",
  database: "Database",
};

const LAYER_COLORS: Record<string, string> = {
  routes: "#3b82f6",       // blue
  controllers: "#a855f7",  // purple
  services: "#f97316",     // amber
  repositories: "#22c55e", // emerald
  models: "#eab308",       // yellow
  database: "#ef4444",     // rose
};

const LAYER_ICONS: Record<string, any> = {
  routes: Route,
  controllers: Settings,
  services: Cog,
  repositories: Database,
  models: Database,
  database: Database
};

export default function LayerView({ result }: { result: any }) {
  const { currentJobId } = useAnalysisStore();
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileLayer, setSelectedFileLayer] = useState<string>("");

  // Search & Tour State
  const [searchQuery, setSearchQuery] = useState("");
  const [tourIdx, setTourIdx] = useState<number | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const tourTimerRef = useRef<any>(null);
  const [focusedNodes, setFocusedNodes] = useState<Set<string>>(new Set());

  // Fetch categorized layers from backend
  const { data: layersData, isLoading } = useQuery({
    queryKey: ["archLayers", currentJobId],
    queryFn: () => getArchitectureLayers(currentJobId!),
    enabled: !!currentJobId,
  });

  // Local fallback classifier if backend query is not resolved yet or empty
  const layers = useMemo(() => {
    if (layersData?.layers) {
      return layersData.layers;
    }
    
    // Fallback logic
    const files = result?.files || [];
    const dbInfo = result?.metadata?.databaseInfo;
    const classified: Record<string, string[]> = {
      routes: [],
      controllers: [],
      services: [],
      repositories: [],
      models: [],
      database: []
    };

    const rules = [
      { key: "routes", regex: /(^|\/)(routes?|router|endpoints?|api)(\/|$)/i },
      { key: "controllers", regex: /(^|\/)(controllers?|handlers?|resolvers?)(\/|$)/i },
      { key: "services", regex: /(^|\/)(services?|usecases?|use-cases|domain|business)(\/|$)/i },
      { key: "repositories", regex: /(^|\/)(repositor(y|ies)|dao|daos)(\/|$)/i },
      { key: "models", regex: /(^|\/)(models?|entities|schemas?|types)(\/|$)/i },
    ];

    for (const f of files) {
      const pathLower = f.path.toLowerCase();
      if (pathLower.startsWith("route:") || pathLower.startsWith("env:") || pathLower.startsWith("db:") || pathLower.startsWith("entity:")) {
        continue;
      }
      let matched = false;
      for (const r of rules) {
        if (r.regex.test(f.path)) {
          classified[r.key].push(f.path);
          matched = true;
          break;
        }
      }
      if (!matched && (/(^|\/)(prisma|drizzle|migrations?|supabase\/migrations|db\/migrations|sql)(\/|$)/i.test(f.path) || /\bprisma\b|schema\.prisma|\bconnection\b|\bdb\b/i.test(f.path))) {
        classified.database.push(f.path);
      }
    }

    if (dbInfo?.type) {
      classified.database.push(`DB: ${dbInfo.type}`);
    }

    return classified;
  }, [layersData, result]);

  // Search & Focus matching logic
  const searchHits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    


    const hits: { layer: string; path: string; filename: string }[] = [];
    LAYER_KEYS.forEach((key) => {
      const files = layers[key] || [];
      files.forEach((file: string) => {
        const filename = file.split(/[\\/]/).pop() || file;
        if (filename.toLowerCase().includes(q) || file.toLowerCase().includes(q)) {
          hits.push({ layer: key, path: file, filename });
        }
      });
    });
    return hits.slice(0, 8); // Cap at 8 hits
  }, [searchQuery, layers]);

  // Use a different name to avoid conflict with state
  const searchFocusedLayers = useMemo(() => {
    const set = new Set<string>();
    searchHits.forEach(hit => set.add(hit.layer));
    return set;
  }, [searchHits]);

  // Jump to specific file
  const jumpTo = (layer: string, file: string) => {
    setExpandedLayer(layer);
    setSelectedFile(file);
    
    setSelectedFileLayer(LAYER_LABELS[layer] || "Services");
    setSearchQuery(""); // Clear search query to restore opacity
    setTourIdx(null);   // Stop tour
  };

  const startTour = () => {
    setSearchQuery("");
    setExpandedLayer(null);
    setSelectedFile(null);
    setTourIdx(0);
  };
  const stopTour = () => {
    setTourIdx(null);
    setExpandedLayer(null);
  };

  // Construct ReactFlow nodes & edges dynamically
  const { nodes, edges } = useMemo(() => {
    const flowNodes: ReactFlowNode[] = [];
    const flowEdges: ReactFlowEdge[] = [];

    const hasSearch = searchQuery.trim().length > 0;
    const isTourActive = tourIdx !== null;

    let currentY = 30;
    const xCenter = 220;

    for (let idx = 0; idx < LAYER_KEYS.length; idx++) {
      const key = LAYER_KEYS[idx];
      const label = LAYER_LABELS[key];
      const files = layers[key] || [];
      const isExpanded = expandedLayer === key;

      // Determine Opacity / Dimmed status
      let opacity = 1.0;
      let isNodeActive = true;
      if (isTourActive) {
        isNodeActive = expandedLayer === key;
        opacity = isNodeActive ? 1.0 : 0.18;
      } else if (hasSearch) {
        // ✅ FIX: Use full node ID and fallback check
        const isFocused = focusedNodes.size === 0 || focusedNodes.has(`layer-${key}`);
        opacity = isFocused ? 1.0 : 0.18;
        isNodeActive = isFocused;
      }

      // Add the Layer node
      flowNodes.push({
        id: `layer-${key}`,
        type: "layerNode",
        data: {
          label,
          count: files.length,
          isExpanded,
          key,
        },
        position: { x: xCenter - 110, y: currentY },
        style: { 
          width: 220,
          opacity,
          transition: "opacity 250ms ease, transform 250ms ease",
          transform: isTourActive && isNodeActive ? "scale(1.04)" : "scale(1)",
        },
      });

      currentY += 90; // space below layer card

      // If this layer is expanded, place its files vertically below it
      if (isExpanded && files.length > 0) {
        // Connect the layer card to the first file node
        flowEdges.push({
          id: `edge-layer-to-first-${key}`,
          source: `layer-${key}`,
          target: `file-${files[0]}`,
          animated: true,
          style: { 
            stroke: "hsl(var(--primary, 60 100% 50%))", 
            strokeWidth: 2.0,
            opacity: 0.8,
          },
        });

        for (let fIdx = 0; fIdx < files.length; fIdx++) {
          const file = files[fIdx];
          const fileIsGod = result?.staticAnalysis?.godServices?.some((g: any) => g.file === file);
          const fileIsDead = result?.staticAnalysis?.deadCode?.some((d: any) => d.file === file);

          let complexity = 0;
          if (result?.staticAnalysis?.complexity) {
            const match = result.staticAnalysis.complexity.find((c: any) => c.file === file);
            if (match) complexity = match.score;
          }

          // File Node opacity
          let fileOpacity = opacity;
          if (hasSearch && focusedNodes.size > 0) {
            // ✅ FIX: Use full node ID
            fileOpacity = focusedNodes.has(`file-${file}`) ? 1.0 : 0.18;
          }

          flowNodes.push({
            id: `file-${file}`,
            type: "layerFileNode",
            data: {
              file,
              complexity,
              isGod: fileIsGod,
              isDead: fileIsDead,
              isSelected: selectedFile === file,
            },
            position: { x: xCenter - 85, y: currentY },
            style: { 
              width: 170,
              opacity: fileOpacity,
              transition: "opacity 250ms ease, border-color 250ms ease",
            },
          });

          // Connect files sequentially
          if (fIdx > 0) {
            flowEdges.push({
              id: `edge-file-${files[fIdx - 1]}-to-${file}`,
              source: `file-${files[fIdx - 1]}`,
              target: `file-${file}`,
              style: { stroke: "#3f3f46", strokeWidth: 1.5, opacity: 0.5 },
            });
          }

          currentY += 60; // vertical spacing between files
        }
        currentY += 30; // space after expanded list
      }

      // Connect this layer to next layer
      if (idx < LAYER_KEYS.length - 1) {
        const nextKey = LAYER_KEYS[idx + 1];
        // Connect either from the last file (if expanded) or from the layer card itself
        const sourceNodeId = (isExpanded && files.length > 0) ? `file-${files[files.length - 1]}` : `layer-${key}`;
        
        let edgeDimmed = false;
        if (isTourActive) {
          edgeDimmed = !(expandedLayer === key || expandedLayer === nextKey);
        } else if (hasSearch) {
            const sourceFocused = focusedNodes.size === 0 || focusedNodes.has(sourceNodeId);
            const targetFocused = focusedNodes.size === 0 || focusedNodes.has(`layer-${nextKey}`);
        
          edgeDimmed = !(sourceFocused && targetFocused);
        }
        flowEdges.push({
          id: `edge-layer-${key}-to-${nextKey}`,
          source: sourceNodeId,
          target: `layer-${nextKey}`,
          animated: !edgeDimmed,
          style: { 
            stroke: edgeDimmed ? "#3f3f46" : "hsl(var(--primary, 60 100% 50%))", 
            strokeWidth: edgeDimmed ? 1.5 : 2.5,
            opacity: edgeDimmed ? 0.15 : 1.0,
            transition: "opacity 250ms, stroke-width 250ms",
          },
        });
      }
    }

    return { nodes: flowNodes, edges: flowEdges };
  }, [layers, expandedLayer, selectedFile, searchQuery, focusedNodes, tourIdx, result]);

  // Guided tour effect: Cycle through layers sequence
  // 🆕 Effect 1: Update focusedNodes when search changes (BFS from daadd-main)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFocusedNodes(new Set());
      return;
    }

    const allNodes = nodes;
    const allEdges = edges;
    const focused = getFocusedNodes(allNodes, allEdges, searchQuery, 2);
    setFocusedNodes(focused);
  }, [searchQuery, nodes, edges]);

  // Center ReactFlow Camera on selected item changes
  // Effect 2: Guided tour effect
  useEffect(() => {
    if (tourIdx === null) return;
    
    setSelectedFile(null);
    
    const totalSteps = LAYER_KEYS.length * 3;
    tourTimerRef.current = setInterval(() => {
      setTourIdx(prev => {
        if (prev === null) return null;
        const next = prev + 1;
        
        if (next >= totalSteps) {
          setExpandedLayer(null);
          return null;
        }

        const currentKey = LAYER_KEYS[Math.floor(next / 3) % LAYER_KEYS.length];
        const subStep = next % 3;

        if (subStep === 1) {
          setExpandedLayer(currentKey);
        }

        if (reactFlowInstance) {
          const node = nodes.find(n => n.id === `layer-${currentKey}`);
          if (node) {
            reactFlowInstance.setCenter(node.position.x + 110, node.position.y + 45, { zoom: 1.25, duration: 600 });
          }
        }

        return next;
      });
    }, 1200);
    
    return () => {
      if (tourTimerRef.current) clearInterval(tourTimerRef.current);
    };
  }, [tourIdx, reactFlowInstance, nodes]);

  // 🆕 Effect 3: Center ReactFlow Camera on selected item changes
  useEffect(() => {
    if (reactFlowInstance) {
      if (selectedFile) {
        const node = nodes.find(n => n.id === `file-${selectedFile}`);
        if (node) {
          reactFlowInstance.setCenter(node.position.x + 85, node.position.y + 25, { zoom: 1.2, duration: 800 });
        }
      } else if (expandedLayer) {
        const node = nodes.find(n => n.id === `layer-${expandedLayer}`);
        if (node) {
          reactFlowInstance.setCenter(node.position.x + 110, node.position.y + 45, { zoom: 1.1, duration: 800 });
        }
      }
    }
  }, [selectedFile, expandedLayer, reactFlowInstance, nodes]);

  // Handle node clicks
  const onNodeClick = (_event: React.MouseEvent, node: ReactFlowNode) => {
    if (node.id.startsWith("layer-")) {
      const key = node.data.key as string;
      setExpandedLayer(prev => (prev === key ? null : key));
      setTourIdx(null); // Cancel tour if clicked manually
    } else if (node.id.startsWith("file-")) {
      const filePath = node.id.replace("file-", "");
      setSelectedFile(filePath);
      
      // Figure out which layer this file belongs to
      for (const key of LAYER_KEYS) {
        if ((layers[key] || []).includes(filePath)) {
          setSelectedFileLayer(LAYER_LABELS[key] || "Services");
          break;
        }
      }
      setTourIdx(null); // Cancel tour if clicked manually
    }
  };

  if (isLoading) {
    return (
      <div className="h-[480px] flex flex-col items-center justify-center text-zinc-550 gap-2 bg-zinc-950/40 border border-border/60 rounded-2xl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-semibold">Analyzing system architecture layers...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[550px] text-left">
      {/* Canvas */}
      <div className="lg:col-span-3 rounded-2xl border border-border/60 bg-zinc-950/60 overflow-hidden relative">
        
        {/* Left Toolbar controls: Quick search */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-zinc-900/90 border border-border/60 rounded-xl px-2.5 py-1.5 shadow-lg backdrop-blur-md">
          <Search className="w-3.5 h-3.5 text-zinc-550 mr-1 shrink-0" />
          <input
            type="text"
            placeholder="Search files (focus mode)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setTourIdx(null); // Cancel tour if user searches
            }}
            className="bg-transparent text-[10px] text-zinc-200 placeholder-zinc-550 focus:outline-none w-48 sm:w-64 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-zinc-500 hover:text-white ml-1 shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown Overlay */}
        {searchQuery && searchHits.length > 0 && (
          <div className="absolute left-3 top-14 z-20 max-h-60 w-64 sm:w-80 overflow-y-auto rounded-xl border border-border/80 bg-zinc-950/95 p-1.5 shadow-2xl backdrop-blur-md">
            <div className="text-[8px] font-extrabold text-zinc-500 uppercase tracking-widest px-2.5 py-1 border-b border-border/20 mb-1">
              Click to Focus File Node
            </div>
            {searchHits.map((hit) => (
              <button
                key={`${hit.layer}:${hit.path}`}
                type="button"
                onClick={() => jumpTo(hit.layer, hit.path)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white transition"
              >
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: LAYER_COLORS[hit.layer] }}
                />
                <span className="shrink-0 text-[8px] font-black uppercase tracking-widest text-zinc-500 w-16">
                  {LAYER_LABELS[hit.layer]}
                </span>
                <span className="truncate font-mono text-[9.5px] text-zinc-200 flex-1">{hit.filename}</span>
              </button>
            ))}
          </div>
        )}
        {searchQuery && searchHits.length === 0 && (
          <div className="absolute left-3 top-14 z-20 w-64 sm:w-80 rounded-xl border border-border/85 bg-zinc-950/95 p-3 text-[10px] text-zinc-550 shadow-2xl">
            No files match "{searchQuery}"
          </div>
        )}

        {/* Right Toolbar controls: Guided architecture tour */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
          <div className="bg-zinc-900/90 border border-border/60 rounded-xl p-3 shadow-lg backdrop-blur-md">
            <button
              type="button"
              onClick={tourIdx === null ? startTour : stopTour}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all w-full ${
                tourIdx !== null
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30"
              }`}
            >
              {tourIdx !== null ? (
                <>
                  <Pause className="w-4 h-4 animate-pulse" />
                  Stop Tour
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Start Tour
                </>
              )}
            </button>
            {tourIdx !== null && (
              <div className="mt-2 flex items-center gap-2 w-48">
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all"
                    style={{ width: `${(tourIdx / (LAYER_KEYS.length * 3)) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {Math.min(tourIdx + 1, LAYER_KEYS.length * 3)}/{LAYER_KEYS.length * 3}
                </span>
              </div>
            )}
          </div>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          onNodeClick={onNodeClick}
          onInit={(instance) => setReactFlowInstance(instance)}
          fitView
          panOnDrag
          zoomOnScroll
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#27272a" gap={20} />
          <Controls />
        </ReactFlow>
        
        {/* Float Hint */}
        {tourIdx === null && !searchQuery && (
          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-border/60 text-[9.5px] font-semibold text-zinc-400 pointer-events-none flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>Click tier box to expand file listings or start a tier tour</span>
          </div>
        )}


      </div>

      {/* Inspector Details Sidebar */}
      <div className="lg:col-span-1">
        {selectedFile ? (
          <LayerDetails
            filePath={selectedFile}
            layerName={selectedFileLayer}
            result={result}
            onClose={() => setSelectedFile(null)}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-border/80 rounded-2xl bg-zinc-950/20 text-zinc-550">
            <Layers className="w-10 h-10 text-zinc-700 mb-2" />
            <h4 className="text-xs font-bold text-zinc-300">File Inspector</h4>
            <p className="text-[10px] text-zinc-500 max-w-xs mt-1 leading-relaxed">Expand any layer inside the flow diagram and click a file node to review imports, references, and complexity diagnostics.</p>
          </div>
        )}
      </div>
    </div>
  );
}

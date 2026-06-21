import React, { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ReactFlow, Background, Controls, Node as ReactFlowNode, Edge as ReactFlowEdge } from "@xyflow/react";
import { getArchitectureLayers } from "../../lib/api/client";
import LayerNode from "./LayerNode";
import LayerFileNode from "./LayerFileNode";
import LayerDetails from "./LayerDetails";
import { Loader2, Layers, Search, X, Play, Square } from "lucide-react";
import { useAnalysisStore } from "../../store/analysis.store";

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

  // Layers that contain any search hits
  const focusedLayers = useMemo(() => {
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

  // Guided tour effect: Cycle through layers sequence
  useEffect(() => {
    if (tourIdx === null) return;
    
    const currentKey = LAYER_KEYS[tourIdx];
    setExpandedLayer(currentKey);
    setSelectedFile(null); // Clear selected file
    
    tourTimerRef.current = setTimeout(() => {
      setTourIdx(prev => {
        if (prev === null) return null;
        const next = prev + 1;
        if (next >= LAYER_KEYS.length) return null; // Tour finished
        return next;
      });
    }, 2800); // 2.8 seconds per layer
    
    return () => {
      if (tourTimerRef.current) clearTimeout(tourTimerRef.current);
    };
  }, [tourIdx]);

  const startTour = () => {
    setSearchQuery("");
    setExpandedLayer(null);
    setSelectedFile(null);
    setTourIdx(0);
  };
  const stopTour = () => {
    setTourIdx(null);
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
        isNodeActive = focusedLayers.has(key);
        opacity = isNodeActive ? 1.0 : 0.18;
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

      const parentY = currentY;
      currentY += 90; // space below layer card

      // If this layer is expanded, place its files vertically below it
      if (isExpanded && files.length > 0) {
        // Connect the layer card to the first file node
        flowEdges.push({
          id: `edge-layer-to-first-${key}`,
          source: `layer-${key}`,
          target: `file-${files[0]}`,
          animated: true,
          style: { stroke: "#71717a", strokeWidth: 1.5 },
        });

        files.forEach((file, fileIdx) => {
          const fileMatch = !hasSearch || file.toLowerCase().includes(searchQuery.trim().toLowerCase());
          flowNodes.push({
            id: `file-${file}`,
            type: "layerFileNode",
            data: {
              label: file.split(/[\\/]/).pop() || file,
              isActive: selectedFile === file,
            },
            position: { x: xCenter - 85, y: currentY },
            style: { 
              width: 170,
              opacity: fileMatch ? (isTourActive ? 0.8 : 1.0) : 0.18,
              transition: "opacity 200ms"
            },
          });

          // Connect consecutive file nodes together in a vertical stack
          if (fileIdx > 0) {
            flowEdges.push({
              id: `edge-file-${files[fileIdx - 1]}-to-${file}`,
              source: `file-${files[fileIdx - 1]}`,
              target: `file-${file}`,
              animated: true,
              style: { stroke: "#3f3f46", strokeWidth: 1 },
            });
          }

          currentY += 50; // offset each file card vertically
        });

        currentY += 30; // extra padding at the bottom of the list
      }

      // Connect this layer to the next layer in the sequence
      if (idx < LAYER_KEYS.length - 1) {
        const nextKey = LAYER_KEYS[idx + 1];
        // If expanded, connection flows from the last file in the stack; otherwise, from the layer node itself
        const sourceNodeId = isExpanded && files.length > 0 ? `file-${files[files.length - 1]}` : `layer-${key}`;
        
        // Determine Edge Dimming
        let edgeDimmed = false;
        if (isTourActive) {
          edgeDimmed = !(expandedLayer === key || expandedLayer === nextKey);
        } else if (hasSearch) {
          edgeDimmed = !(focusedLayers.has(key) && focusedLayers.has(nextKey));
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
  }, [layers, expandedLayer, selectedFile, searchQuery, focusedLayers, tourIdx]);

  // Center ReactFlow Camera on selected item changes
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
        <div className="absolute top-3 right-3 z-10">
          <button
            type="button"
            onClick={tourIdx === null ? startTour : stopTour}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold shadow-lg transition-all duration-300 border ${
              tourIdx === null
                ? "bg-primary text-background border-primary hover:bg-primary/95"
                : "bg-red-650 text-white border-red-700 hover:bg-red-700"
            }`}
          >
            {tourIdx === null ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Tour Tiers</span>
              </>
            ) : (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Tour</span>
              </>
            )}
          </button>
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

        {/* Tour Status Overlay */}
        {tourIdx !== null && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-80 sm:w-96 bg-zinc-950/90 border border-primary/50 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-left flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-wider text-primary">Architecture Tour</span>
              </div>
              <span className="text-[9px] font-extrabold text-zinc-500">
                STEP {tourIdx + 1} OF {LAYER_KEYS.length}
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-150">{LAYER_LABELS[LAYER_KEYS[tourIdx]]} Tier</h4>
              <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                Reviewing the {LAYER_LABELS[LAYER_KEYS[tourIdx]].toLowerCase()} layer containing {layers[LAYER_KEYS[tourIdx]]?.length || 0} component file(s).
              </p>
            </div>
            <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-border/20">
              <button
                type="button"
                onClick={() => setTourIdx(prev => (prev !== null && prev > 0 ? prev - 1 : prev))}
                disabled={tourIdx === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border/60 bg-zinc-900/50 hover:bg-zinc-800 text-[9.5px] font-bold text-zinc-350 disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <span>Prev</span>
              </button>
              <button
                type="button"
                onClick={stopTour}
                className="px-2.5 py-1.5 rounded-lg border border-red-700 bg-red-950/20 text-red-400 text-[9.5px] font-bold hover:bg-red-900/30 transition"
              >
                Exit Tour
              </button>
              <button
                type="button"
                onClick={() => setTourIdx(prev => (prev !== null && prev < LAYER_KEYS.length - 1 ? prev + 1 : prev))}
                disabled={tourIdx === LAYER_KEYS.length - 1}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border/60 bg-zinc-900/50 hover:bg-zinc-800 text-[9.5px] font-bold text-zinc-350 disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <span>Next</span>
              </button>
            </div>
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

'use client';

import React, { useMemo, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { LayerItemData, Architecture3DProps } from './types';
import { LayerPlatform } from './LayerPlatform';
import { DatabaseNode } from './DatabaseNode';
import { ExternalApiNode } from './ExternalApiNode';
import { CircuitLines } from './CircuitLines';
import { ContextualOverlays } from './ContextualOverlays';
import { RotateCcw, ZoomIn, ZoomOut, Sparkles } from 'lucide-react';

export const LAYERS_3D_CONFIG: LayerItemData[] = [
  {
    id: 'routes',
    num: '01',
    name: 'Routes',
    shortDesc: 'API endpoints & HTTP handlers',
    tag: 'API LAYER',
    color: '#2F80ED',
    glowColor: '#00E5FF',
    bgColor: 'rgba(47, 128, 237, 0.15)',
    borderColor: 'rgba(47, 128, 237, 0.4)',
    badgeText: '/api/v1/*',
    files: [],
  },
  {
    id: 'controllers',
    num: '02',
    name: 'Controllers',
    shortDesc: 'Request handling & validation',
    tag: 'LOGIC LAYER',
    color: '#8B5CF6',
    glowColor: '#C084FC',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    badgeText: '>_ Handler',
    files: [],
  },
  {
    id: 'services',
    num: '03',
    name: 'Services',
    shortDesc: 'Business logic & core operations',
    tag: 'BUSINESS LAYER',
    color: '#F59E0B',
    glowColor: '#FCD34D',
    bgColor: 'rgba(245, 166, 35, 0.15)',
    borderColor: 'rgba(245, 166, 35, 0.4)',
    badgeText: '⚙ Engine',
    files: [],
  },
  {
    id: 'repositories',
    num: '04',
    name: 'Repositories',
    shortDesc: 'Data access & database operations',
    tag: 'DATA LAYER',
    color: '#EC4899',
    glowColor: '#F472B6',
    bgColor: 'rgba(236, 72, 153, 0.15)',
    borderColor: 'rgba(236, 72, 153, 0.4)',
    badgeText: '🗄 Storage',
    files: [],
  },
  {
    id: 'middleware',
    num: '05',
    name: 'Middleware',
    shortDesc: 'Auth, logging & request pipeline',
    tag: 'PIPELINE LAYER',
    color: '#14B8A6',
    glowColor: '#34D399',
    bgColor: 'rgba(20, 184, 166, 0.15)',
    borderColor: 'rgba(20, 184, 166, 0.4)',
    badgeText: '🛡 Guard',
    files: [],
  },
  {
    id: 'external',
    num: '06',
    name: 'External Services',
    shortDesc: 'Third-party APIs & integrations',
    tag: 'INTEGRATION LAYER',
    color: '#60A5FA',
    glowColor: '#93C5FD',
    bgColor: 'rgba(96, 165, 250, 0.15)',
    borderColor: 'rgba(96, 165, 250, 0.4)',
    badgeText: '☁ Cloud APIs',
    files: [],
  },
];

// Inner 3D scene content
function ArchitectureSceneContent({
  layers,
  selectedLayerId,
  onSelectLayer,
  searchQuery = '',
}: Architecture3DProps) {
  // Compute vertical spacing: 6 platforms spaced by 0.85 units (total span from 2.0 down to -2.25)
  const layerPositions = useMemo(() => {
    return LAYERS_3D_CONFIG.map((layer, index) => {
      const y = 2.0 - index * 0.85;
      return {
        ...layer,
        yPos: y,
      };
    });
  }, []);

  const selectedLayer = layerPositions.find((l) => l.id === selectedLayerId);

  return (
    <>
      {/* Precision architectural lighting with soft shadows */}
      <ambientLight intensity={0.8} color="#0E1F2E" />
      <directionalLight
        position={[9, 14, 9]}
        intensity={2.2}
        color="#FFFFFF"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-7, 8, -4]} intensity={1.1} color="#00D2FF" />
      <directionalLight position={[2, 4, 8]} intensity={0.8} color="#38BDF8" />
      <directionalLight position={[-4, -6, 5]} intensity={0.4} color="#F59E0B" />

      {/* Dynamic spot/point light focused on selected layer */}
      {selectedLayer && (
        <pointLight
          position={[0, selectedLayer.yPos + 0.6, 2.2]}
          intensity={1.8}
          color={selectedLayer.color}
          distance={5.5}
        />
      )}

      {/* 3D Architecture Stack */}
      <group position={[0, 0, 0]}>
        {layerPositions.map((layer, idx) => {
          const fileList = layers[layer.id] || [];
          const isSelected = selectedLayerId === layer.id;
          const searchMatch = searchQuery
            ? layer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              layer.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
              fileList.some((f) => String(f).toLowerCase().includes(searchQuery.toLowerCase()))
            : true;

          return (
            <LayerPlatform
              key={layer.id}
              layer={layer}
              index={idx}
              yPos={layer.yPos}
              isSelected={isSelected}
              onSelect={() => onSelectLayer(layer.id)}
              fileCount={fileList.length}
              searchMatch={searchMatch}
            />
          );
        })}
      </group>

      {/* Contextual 3D Nodes */}
      <DatabaseNode
        position={[-3.8, -0.55, 0.3]}
        onSelectRepositoryLayer={() => onSelectLayer('repositories')}
      />
      <ExternalApiNode
        position={[3.8, -1.40, 0.3]}
        onSelectExternalLayer={() => onSelectLayer('external')}
      />

      {/* Clean Orthogonal Circuit Trace Lines */}
      <CircuitLines />
    </>
  );
}

export const Architecture3DCanvas: React.FC<Architecture3DProps> = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  searchQuery = '',
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const handleResetView = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object as THREE.PerspectiveCamera;
      if (camera) {
        camera.position.set(6.8, 5.2, 7.8);
        camera.zoom = 1;
        camera.lookAt(0, -0.15, 0);
        camera.updateProjectionMatrix();
      }
      controlsRef.current.target.set(0, -0.15, 0);
      controlsRef.current.update();
    }
  };

  const handleZoomIn = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object as THREE.PerspectiveCamera;
      if (camera) {
        camera.zoom = Math.min(camera.zoom * 1.2, 2.5);
        camera.updateProjectionMatrix();
      }
    }
  };

  const handleZoomOut = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object as THREE.PerspectiveCamera;
      if (camera) {
        camera.zoom = Math.max(camera.zoom / 1.2, 0.6);
        camera.updateProjectionMatrix();
      }
    }
  };

  return (
    <div className="relative w-full h-full min-h-[580px] bg-[#061015] rounded-xl overflow-hidden select-none flex flex-col justify-between border border-[rgba(120,200,210,0.14)]">
      {/* Background Subtle Technical Grid (Quiet opacity) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0, 210, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 210, 255, 0.08) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Clean Contextual Overlays */}
      <ContextualOverlays />

      {/* Three.js Fiber Canvas Viewport with Precision 3/4 Isometric Perspective */}
      <div className="absolute inset-0 z-10">
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
        >
          <PerspectiveCamera makeDefault position={[6.8, 5.2, 7.8]} fov={36} />
          <OrbitControls
            ref={controlsRef}
            target={[0, -0.15, 0]}
            enablePan={true}
            enableZoom={true}
            minDistance={6.5}
            maxDistance={18}
            maxPolarAngle={Math.PI / 2.15}
            minPolarAngle={Math.PI / 4.5}
            dampingFactor={0.06}
          />
          <Suspense fallback={null}>
            <ArchitectureSceneContent
              layers={layers}
              selectedLayerId={selectedLayerId}
              onSelectLayer={onSelectLayer}
              searchQuery={searchQuery}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Floating Controls HUD at Bottom */}
      <div className="relative z-30 mt-auto flex items-center justify-between p-3 border-t border-[rgba(120,200,210,0.1)] bg-[#071115]/85 backdrop-blur-md text-[10px] text-[#9FB0B3]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[#60A5FA]">
            <Sparkles size={11} className="text-[#00D2FF]" />
            <span>3D Physical Architectural Stack</span>
          </span>
          <span className="text-[#9FB0B3]/40">|</span>
          <span className="hidden sm:inline-block font-mono text-[9px] text-[#9FB0B3]/60">
            Isometric View • Drag to Orbit • Click platform to Inspect
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-[#0E1C21] hover:bg-[#14262E] text-[#9FB0B3] hover:text-[#F4F7F7] border border-[rgba(120,200,210,0.15)] transition"
            title="Zoom In"
          >
            <ZoomIn size={12} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-[#0E1C21] hover:bg-[#14262E] text-[#9FB0B3] hover:text-[#F4F7F7] border border-[rgba(120,200,210,0.15)] transition"
            title="Zoom Out"
          >
            <ZoomOut size={12} />
          </button>
          <button
            onClick={handleResetView}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0E1C21] hover:bg-[#14262E] text-[#9FB0B3] hover:text-[#F4F7F7] border border-[rgba(120,200,210,0.15)] transition font-mono text-[10px]"
            title="Reset to Default Isometric View"
          >
            <RotateCcw size={11} />
            <span>Reset View</span>
          </button>
        </div>
      </div>
    </div>
  );
};

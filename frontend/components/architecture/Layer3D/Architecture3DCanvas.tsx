'use client';

import React, { useState, useMemo, useRef, Suspense } from 'react';
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
import { RotateCcw, ZoomIn, ZoomOut, Eye, Sparkles } from 'lucide-react';

export const LAYERS_3D_CONFIG: LayerItemData[] = [
  {
    id: 'routes',
    num: '01',
    name: 'Routes',
    shortDesc: 'API endpoints & HTTP handlers',
    tag: 'API LAYER',
    color: '#2F80ED',
    glowColor: '#00D2FF',
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
    color: '#F5A623',
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
    color: '#F43F7A',
    glowColor: '#F472B6',
    bgColor: 'rgba(244, 63, 122, 0.15)',
    borderColor: 'rgba(244, 63, 122, 0.4)',
    badgeText: '🗄 Storage',
    files: [],
  },
  {
    id: 'middleware',
    num: '05',
    name: 'Middleware',
    shortDesc: 'Auth, logging & request pipeline',
    tag: 'PIPELINE LAYER',
    color: '#16C7A3',
    glowColor: '#34D399',
    bgColor: 'rgba(22, 199, 163, 0.15)',
    borderColor: 'rgba(22, 199, 163, 0.4)',
    badgeText: '🛡 Guard',
    files: [],
  },
  {
    id: 'external',
    num: '06',
    name: 'External Services',
    shortDesc: 'Third-party APIs & integrations',
    tag: 'INTEGRATION LAYER',
    color: '#3B82F6',
    glowColor: '#93C5FD',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
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
  // Compute vertical spacing: 6 platforms from top to bottom
  const layerPositions = useMemo(() => {
    return LAYERS_3D_CONFIG.map((layer, index) => {
      const y = 2.45 - index * 1.02;
      return {
        ...layer,
        yPos: y,
      };
    });
  }, []);

  const selectedLayer = layerPositions.find((l) => l.id === selectedLayerId);

  return (
    <>
      {/* Lights matching dark cyber aesthetic */}
      <ambientLight intensity={0.65} />
      <directionalLight position={[7, 10, 8]} intensity={1.5} color="#FFFFFF" />
      <directionalLight position={[-8, 4, -6]} intensity={0.9} color="#00D2FF" />
      <directionalLight position={[0, -5, 5]} intensity={0.4} color="#8B5CF6" />

      {/* Dynamic spot/point light focused on selected layer */}
      {selectedLayer && (
        <pointLight
          position={[0, selectedLayer.yPos + 0.8, 2.5]}
          intensity={2.0}
          color={selectedLayer.color}
          distance={6}
        />
      )}

      {/* 3D Stack Platforms */}
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
        position={[-4.5, -1.2, 0.4]}
        onSelectRepositoryLayer={() => onSelectLayer('repositories')}
      />
      <ExternalApiNode
        position={[4.6, -2.1, 0.4]}
        onSelectExternalLayer={() => onSelectLayer('external')}
      />

      {/* Glowing Circuit Trace Lines */}
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
        camera.zoom = 1;
        camera.updateProjectionMatrix();
      }
      controlsRef.current.reset();
    }
  };

  const handleZoomIn = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object as THREE.PerspectiveCamera;
      if (camera) {
        camera.zoom = Math.min(camera.zoom * 1.25, 2.8);
        camera.updateProjectionMatrix();
      }
    }
  };

  const handleZoomOut = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object as THREE.PerspectiveCamera;
      if (camera) {
        camera.zoom = Math.max(camera.zoom / 1.25, 0.5);
        camera.updateProjectionMatrix();
      }
    }
  };

  return (
    <div className="relative w-full h-full min-h-[580px] bg-[#071115] rounded-xl overflow-hidden select-none flex flex-col justify-between border border-[rgba(120,200,210,0.14)]">
      {/* Background Subtle Cyber Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0, 210, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 210, 255, 0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Contextual HTML Overlays (Incoming Requests, HTTP Request card, Response card, Rules callout) */}
      <ContextualOverlays />

      {/* Three.js Fiber Canvas Viewport */}
      <div className="absolute inset-0 z-10">
        <Canvas
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
        >
          <PerspectiveCamera makeDefault position={[8.5, 6.0, 9.2]} fov={36} />
          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={false}
            minDistance={6}
            maxDistance={22}
            maxPolarAngle={Math.PI / 2 - 0.05}
            minPolarAngle={Math.PI / 6}
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

      {/* Floating Canvas Controls HUD at Bottom */}
      <div className="relative z-30 mt-auto flex items-center justify-between p-3 border-t border-[rgba(120,200,210,0.1)] bg-[#071115]/80 backdrop-blur-md text-[10px] text-[#9FB0B3]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[#60A5FA]">
            <Sparkles size={11} className="text-[#00D2FF]" />
            <span>Interactive 3D Isometric Stack</span>
          </span>
          <span className="text-[#9FB0B3]/40">|</span>
          <span className="hidden sm:inline-block font-mono text-[9px] text-[#9FB0B3]/60">
            Drag to Orbit • Click layer to Inspect
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomIn}
            className="w-7 h-7 rounded bg-[#0E1E26] border border-[rgba(120,200,210,0.2)] text-[#F4F7F7] hover:bg-[#152B36] hover:border-[#00D2FF]/50 flex items-center justify-center transition shadow-sm cursor-pointer"
            title="Zoom In 3D Canvas"
          >
            <ZoomIn size={12} className="text-[#00D2FF]" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-7 h-7 rounded bg-[#0E1E26] border border-[rgba(120,200,210,0.2)] text-[#F4F7F7] hover:bg-[#152B36] hover:border-[#00D2FF]/50 flex items-center justify-center transition shadow-sm cursor-pointer"
            title="Zoom Out 3D Canvas"
          >
            <ZoomOut size={12} className="text-[#00D2FF]" />
          </button>
          <button
            onClick={handleResetView}
            className="flex items-center gap-1 px-2.5 h-7 rounded bg-[#0E1E26] border border-[rgba(120,200,210,0.2)] text-[#F4F7F7] hover:bg-[#152B36] hover:border-[#00D2FF]/50 transition shadow-sm cursor-pointer"
          >
            <RotateCcw size={10} className="text-[#00D2FF]" />
            <span>Fit Stack</span>
          </button>
        </div>
      </div>
    </div>
  );
};

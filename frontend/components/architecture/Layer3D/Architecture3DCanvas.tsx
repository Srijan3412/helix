'use client';

import React, { useRef, Suspense, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { LayerItemData, Architecture3DProps } from './types';
import { Architecture3DModel } from './Architecture3DModel';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Maximize2,
} from 'lucide-react';

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

// Precision Studio Lighting Environment for Cyberpunk Architectural Render
function StudioLighting() {
  return (
    <>
      {/* Deep Ambient Fill for Soft Shading in Cavities */}
      <ambientLight intensity={1.1} color="#0B1926" />

      {/* Master Key Light (Crisp White Highlights with Soft Shadows) */}
      <directionalLight
        position={[12, 14, 15]}
        intensity={3.0}
        color="#FFFFFF"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />

      {/* Master Fill Light (Vibrant Cyan Fill for Metallic Plates) */}
      <directionalLight position={[-10, 8, 10]} intensity={1.8} color="#67E8F9" />

      {/* Master Rim Light (Top-Back High Angle for Razor Edge Glints) */}
      <directionalLight position={[0, 10, -12]} intensity={2.6} color="#E0F2FE" />

      {/* Bottom Uplight / Wash (Deep Blue / Cyan Uplight on Plinths & Mirror Floor) */}
      <directionalLight position={[0, -8, 6]} intensity={1.4} color="#0284C7" />

      {/* Front Accent Fill Light */}
      <directionalLight position={[2, 3, 14]} intensity={0.9} color="#38BDF8" />
    </>
  );
}

export const Architecture3DCanvas: React.FC<Architecture3DProps> = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  searchQuery = '',
  routes = [],
  dbType,
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [activeViewMode, setActiveViewMode] = useState<
    'hero' | 'front' | 'top' | 'bottom'
  >('hero');

  // Camera presets
  const setCameraView = useCallback((mode: 'hero' | 'front' | 'top' | 'bottom') => {
    setActiveViewMode(mode);
    if (!controlsRef.current) return;
    const camera = controlsRef.current.object as THREE.PerspectiveCamera;
    if (!camera) return;

    if (mode === 'hero') {
      camera.position.set(14.0, 10.5, 17.5);
      camera.zoom = 1;
      camera.lookAt(0, 0, 0);
      controlsRef.current.target.set(0, 0, 0);
    } else if (mode === 'front') {
      camera.position.set(0, 0.5, 23.0);
      camera.zoom = 1;
      camera.lookAt(0, 0, 0);
      controlsRef.current.target.set(0, 0, 0);
    } else if (mode === 'top') {
      camera.position.set(8.5, 8.5, 9.5);
      camera.zoom = 1.15;
      camera.lookAt(0, 2.5, 0);
      controlsRef.current.target.set(0, 2.5, 0);
    } else if (mode === 'bottom') {
      camera.position.set(8.5, -1.5, 9.5);
      camera.zoom = 1.15;
      camera.lookAt(0, -2.5, 0);
      controlsRef.current.target.set(0, -2.5, 0);
    }
    camera.updateProjectionMatrix();
    controlsRef.current.update();
  }, []);

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
        camera.zoom = Math.max(camera.zoom / 1.25, 0.55);
        camera.updateProjectionMatrix();
      }
    }
  };

  const handleResetView = () => {
    setCameraView('hero');
  };

  return (
    <div className="relative w-full h-full min-h-[580px] bg-[#040B10] rounded-xl overflow-hidden select-none flex flex-col justify-between border border-[rgba(120,200,210,0.14)] shadow-2xl">
      {/* Background Studio Dark Radial Vignette & Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 z-0"
        style={{
          background:
            'radial-gradient(circle at 50% 40%, rgba(0, 210, 255, 0.08) 0%, rgba(4, 11, 16, 0.95) 75%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-10 z-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0, 210, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 210, 255, 0.08) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Three.js Canvas Viewport with Precision 3D Model Render */}
      <div className="absolute inset-0 z-10">
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
          }}
        >
          <PerspectiveCamera makeDefault position={[14.0, 10.5, 17.5]} fov={36} />
          <OrbitControls
            ref={controlsRef}
            target={[0, 0, 0]}
            enablePan={true}
            enableZoom={true}
            minDistance={7.0}
            maxDistance={35.0}
            maxPolarAngle={Math.PI / 2.05}
            minPolarAngle={Math.PI / 5.5}
            dampingFactor={0.06}
          />
          <StudioLighting />
          <Suspense
            fallback={
              <Html center>
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#061F28]/90 border border-[#00D2FF]/30 backdrop-blur-md text-zinc-300 font-mono text-xs">
                  <div className="w-5 h-5 border-2 border-[#00D2FF] border-t-transparent rounded-full animate-spin" />
                  <span>Loading Master 3D Architecture Stack...</span>
                </div>
              </Html>
            }
          >
            <Architecture3DModel
              layers={layers}
              selectedLayerId={selectedLayerId}
              onSelectLayer={onSelectLayer}
              searchQuery={searchQuery}
              routes={routes}
              dbType={dbType}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Floating Controls HUD at Bottom */}
      <div className="relative z-30 mt-auto flex flex-wrap items-center justify-between gap-2 p-3 border-t border-[rgba(120,200,210,0.12)] bg-[#050E13]/85 backdrop-blur-md text-[10px] text-[#9FB0B3]">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 font-mono text-[#00D2FF] font-semibold">
            <Sparkles size={12} className="text-[#00D2FF] animate-pulse" />
            <span>Master 3D Architecture Stack</span>
          </span>
          <span className="text-[#9FB0B3]/30">|</span>
          <span className="hidden md:inline-block font-mono text-[9px] text-[#9FB0B3]/70">
            PBR Studio Lighting • Interactive 6-Layer Hierarchy • Click slab to Inspect
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Preset Camera Views */}
          <div className="flex items-center bg-[#09171D] rounded-lg p-0.5 border border-[rgba(120,200,210,0.15)] mr-1">
            <button
              onClick={() => setCameraView('hero')}
              className={`px-2 py-1 rounded text-[9px] font-mono transition ${
                activeViewMode === 'hero'
                  ? 'bg-[#00D2FF]/20 text-[#00D2FF] font-bold'
                  : 'text-[#9FB0B3] hover:text-[#F4F7F7]'
              }`}
              title="3/4 Isometric Hero View"
            >
              Hero Iso
            </button>
            <button
              onClick={() => setCameraView('front')}
              className={`px-2 py-1 rounded text-[9px] font-mono transition ${
                activeViewMode === 'front'
                  ? 'bg-[#00D2FF]/20 text-[#00D2FF] font-bold'
                  : 'text-[#9FB0B3] hover:text-[#F4F7F7]'
              }`}
              title="Front Orthogonal View"
            >
              Front
            </button>
            <button
              onClick={() => setCameraView('top')}
              className={`px-2 py-1 rounded text-[9px] font-mono transition ${
                activeViewMode === 'top'
                  ? 'bg-[#00D2FF]/20 text-[#00D2FF] font-bold'
                  : 'text-[#9FB0B3] hover:text-[#F4F7F7]'
              }`}
              title="Top Stack Closeup (Routes & Logic)"
            >
              Top Close
            </button>
            <button
              onClick={() => setCameraView('bottom')}
              className={`px-2 py-1 rounded text-[9px] font-mono transition ${
                activeViewMode === 'bottom'
                  ? 'bg-[#00D2FF]/20 text-[#00D2FF] font-bold'
                  : 'text-[#9FB0B3] hover:text-[#F4F7F7]'
              }`}
              title="Bottom Stack Closeup (Database & Cloud)"
            >
              Bottom Close
            </button>
          </div>

          {/* Zoom and Reset Controls */}
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
            title="Reset to Default View"
          >
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Html } from '@react-three/drei';
import * as THREE from 'three';
import { LayerItemData } from './types';
import { Route, Terminal, Cog, Database, Shield, Cloud } from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  routes: Route,
  controllers: Terminal,
  services: Cog,
  repositories: Database,
  middleware: Shield,
  external: Cloud,
};

interface LayerPlatformProps {
  layer: LayerItemData;
  index: number;
  yPos: number;
  isSelected: boolean;
  onSelect: () => void;
  fileCount: number;
  searchMatch?: boolean;
}

export const LayerPlatform: React.FC<LayerPlatformProps> = ({
  layer,
  index,
  yPos,
  isSelected,
  onSelect,
  fileCount,
  searchMatch = true,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Smooth hover and selection elevation lerp
  const targetY = yPos + (isSelected ? 0.22 : hovered ? 0.12 : 0);
  const targetScale = isSelected ? 1.035 : hovered ? 1.018 : 1.0;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const factor = Math.min(1, delta * 10);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, factor);
    
    const curScale = groupRef.current.scale.x;
    const nextScale = THREE.MathUtils.lerp(curScale, targetScale, factor);
    groupRef.current.scale.set(nextScale, nextScale, nextScale);
  });

  const IconComponent = ICON_MAP[layer.id] || Route;

  // Generate deterministic mini 3D cityscape module blocks on top of the platform
  const moduleBlocks = useMemo(() => {
    const blocks: Array<{
      x: number;
      z: number;
      w: number;
      h: number;
      d: number;
      color: string;
      isCylinder?: boolean;
    }> = [];

    // Base seed from layer id
    let seed = layer.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const count = Math.min(Math.max(fileCount > 0 ? Math.min(fileCount, 8) : 5, 4), 9);
    const gridCols = 4;

    for (let i = 0; i < count; i++) {
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);
      const x = -1.8 + col * 1.15 + (pseudoRandom() - 0.5) * 0.25;
      const z = -0.75 + row * 1.35 + (pseudoRandom() - 0.5) * 0.2;
      const w = 0.45 + pseudoRandom() * 0.35;
      const d = 0.45 + pseudoRandom() * 0.35;
      const h = 0.18 + pseudoRandom() * 0.45;

      const isCylinder = layer.id === 'repositories' && i % 2 === 1;

      blocks.push({
        x,
        z,
        w,
        h,
        d,
        color: layer.color,
        isCylinder,
      });
    }

    return blocks;
  }, [layer.id, layer.color, fileCount]);

  return (
    <group
      ref={groupRef}
      position={[0, yPos, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Main Extruded Symmetrical Slab */}
      <RoundedBox
        args={[6.4, 0.42, 3.4]}
        radius={0.08}
        smoothness={4}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial
          color={isSelected ? layer.color : '#0A151D'}
          roughness={0.25}
          metalness={0.75}
          emissive={layer.color}
          emissiveIntensity={isSelected ? 0.38 : hovered ? 0.22 : 0.08}
          transparent
          opacity={searchMatch ? 0.94 : 0.4}
        />
      </RoundedBox>

      {/* Glowing Top Surface Inset Plate */}
      <mesh position={[0, 0.215, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.1, 3.1]} />
        <meshStandardMaterial
          color={layer.color}
          roughness={0.3}
          metalness={0.4}
          transparent
          opacity={isSelected ? 0.3 : hovered ? 0.22 : 0.12}
        />
      </mesh>

      {/* 3D Modular Blocks on Top Face */}
      <group position={[0, 0.22, 0]}>
        {moduleBlocks.map((blk, bi) => {
          if (blk.isCylinder) {
            return (
              <group key={bi} position={[blk.x, blk.h / 2, blk.z]}>
                <mesh>
                  <cylinderGeometry args={[blk.w * 0.45, blk.w * 0.45, blk.h, 16]} />
                  <meshStandardMaterial
                    color="#111E26"
                    roughness={0.3}
                    metalness={0.8}
                    emissive={blk.color}
                    emissiveIntensity={0.25}
                  />
                </mesh>
                {/* Glowing disc cap */}
                <mesh position={[0, blk.h / 2 + 0.005, 0]}>
                  <cylinderGeometry args={[blk.w * 0.45, blk.w * 0.45, 0.02, 16]} />
                  <meshBasicMaterial color={layer.glowColor || blk.color} />
                </mesh>
              </group>
            );
          }

          return (
            <group key={bi} position={[blk.x, blk.h / 2, blk.z]}>
              {/* Base block structure */}
              <mesh>
                <boxGeometry args={[blk.w, blk.h, blk.d]} />
                <meshStandardMaterial
                  color="#0D1A22"
                  roughness={0.3}
                  metalness={0.8}
                  emissive={blk.color}
                  emissiveIntensity={0.2}
                />
              </mesh>
              {/* Glowing top cap */}
              <mesh position={[0, blk.h / 2 + 0.005, 0]}>
                <boxGeometry args={[blk.w * 0.92, 0.02, blk.d * 0.92]} />
                <meshBasicMaterial color={layer.glowColor || blk.color} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Front Edge Interactive Tag via HTML overlay */}
      <Html
        position={[-3.05, 0, 1.72]}
        transform
        distanceFactor={6.8}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border backdrop-blur-md transition-all duration-300 select-none ${
            isSelected
              ? 'bg-[#081216]/95 scale-105 shadow-xl'
              : hovered
              ? 'bg-[#081216]/90'
              : 'bg-[#081216]/80'
          }`}
          style={{
            borderColor: isSelected ? layer.color : hovered ? layer.borderColor : 'rgba(255,255,255,0.08)',
            boxShadow: isSelected ? `0 0 20px ${layer.bgColor}` : '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          {/* Layer Number Badge */}
          <span
            className="text-xs font-black px-1.5 py-0.5 rounded tracking-wider"
            style={{
              color: layer.color,
              backgroundColor: layer.bgColor,
              border: `1px solid ${layer.borderColor}`,
            }}
          >
            {layer.num}
          </span>

          {/* Layer Icon */}
          <div className="p-1 rounded" style={{ backgroundColor: layer.bgColor }}>
            <IconComponent size={14} style={{ color: layer.color }} />
          </div>

          {/* Layer Name */}
          <span className="text-xs font-extrabold text-[#F4F7F7] tracking-wide whitespace-nowrap">
            {layer.name}
          </span>

          {/* Optional Code Badge or File Count */}
          {layer.badgeText && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/50 text-[#9FB0B3] border border-white/10 hidden sm:inline-block">
              {layer.badgeText}
            </span>
          )}
        </div>
      </Html>

      {/* Right Edge File Count Badge */}
      <Html
        position={[2.9, 0, 1.72]}
        transform
        distanceFactor={6.8}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-[#9FB0B3] bg-black/60 border border-white/10 select-none whitespace-nowrap"
          style={{ borderColor: isSelected ? layer.borderColor : 'rgba(255,255,255,0.08)' }}
        >
          {fileCount} {fileCount === 1 ? 'file' : 'files'}
        </div>
      </Html>
    </group>
  );
};

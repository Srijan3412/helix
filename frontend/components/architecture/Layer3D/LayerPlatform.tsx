'use client';

import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Html } from '@react-three/drei';
import * as THREE from 'three';
import { LayerItemData } from './types';
import { Globe } from 'lucide-react';

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
  const beamPulseRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Smooth hover and selection elevation
  const targetY = yPos + (isSelected ? 0.25 : hovered ? 0.12 : 0);
  const targetScale = isSelected ? 1.025 : hovered ? 1.012 : 1.0;

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const factor = Math.min(1, delta * 12);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, factor);

    const curScale = groupRef.current.scale.x;
    const nextScale = THREE.MathUtils.lerp(curScale, targetScale, factor);
    groupRef.current.scale.set(nextScale, nextScale, nextScale);

    // Subtle breathing pulse on the cyan beam if routes layer
    if (beamPulseRef.current && layer.id === 'routes') {
      const pulse = 1 + Math.sin(state.clock.getElapsedTime() * 3) * 0.08;
      beamPulseRef.current.scale.set(pulse, 1, pulse);
    }
  });

  // Deterministic layer-specific module layout
  const layerModules = useMemo(() => {
    switch (layer.id) {
      case 'routes':
        return [
          { x: -1.8, z: -0.7, w: 0.6, d: 0.5, h: 0.16, label: 'GET', color: '#00E5FF' },
          { x: -1.0, z: -0.7, w: 0.6, d: 0.5, h: 0.22, label: 'POST', color: '#2F80ED' },
          { x: -1.8, z: 0.1, w: 0.6, d: 0.5, h: 0.14, label: 'PUT', color: '#8B5CF6' },
          { x: -1.0, z: 0.1, w: 0.6, d: 0.5, h: 0.12, label: 'DELETE', color: '#FF3344' },
          { x: 1.8, z: 0.7, w: 0.5, d: 0.4, h: 0.18, label: 'OPT', color: '#00E5FF' },
        ];
      case 'controllers':
        return [
          { x: -1.6, z: -0.5, w: 0.75, d: 0.55, h: 0.20, label: 'AuthHandler', color: '#8B5CF6' },
          { x: -0.6, z: -0.5, w: 0.75, d: 0.55, h: 0.24, label: 'UserHandler', color: '#8B5CF6' },
          { x: 0.6, z: -0.5, w: 0.75, d: 0.55, h: 0.18, label: 'ScanHandler', color: '#A855F7' },
          { x: 1.6, z: -0.5, w: 0.75, d: 0.55, h: 0.22, label: 'ReportHandler', color: '#A855F7' },
          { x: -0.6, z: 0.4, w: 0.65, d: 0.45, h: 0.15, label: 'Validator', color: '#C084FC' },
          { x: 0.6, z: 0.4, w: 0.65, d: 0.45, h: 0.15, label: 'Transformer', color: '#C084FC' },
        ];
      case 'services':
        return [
          { x: -1.5, z: -0.4, w: 0.8, d: 0.6, h: 0.26, label: 'AnalysisEngine', color: '#F59E0B' },
          { x: -0.4, z: -0.4, w: 0.8, d: 0.6, h: 0.22, label: 'ParserService', color: '#F59E0B' },
          { x: 0.7, z: -0.4, w: 0.8, d: 0.6, h: 0.28, label: 'GraphBuilder', color: '#FBBF24' },
          { x: 1.7, z: -0.4, w: 0.7, d: 0.5, h: 0.19, label: 'AuthService', color: '#FBBF24' },
          { x: 0.2, z: 0.45, w: 0.7, d: 0.45, h: 0.16, label: 'Notification', color: '#FCD34D' },
        ];
      case 'repositories':
        return [
          { x: -1.5, z: -0.4, w: 0.65, d: 0.65, h: 0.25, isCylinder: true, label: 'UserRepo', color: '#EC4899' },
          { x: -0.5, z: -0.4, w: 0.65, d: 0.65, h: 0.30, isCylinder: true, label: 'ScanRepo', color: '#EC4899' },
          { x: 0.5, z: -0.4, w: 0.65, d: 0.65, h: 0.28, isCylinder: true, label: 'ReportRepo', color: '#F472B6' },
          { x: 1.5, z: -0.4, w: 0.65, d: 0.65, h: 0.22, isCylinder: true, label: 'CacheStore', color: '#F472B6' },
          { x: 0.0, z: 0.45, w: 0.75, d: 0.45, h: 0.15, label: 'PoolManager', color: '#F43F7A' },
        ];
      case 'middleware':
        return [
          { x: -1.4, z: -0.4, w: 0.7, d: 0.55, h: 0.22, label: 'AuthGuard', color: '#14B8A6' },
          { x: -0.4, z: -0.4, w: 0.7, d: 0.55, h: 0.19, label: 'RateLimiter', color: '#14B8A6' },
          { x: 0.6, z: -0.4, w: 0.7, d: 0.55, h: 0.24, label: 'CorsFilter', color: '#2DD4BF' },
          { x: 1.5, z: -0.4, w: 0.7, d: 0.55, h: 0.17, label: 'Logger', color: '#2DD4BF' },
          { x: 0.1, z: 0.45, w: 0.8, d: 0.45, h: 0.16, label: 'ErrorHandler', color: '#5EEAD4' },
        ];
      case 'external':
        return [
          { x: -1.4, z: -0.4, w: 0.75, d: 0.55, h: 0.22, label: 'GitHubAPI', color: '#60A5FA' },
          { x: -0.3, z: -0.4, w: 0.75, d: 0.55, h: 0.25, label: 'StripePayment', color: '#60A5FA' },
          { x: 0.8, z: -0.4, w: 0.75, d: 0.55, h: 0.20, label: 'EmailGateway', color: '#93C5FD' },
          { x: 1.7, z: -0.4, w: 0.65, d: 0.5, h: 0.18, label: 'S3Storage', color: '#93C5FD' },
        ];
      default:
        return [];
    }
  }, [layer.id]);

  const isRoutes = layer.id === 'routes';

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
      {/* ── 1. MAIN THICK BEVELED ARCHITECTURAL SLAB ── */}
      <RoundedBox
        args={[5.2, 0.44, 2.8]}
        radius={0.08}
        smoothness={4}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial
          color={isSelected ? '#14202C' : '#0F1822'}
          roughness={0.42}
          metalness={0.28}
          emissive={isSelected ? layer.color : '#0A121A'}
          emissiveIntensity={isSelected ? 0.25 : hovered ? 0.15 : 0.04}
          transparent
          opacity={searchMatch ? 0.98 : 0.45}
        />
      </RoundedBox>

      {/* ── 2. TOP FACE RECESSED METALLIC PLATE ── */}
      <mesh position={[0, 0.221, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.96, 2.56]} />
        <meshStandardMaterial
          color={isSelected ? '#182736' : '#121E2A'}
          roughness={0.35}
          metalness={0.35}
        />
      </mesh>

      {/* ── 3. GLOWING NEON CONTOUR BASE RIM ── */}
      <mesh position={[0, -0.21, 0]}>
        <boxGeometry args={[5.22, 0.03, 2.82]} />
        <meshBasicMaterial
          color={layer.glowColor || layer.color}
          transparent
          opacity={isSelected ? 0.9 : hovered ? 0.6 : 0.25}
        />
      </mesh>

      {/* ── 4. SURFACE CONDUIT GROOVES & INDICATORS (Industrial Details) ── */}
      <group position={[0, 0.223, 0]}>
        {/* Horizontal conduit line */}
        <mesh position={[0, 0, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.2, 0.03]} />
          <meshBasicMaterial color={layer.color} transparent opacity={isSelected ? 0.7 : 0.3} />
        </mesh>
        {/* Micro indicator LEDs */}
        <mesh position={[2.0, 0.01, 0.9]}>
          <boxGeometry args={[0.2, 0.02, 0.1]} />
          <meshStandardMaterial color="#0A141C" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[2.0, 0.025, 0.9]}>
          <boxGeometry args={[0.06, 0.01, 0.04]} />
          <meshBasicMaterial color="#00E5FF" />
        </mesh>
        <mesh position={[2.1, 0.025, 0.9]}>
          <boxGeometry args={[0.06, 0.01, 0.04]} />
          <meshBasicMaterial color="#F59E0B" />
        </mesh>
      </group>

      {/* ── 5. ROUTES LAYER SPECIFIC: PHYSICAL GATEWAY & CYAN LIGHT BEAM ── */}
      {isRoutes && (
        <group position={[0.4, 0.22, -0.2]}>
          {/* Raised Gateway Industrial Housing Base */}
          <RoundedBox args={[1.35, 0.24, 0.95]} radius={0.04} smoothness={3} position={[-0.45, 0.12, 0]}>
            <meshStandardMaterial color="#182736" roughness={0.35} metalness={0.4} />
          </RoundedBox>

          {/* Vertical Gateway Sign Slab (/api/v1/*) */}
          <RoundedBox args={[0.9, 0.85, 0.1]} radius={0.04} smoothness={3} position={[-0.45, 0.55, 0]}>
            <meshStandardMaterial
              color="#0B151F"
              roughness={0.2}
              metalness={0.6}
              emissive="#00D2FF"
              emissiveIntensity={0.2}
            />
          </RoundedBox>

          {/* Glowing Front Badge on Gateway Sign */}
          <Html position={[-0.45, 0.55, 0.06]} transform distanceFactor={5.5} style={{ pointerEvents: 'none' }}>
            <div className="flex flex-col items-center justify-center p-2 text-center select-none">
              <div className="text-[12px] font-mono font-black text-[#F4F7F7] tracking-wider drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]">
                /api/v1/*
              </div>
              <div className="mt-1.5 w-7 h-7 rounded-full bg-[#00E5FF]/20 border border-[#00E5FF] flex items-center justify-center shadow-[0_0_12px_rgba(0,229,255,0.5)]">
                <Globe size={15} className="text-[#00E5FF]" />
              </div>
            </div>
          </Html>

          {/* Cyan Light Beam Emitter Base (Raised block next to gateway) */}
          <RoundedBox args={[0.65, 0.32, 0.65]} radius={0.04} smoothness={3} position={[0.65, 0.16, 0]}>
            <meshStandardMaterial color="#182736" roughness={0.35} metalness={0.4} />
          </RoundedBox>

          {/* Glowing Concentric Base Ring */}
          <mesh position={[0.65, 0.325, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.12, 0.24, 24]} />
            <meshBasicMaterial color="#00E5FF" side={THREE.DoubleSide} />
          </mesh>

          {/* Vertical Cyan Light Column / Beam */}
          <mesh ref={beamPulseRef} position={[0.65, 0.95, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 1.25, 16]} />
            <meshBasicMaterial color="#00E5FF" transparent opacity={0.85} />
          </mesh>

          {/* Neon Conduit Pipes connecting Gateway to Emitter */}
          <mesh position={[0.1, 0.16, 0.15]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.025, 0.025, 0.6, 12]} />
            <meshBasicMaterial color="#00E5FF" />
          </mesh>
          <mesh position={[0.1, 0.16, -0.15]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.025, 0.025, 0.6, 12]} />
            <meshBasicMaterial color="#F59E0B" />
          </mesh>
        </group>
      )}

      {/* ── 6. DATA-DRIVEN 3D MODULE BLOCKS ── */}
      <group position={[0, 0.22, 0]}>
        {layerModules.map((blk, bi) => {
          if (blk.isCylinder) {
            return (
              <group key={bi} position={[blk.x, blk.h / 2, blk.z]}>
                <mesh>
                  <cylinderGeometry args={[blk.w * 0.45, blk.w * 0.45, blk.h, 20]} />
                  <meshStandardMaterial
                    color="#13202C"
                    roughness={0.3}
                    metalness={0.7}
                    emissive={blk.color}
                    emissiveIntensity={0.18}
                  />
                </mesh>
                {/* Glowing Top Cap */}
                <mesh position={[0, blk.h / 2 + 0.005, 0]}>
                  <cylinderGeometry args={[blk.w * 0.42, blk.w * 0.42, 0.02, 20]} />
                  <meshBasicMaterial color={blk.color} />
                </mesh>
              </group>
            );
          }

          return (
            <group key={bi} position={[blk.x, blk.h / 2, blk.z]}>
              <mesh>
                <boxGeometry args={[blk.w, blk.h, blk.d]} />
                <meshStandardMaterial
                  color="#13202C"
                  roughness={0.3}
                  metalness={0.7}
                  emissive={blk.color}
                  emissiveIntensity={0.16}
                />
              </mesh>
              {/* Glowing Colored Top Surface */}
              <mesh position={[0, blk.h / 2 + 0.005, 0]}>
                <boxGeometry args={[blk.w * 0.92, 0.02, blk.d * 0.92]} />
                <meshBasicMaterial color={blk.color} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* ── 7. INTEGRATED FRONT-FACE LAYER LABEL (Matching Reference Design) ── */}
      <group position={[-1.25, 0, 1.41]}>
        <Html
          transform
          distanceFactor={5.6}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex items-center gap-3.5 select-none w-[340px] text-left">
            {/* Illuminated Layer Number Block Badge */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center font-mono font-extrabold text-xl shadow-lg shrink-0 border"
              style={{
                backgroundColor: isSelected ? layer.color : '#0B1C28',
                color: isSelected ? '#061318' : layer.glowColor || layer.color,
                borderColor: layer.color,
                boxShadow: `0 0 16px ${layer.bgColor}`,
              }}
            >
              {layer.num}
            </div>

            {/* Layer Typography */}
            <div className="flex flex-col min-w-0">
              <h3 className="text-base font-extrabold text-[#F4F7F7] tracking-tight leading-none">
                {layer.name}
              </h3>
              <p className="text-[11px] font-medium text-[#A4B5B8] leading-tight mt-1 truncate">
                {layer.shortDesc}
              </p>
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
};

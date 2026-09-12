'use client';

import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Html } from '@react-three/drei';
import * as THREE from 'three';
import { LayerItemData } from './types';

interface LayerPlatformProps {
  layer: LayerItemData;
  index: number;
  yPos: number;
  isSelected: boolean;
  onSelect: () => void;
  fileCount: number;
  searchMatch?: boolean;
}

// Visual theme configurations for each layer matching architectural reference
const LAYER_THEMES: Record<
  string,
  {
    baseColor: string;
    selectedBaseColor: string;
    topPlateColor: string;
    selectedTopPlateColor: string;
    capColor: string;
    glowColor: string;
    accentGlow: string;
  }
> = {
  routes: {
    baseColor: '#0A2744',
    selectedBaseColor: '#0E365E',
    topPlateColor: '#153F66',
    selectedTopPlateColor: '#1C5285',
    capColor: '#62D5EA',
    glowColor: '#00E5FF',
    accentGlow: '#00D2FF',
  },
  controllers: {
    baseColor: '#1E1038',
    selectedBaseColor: '#2B174F',
    topPlateColor: '#301A52',
    selectedTopPlateColor: '#422370',
    capColor: '#D946EF',
    glowColor: '#C084FC',
    accentGlow: '#E879F9',
  },
  services: {
    baseColor: '#2A1B0A',
    selectedBaseColor: '#3B260E',
    topPlateColor: '#3D270E',
    selectedTopPlateColor: '#543614',
    capColor: '#FBBF24',
    glowColor: '#FCD34D',
    accentGlow: '#F59E0B',
  },
  repositories: {
    baseColor: '#280E1C',
    selectedBaseColor: '#3A1428',
    topPlateColor: '#3B152A',
    selectedTopPlateColor: '#521D3A',
    capColor: '#F472B6',
    glowColor: '#FB7185',
    accentGlow: '#EC4899',
  },
  middleware: {
    baseColor: '#0A2422',
    selectedBaseColor: '#0E3330',
    topPlateColor: '#0F3B36',
    selectedTopPlateColor: '#16524B',
    capColor: '#34D399',
    glowColor: '#2DD4BF',
    accentGlow: '#10B981',
  },
  external: {
    baseColor: '#0C2036',
    selectedBaseColor: '#112C4A',
    topPlateColor: '#133452',
    selectedTopPlateColor: '#1A466E',
    capColor: '#93C5FD',
    glowColor: '#60A5FA',
    accentGlow: '#3B82F6',
  },
};

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
  const beam1Ref = useRef<THREE.Mesh>(null);
  const beam2Ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const theme = LAYER_THEMES[layer.id] || LAYER_THEMES.routes;
  const isRoutes = layer.id === 'routes';

  // Smooth elevation on hover / selection
  const targetY = yPos + (isSelected ? 0.22 : hovered ? 0.10 : 0);
  const targetScale = isSelected ? 1.02 : hovered ? 1.01 : 1.0;

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const factor = Math.min(1, delta * 12);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, factor);

    const curScale = groupRef.current.scale.x;
    const nextScale = THREE.MathUtils.lerp(curScale, targetScale, factor);
    groupRef.current.scale.set(nextScale, nextScale, nextScale);

    // Subtle rhythmic pulse on incoming traffic beams
    if (isRoutes && beam1Ref.current && beam2Ref.current) {
      const t = state.clock.getElapsedTime();
      const pulse1 = 1 + Math.sin(t * 3.5) * 0.09;
      const pulse2 = 1 + Math.sin(t * 3.5 + 1.2) * 0.09;
      beam1Ref.current.scale.set(pulse1, 1, pulse1);
      beam2Ref.current.scale.set(pulse2, 1, pulse2);
    }
  });

  // Layer-specific architectural module layouts
  const modules = useMemo(() => {
    switch (layer.id) {
      case 'routes':
        return [
          { x: -1.7, z: -0.35, w: 0.65, d: 0.55, h: 0.28, label: 'GET' },
          { x: -1.6, z: 0.45, w: 0.60, d: 0.50, h: 0.20, label: 'POST' },
          { x: 1.6, z: -0.35, w: 0.70, d: 0.55, h: 0.35, label: 'PUT' },
          { x: 1.5, z: 0.45, w: 0.55, d: 0.45, h: 0.18, label: 'DELETE' },
        ];
      case 'controllers':
        return [
          { x: -1.6, z: -0.4, w: 0.75, d: 0.55, h: 0.25, label: 'AuthHandler' },
          { x: -0.5, z: -0.4, w: 0.75, d: 0.55, h: 0.32, label: 'UserHandler' },
          { x: 0.6, z: -0.4, w: 0.75, d: 0.55, h: 0.22, label: 'ScanHandler' },
          { x: 1.6, z: -0.4, w: 0.75, d: 0.55, h: 0.28, label: 'ReportHandler' },
          { x: -0.5, z: 0.45, w: 0.65, d: 0.45, h: 0.16, label: 'Validator' },
          { x: 0.6, z: 0.45, w: 0.65, d: 0.45, h: 0.16, label: 'Transformer' },
        ];
      case 'services':
        return [
          { x: -1.5, z: -0.35, w: 0.80, d: 0.60, h: 0.32, label: 'AnalysisEngine' },
          { x: -0.4, z: -0.35, w: 0.80, d: 0.60, h: 0.26, label: 'ParserService' },
          { x: 0.7, z: -0.35, w: 0.80, d: 0.60, h: 0.34, label: 'GraphBuilder' },
          { x: 1.7, z: -0.35, w: 0.70, d: 0.50, h: 0.22, label: 'AuthService' },
          { x: 0.2, z: 0.45, w: 0.70, d: 0.45, h: 0.18, label: 'Notification' },
        ];
      case 'repositories':
        return [
          { x: -1.5, z: -0.35, w: 0.65, d: 0.65, h: 0.30, isCylinder: true, label: 'UserRepo' },
          { x: -0.5, z: -0.35, w: 0.65, d: 0.65, h: 0.38, isCylinder: true, label: 'ScanRepo' },
          { x: 0.5, z: -0.35, w: 0.65, d: 0.65, h: 0.34, isCylinder: true, label: 'ReportRepo' },
          { x: 1.5, z: -0.35, w: 0.65, d: 0.65, h: 0.26, isCylinder: true, label: 'CacheStore' },
          { x: 0.0, z: 0.45, w: 0.75, d: 0.45, h: 0.16, label: 'PoolManager' },
        ];
      case 'middleware':
        return [
          { x: -1.4, z: -0.35, w: 0.70, d: 0.55, h: 0.26, label: 'AuthGuard' },
          { x: -0.4, z: -0.35, w: 0.70, d: 0.55, h: 0.22, label: 'RateLimiter' },
          { x: 0.6, z: -0.35, w: 0.70, d: 0.55, h: 0.30, label: 'CorsFilter' },
          { x: 1.5, z: -0.35, w: 0.70, d: 0.55, h: 0.20, label: 'Logger' },
          { x: 0.1, z: 0.45, w: 0.80, d: 0.45, h: 0.18, label: 'ErrorHandler' },
        ];
      case 'external':
        return [
          { x: -1.4, z: -0.35, w: 0.75, d: 0.55, h: 0.28, label: 'GitHubAPI' },
          { x: -0.3, z: -0.35, w: 0.75, d: 0.55, h: 0.32, label: 'StripePayment' },
          { x: 0.8, z: -0.35, w: 0.75, d: 0.55, h: 0.24, label: 'EmailGateway' },
          { x: 1.7, z: -0.35, w: 0.65, d: 0.50, h: 0.20, label: 'S3Storage' },
        ];
      default:
        return [];
    }
  }, [layer.id]);

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
      {/* ── 1. MAIN THICK BEVELED ARCHITECTURAL CHASSIS ── */}
      <RoundedBox
        args={[5.0, 0.42, 2.6]}
        radius={0.08}
        smoothness={4}
        position={[0, 0, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={isSelected ? theme.selectedBaseColor : theme.baseColor}
          roughness={0.38}
          metalness={0.28}
          emissive={theme.baseColor}
          emissiveIntensity={isSelected ? 0.3 : hovered ? 0.18 : 0.08}
          transparent
          opacity={searchMatch ? 0.98 : 0.4}
        />
      </RoundedBox>

      {/* ── 2. TOP FACE TECHNICAL METALLIC PLATE ── */}
      <mesh position={[0, 0.211, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4.76, 2.36]} />
        <meshStandardMaterial
          color={isSelected ? theme.selectedTopPlateColor : theme.topPlateColor}
          roughness={0.32}
          metalness={0.32}
        />
      </mesh>

      {/* ── 3. RECESSED / RAISED SURFACE PANELS & CONDUIT LINES ── */}
      <group position={[0, 0.212, 0]}>
        {/* Recessed technical sub-panel (left) */}
        <mesh position={[-1.2, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.9, 2.1]} />
          <meshStandardMaterial
            color={isSelected ? '#143657' : '#0E2842'}
            roughness={0.4}
            metalness={0.25}
          />
        </mesh>
        {/* Recessed technical sub-panel (right) */}
        <mesh position={[1.2, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.9, 2.1]} />
          <meshStandardMaterial
            color={isSelected ? '#143657' : '#0E2842'}
            roughness={0.4}
            metalness={0.25}
          />
        </mesh>

        {/* Thin luminous circuit conduit lines */}
        <mesh position={[0, 0.008, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.4, 0.025]} />
          <meshBasicMaterial color={theme.glowColor} transparent opacity={isSelected ? 0.75 : 0.4} />
        </mesh>
        <mesh position={[-0.1, 0.008, -0.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.025, 1.1]} />
          <meshBasicMaterial color={theme.glowColor} transparent opacity={isSelected ? 0.6 : 0.3} />
        </mesh>

        {/* Subtle LED status indicators */}
        <mesh position={[2.05, 0.015, 0.9]}>
          <boxGeometry args={[0.08, 0.01, 0.04]} />
          <meshBasicMaterial color={theme.glowColor} />
        </mesh>
        <mesh position={[2.18, 0.015, 0.9]}>
          <boxGeometry args={[0.08, 0.01, 0.04]} />
          <meshBasicMaterial color="#38BDF8" />
        </mesh>
      </group>

      {/* ── 4. LUMINOUS BEVELED CONTOUR BASE RIM ── */}
      <mesh position={[0, -0.205, 0]}>
        <boxGeometry args={[5.02, 0.025, 2.62]} />
        <meshBasicMaterial
          color={theme.glowColor}
          transparent
          opacity={isSelected ? 0.95 : hovered ? 0.65 : 0.3}
        />
      </mesh>

      {/* ── 5. ROUTES LAYER: EXACT ARCHITECTURAL TOWERS, GATEWAY & TRAFFIC BEAMS ── */}
      {isRoutes && (
        <group position={[0, 0.21, 0]}>
          {/* A. TALL BEACON TOWER 1 (Primary incoming traffic receiver) */}
          <group position={[-0.7, 0, -0.45]}>
            <RoundedBox args={[0.85, 0.72, 0.85]} radius={0.05} smoothness={3} position={[0, 0.36, 0]} castShadow receiveShadow>
              <meshStandardMaterial color="#0D253A" roughness={0.35} metalness={0.35} />
            </RoundedBox>
            {/* Bright cyan top face */}
            <mesh position={[0, 0.722, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.77, 0.77]} />
              <meshBasicMaterial color="#62D5EA" />
            </mesh>
            {/* Luminous circular beacon socket */}
            <mesh position={[0, 0.725, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.10, 0.22, 24]} />
              <meshBasicMaterial color="#00E5FF" side={THREE.DoubleSide} />
            </mesh>
            {/* Vertical Cyan Light Beam */}
            <mesh ref={beam1Ref} position={[0, 1.42, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 1.4, 16]} />
              <meshBasicMaterial color="#00E5FF" transparent opacity={0.85} />
            </mesh>
          </group>

          {/* B. SECONDARY BEACON TOWER 2 (Secondary traffic receiver) */}
          <group position={[0.6, 0, -0.45]}>
            <RoundedBox args={[0.75, 0.52, 0.75]} radius={0.05} smoothness={3} position={[0, 0.26, 0]} castShadow receiveShadow>
              <meshStandardMaterial color="#0D253A" roughness={0.35} metalness={0.35} />
            </RoundedBox>
            {/* Bright cyan top face */}
            <mesh position={[0, 0.522, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.67, 0.67]} />
              <meshBasicMaterial color="#62D5EA" />
            </mesh>
            {/* Luminous circular beacon socket */}
            <mesh position={[0, 0.525, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.08, 0.18, 24]} />
              <meshBasicMaterial color="#00E5FF" side={THREE.DoubleSide} />
            </mesh>
            {/* Vertical Cyan Light Beam */}
            <mesh ref={beam2Ref} position={[0, 1.22, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 1.4, 16]} />
              <meshBasicMaterial color="#00E5FF" transparent opacity={0.8} />
            </mesh>
          </group>

          {/* C. CENTRAL GATEWAY TOKEN / ROUTER CORE */}
          <group position={[-0.05, 0, 0.25]}>
            {/* Base platform pad */}
            <RoundedBox args={[0.85, 0.08, 0.85]} radius={0.03} smoothness={3} position={[0, 0.04, 0]} castShadow receiveShadow>
              <meshStandardMaterial color="#091A29" roughness={0.4} metalness={0.3} />
            </RoundedBox>
            {/* Cyan Core Block */}
            <RoundedBox args={[0.62, 0.22, 0.62]} radius={0.05} smoothness={3} position={[0, 0.19, 0]} castShadow receiveShadow>
              <meshStandardMaterial
                color="#0EA5E9"
                emissive="#00E5FF"
                emissiveIntensity={0.2}
                roughness={0.25}
                metalness={0.4}
              />
            </RoundedBox>
            {/* Glowing top face with router symbol */}
            <mesh position={[0, 0.302, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.54, 0.54]} />
              <meshBasicMaterial color="#62D5EA" />
            </mesh>
            <mesh position={[0, 0.304, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.08, 0.16, 20]} />
              <meshBasicMaterial color="#003B5C" side={THREE.DoubleSide} />
            </mesh>
          </group>

          {/* D. "INCOMING REQUESTS" 3D INTEGRATED ANCHOR & ARROWS */}
          <group position={[-0.05, 1.85, -0.45]}>
            <Html transform distanceFactor={5.2} style={{ pointerEvents: 'none' }}>
              <div className="flex flex-col items-center select-none text-center">
                <div className="text-[11.5px] font-sans font-bold text-[#F4FAFF] tracking-wide drop-shadow-[0_0_10px_rgba(0,229,255,0.7)] whitespace-nowrap">
                  Incoming Requests
                </div>
                <div className="flex items-center gap-12 mt-1">
                  <div className="w-4 h-4 rounded-full bg-[#00E5FF]/20 border border-[#00E5FF] flex items-center justify-center text-[10px] text-[#00E5FF] font-bold shadow-[0_0_8px_#00E5FF]">
                    ↓
                  </div>
                  <div className="w-4 h-4 rounded-full bg-[#00E5FF]/20 border border-[#00E5FF] flex items-center justify-center text-[10px] text-[#00E5FF] font-bold shadow-[0_0_8px_#00E5FF]">
                    ↓
                  </div>
                </div>
              </div>
            </Html>
          </group>
        </group>
      )}

      {/* ── 6. FLANKING ROUTE MODULES / LAYER BLOCKS ── */}
      <group position={[0, 0.21, 0]}>
        {modules.map((blk, bi) => {
          if (blk.isCylinder) {
            return (
              <group key={bi} position={[blk.x, blk.h / 2, blk.z]}>
                <mesh castShadow receiveShadow>
                  <cylinderGeometry args={[blk.w * 0.45, blk.w * 0.45, blk.h, 20]} />
                  <meshStandardMaterial
                    color={theme.baseColor}
                    roughness={0.35}
                    metalness={0.4}
                  />
                </mesh>
                {/* Glowing Top Cap */}
                <mesh position={[0, blk.h / 2 + 0.002, 0]}>
                  <cylinderGeometry args={[blk.w * 0.42, blk.w * 0.42, 0.01, 20]} />
                  <meshBasicMaterial color={theme.capColor} />
                </mesh>
              </group>
            );
          }

          return (
            <group key={bi} position={[blk.x, blk.h / 2, blk.z]}>
              <RoundedBox args={[blk.w, blk.h, blk.d]} radius={0.03} smoothness={3} castShadow receiveShadow>
                <meshStandardMaterial
                  color={theme.baseColor}
                  roughness={0.35}
                  metalness={0.4}
                />
              </RoundedBox>
              {/* Vibrant Colored Top Face */}
              <mesh position={[0, blk.h / 2 + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[blk.w * 0.88, blk.d * 0.88]} />
                <meshBasicMaterial color={theme.capColor} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* ── 7. SOLID INTEGRATED FRONT-FACE LAYER IDENTITY (Image 1 replica) ── */}
      <group position={[0, 0, 1.305]}>
        <Html
          transform
          distanceFactor={5.2}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="w-[500px] h-[40px] flex items-center justify-between px-3 select-none text-left">
            {/* Left section: Number Badge + Icon + Name + Description */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Number Badge (Bold Solid Block matching Image 1) */}
              <div
                className="px-2.5 py-1 rounded-lg font-mono font-black text-sm text-[#F4FAFF] shrink-0 border border-white/20 shadow-md flex items-center justify-center tracking-wider"
                style={{
                  backgroundColor: isSelected ? theme.accentGlow : '#00A8FF',
                  boxShadow: `0 0 14px ${theme.glowColor}50`,
                }}
              >
                {layer.num}
              </div>

              {/* 3-Node Connected Network Icon */}
              <div className="w-6 h-6 flex items-center justify-center text-[#00E5FF] shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current drop-shadow-[0_0_6px_#00E5FF]">
                  <circle cx="12" cy="5" r="3" />
                  <circle cx="5" cy="18" r="3" />
                  <circle cx="19" cy="18" r="3" />
                  <path d="M12 8v4m-5 3 3.5-3m6.5 3-3.5-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              {/* Layer Title & Description */}
              <div className="flex flex-col min-w-0">
                <span className="text-base font-black text-[#F4FAFF] tracking-tight leading-none drop-shadow-sm">
                  {layer.name}
                </span>
                <span className="text-[10px] font-semibold text-[#A2C4D8] leading-tight truncate mt-0.5">
                  {layer.shortDesc}
                </span>
              </div>
            </div>

            {/* Right face: Clean Route / Handler Badge */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/40 border border-[rgba(0,229,255,0.3)] text-[11px] font-mono font-bold text-[#F4FAFF] shrink-0 shadow-sm">
              <span className="text-[#00E5FF]">{layer.badgeText || '/api/v1/*'}</span>
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
};

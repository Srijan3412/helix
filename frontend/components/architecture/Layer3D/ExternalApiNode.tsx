'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { Cloud, Check } from 'lucide-react';

interface ExternalApiNodeProps {
  position?: [number, number, number];
  onSelectExternalLayer?: () => void;
}

export const ExternalApiNode: React.FC<ExternalApiNodeProps> = ({
  position = [4.0, -1.85, 0.3],
  onSelectExternalLayer,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const cloudMeshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (cloudMeshRef.current) {
      cloudMeshRef.current.position.y = 0.35 + Math.sin(state.clock.getElapsedTime() * 1.8) * 0.04;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelectExternalLayer?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Industrial Pedestal Base */}
      <RoundedBox args={[1.5, 0.16, 1.5]} radius={0.04} smoothness={3} position={[0, -0.25, 0]}>
        <meshStandardMaterial
          color="#101C26"
          roughness={0.35}
          metalness={0.4}
        />
      </RoundedBox>

      {/* 3D Cloud API Gateway Hub */}
      <group ref={cloudMeshRef} position={[0, 0.35, 0]}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.32, 16, 16]} />
          <meshStandardMaterial
            color="#132330"
            emissive="#60A5FA"
            emissiveIntensity={0.45}
            roughness={0.25}
            metalness={0.6}
          />
        </mesh>
        <mesh position={[-0.2, -0.04, 0]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial
            color="#132330"
            emissive="#60A5FA"
            emissiveIntensity={0.4}
            roughness={0.25}
            metalness={0.6}
          />
        </mesh>
        <mesh position={[0.2, -0.04, 0]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial
            color="#132330"
            emissive="#60A5FA"
            emissiveIntensity={0.4}
            roughness={0.25}
            metalness={0.6}
          />
        </mesh>
      </group>

      {/* HTML Card Overlay */}
      <Html
        position={[0, -0.6, 0.8]}
        transform
        distanceFactor={6.2}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div className="bg-[#08151E]/95 border border-[#60A5FA]/40 rounded-xl p-2.5 backdrop-blur-md shadow-xl select-none min-w-[155px] text-left">
          {/* Card Header */}
          <div className="flex items-center gap-1.5 pb-1.5 border-b border-white/5">
            <Cloud size={12} className="text-[#60A5FA]" />
            <span className="text-[10px] font-mono font-black text-[#F4F7F7] uppercase tracking-wider">
              External APIs
            </span>
          </div>

          {/* Service items */}
          <div className="flex flex-col gap-1 mt-1.5 font-mono text-[8.5px] text-[#9FB0B3]">
            <div className="flex items-center gap-1 text-emerald-400">
              <Check size={9} className="shrink-0" />
              <span>Payment Gateway</span>
            </div>
            <div className="flex items-center gap-1">
              <Check size={9} className="shrink-0 text-[#60A5FA]" />
              <span>Auth / OAuth2</span>
            </div>
            <div className="flex items-center gap-1">
              <Check size={9} className="shrink-0 text-[#60A5FA]" />
              <span>Notification APIs</span>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
};

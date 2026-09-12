'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Cloud, Check } from 'lucide-react';

interface ExternalApiNodeProps {
  position?: [number, number, number];
  onSelectExternalLayer?: () => void;
}

export const ExternalApiNode: React.FC<ExternalApiNodeProps> = ({
  position = [4.8, -2.2, 0.4],
  onSelectExternalLayer,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const cloudMeshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (cloudMeshRef.current) {
      cloudMeshRef.current.position.y = 0.5 + Math.sin(state.clock.getElapsedTime() * 2) * 0.05;
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
      {/* Base Hexagonal Pedestal */}
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[1.0, 1.15, 0.2, 6]} />
        <meshStandardMaterial
          color="#071216"
          roughness={0.25}
          metalness={0.9}
          emissive="#3B82F6"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* 3D Holographic Cloud Object */}
      <group position={[0, 0.5, 0]}>
        <mesh ref={cloudMeshRef}>
          <sphereGeometry args={[0.38, 16, 16]} />
          <meshStandardMaterial
            color="#3B82F6"
            emissive="#60A5FA"
            emissiveIntensity={0.6}
            roughness={0.2}
            metalness={0.5}
            transparent
            opacity={0.85}
          />
        </mesh>
        {/* Additional cloud puffs */}
        <mesh position={[-0.24, -0.05, 0]}>
          <sphereGeometry args={[0.26, 16, 16]} />
          <meshStandardMaterial
            color="#3B82F6"
            emissive="#60A5FA"
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
          />
        </mesh>
        <mesh position={[0.24, -0.05, 0]}>
          <sphereGeometry args={[0.26, 16, 16]} />
          <meshStandardMaterial
            color="#3B82F6"
            emissive="#60A5FA"
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
          />
        </mesh>
      </group>

      {/* HTML Card Overlay matching target */}
      <Html
        position={[0, -0.7, 0.9]}
        transform
        distanceFactor={6.8}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div className="bg-[#071216]/95 border border-[#3B82F6]/50 rounded-xl p-3 backdrop-blur-md shadow-2xl select-none min-w-[170px] text-left">
          {/* Card Header */}
          <div className="flex items-center gap-1.5 pb-2 border-b border-[#3B82F6]/20">
            <Cloud size={13} className="text-[#60A5FA]" />
            <span className="text-xs font-black text-[#F4F7F7] uppercase tracking-wider">
              External APIs
            </span>
          </div>

          {/* Service items */}
          <div className="flex flex-col gap-1.5 mt-2 font-mono text-[9px] text-[#9FB0B3]">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Check size={10} className="shrink-0" />
              <span>Payment Gateway</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#9FB0B3]">
              <Check size={10} className="shrink-0 text-[#60A5FA]" />
              <span>Doc Services</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#9FB0B3]">
              <Check size={10} className="shrink-0 text-[#60A5FA]" />
              <span>Notification (SMS/Mail)</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#9FB0B3]">
              <Check size={10} className="shrink-0 text-[#60A5FA]" />
              <span>Open Government Data</span>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
};

'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Database } from 'lucide-react';

interface DatabaseNodeProps {
  position?: [number, number, number];
  onSelectRepositoryLayer?: () => void;
}

export const DatabaseNode: React.FC<DatabaseNodeProps> = ({
  position = [-4.6, -1.3, 0.4],
  onSelectRepositoryLayer,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelectRepositoryLayer?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Hexagonal pedestal base */}
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.95, 1.1, 0.2, 6]} />
        <meshStandardMaterial
          color="#071216"
          roughness={0.2}
          metalness={0.9}
          emissive="#2F80ED"
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Stacked 3D Database Cylinders */}
      {[0, 1, 2].map((idx) => (
        <group key={idx} position={[0, idx * 0.26, 0]}>
          {/* Cylinder Platter */}
          <mesh>
            <cylinderGeometry args={[0.7, 0.7, 0.18, 24]} />
            <meshStandardMaterial
              color="#0E222D"
              roughness={0.2}
              metalness={0.85}
              emissive="#00D2FF"
              emissiveIntensity={0.3}
            />
          </mesh>

          {/* Glowing Disk Accent Ring */}
          <mesh position={[0, 0.095, 0]}>
            <cylinderGeometry args={[0.68, 0.68, 0.02, 24]} />
            <meshBasicMaterial color="#00E5FF" />
          </mesh>
        </group>
      ))}

      {/* Holographic glowing ring around the database */}
      <mesh ref={ringRef} position={[0, 0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 0.98, 32]} />
        <meshBasicMaterial color="#2F80ED" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* HTML Label / Badge */}
      <Html
        position={[0, -0.65, 0.9]}
        transform
        distanceFactor={7}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div className="flex flex-col items-center bg-[#071216]/95 border border-[#2F80ED]/50 px-3 py-1.5 rounded-lg backdrop-blur-md shadow-2xl select-none min-w-[110px]">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#60A5FA] uppercase tracking-wider">
            <Database size={11} className="text-[#00E5FF]" />
            <span>Database</span>
          </div>
          <span className="text-[9px] font-mono text-[#9FB0B3] mt-0.5">
            PostgreSQL / SQL
          </span>
        </div>
      </Html>
    </group>
  );
};

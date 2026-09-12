'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { Database } from 'lucide-react';

interface DatabaseNodeProps {
  position?: [number, number, number];
  onSelectRepositoryLayer?: () => void;
}

export const DatabaseNode: React.FC<DatabaseNodeProps> = ({
  position = [-4.0, -0.95, 0.3],
  onSelectRepositoryLayer,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.getElapsedTime() * 0.4;
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
      {/* Industrial Pedestal Base */}
      <RoundedBox args={[1.5, 0.16, 1.5]} radius={0.04} smoothness={3} position={[0, -0.25, 0]}>
        <meshStandardMaterial
          color="#101C26"
          roughness={0.35}
          metalness={0.4}
        />
      </RoundedBox>

      {/* Stacked 3D Database Platters */}
      {[0, 1, 2].map((idx) => (
        <group key={idx} position={[0, idx * 0.22, 0]}>
          <mesh>
            <cylinderGeometry args={[0.55, 0.55, 0.15, 24]} />
            <meshStandardMaterial
              color="#132330"
              roughness={0.25}
              metalness={0.7}
              emissive="#EC4899"
              emissiveIntensity={0.2}
            />
          </mesh>
          {/* Glowing Disk Accent Ring */}
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.53, 0.53, 0.015, 24]} />
            <meshBasicMaterial color="#EC4899" />
          </mesh>
        </group>
      ))}

      {/* Rotating Accent Ring */}
      <mesh ref={ringRef} position={[0, 0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.72, 0.78, 32]} />
        <meshBasicMaterial color="#EC4899" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Integrated Label Badge */}
      <Html
        position={[0, -0.55, 0.8]}
        transform
        distanceFactor={6.2}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div className="flex flex-col items-center bg-[#08151E]/95 border border-[#EC4899]/40 px-3 py-1.5 rounded-xl backdrop-blur-md shadow-xl select-none min-w-[105px]">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-black text-[#F472B6] uppercase tracking-wider">
            <Database size={11} className="text-[#EC4899]" />
            <span>Database</span>
          </div>
          <span className="text-[8.5px] font-mono text-[#9FB0B3] mt-0.5">
            PostgreSQL / SQL
          </span>
        </div>
      </Html>
    </group>
  );
};

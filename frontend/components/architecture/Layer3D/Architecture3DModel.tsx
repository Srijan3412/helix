'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { LayerItemData } from './types';
import { Layers, Zap, Database, Terminal, Shield, Cloud } from 'lucide-react';

interface Architecture3DModelProps {
  layers: Record<string, string[]>;
  selectedLayerId: string;
  onSelectLayer: (layerId: string) => void;
  searchQuery?: string;
  routes?: any[];
  dbType?: string;
}

// Mapping between layer config IDs and Blender node names
const LAYER_NODE_MAP: Record<
  string,
  {
    nodeName: string;
    num: string;
    name: string;
    tag: string;
    color: string;
    glowColor: string;
    defaultY: number;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }
> = {
  routes: {
    nodeName: '01_ROUTES',
    num: '01',
    name: 'Routes',
    tag: 'API LAYER',
    color: '#2F80ED',
    glowColor: '#00E5FF',
    defaultY: 4.0,
    icon: Zap,
  },
  controllers: {
    nodeName: '02_CONTROLLERS',
    num: '02',
    name: 'Controllers',
    tag: 'LOGIC LAYER',
    color: '#8B5CF6',
    glowColor: '#C084FC',
    defaultY: 2.4,
    icon: Terminal,
  },
  services: {
    nodeName: '03_SERVICES',
    num: '03',
    name: 'Services',
    tag: 'BUSINESS LAYER',
    color: '#F59E0B',
    glowColor: '#FCD34D',
    defaultY: 0.8,
    icon: Layers,
  },
  repositories: {
    nodeName: '04_REPOSITORIES',
    num: '04',
    name: 'Repositories',
    tag: 'DATA LAYER',
    color: '#EC4899',
    glowColor: '#F472B6',
    defaultY: -0.8,
    icon: Database,
  },
  middleware: {
    nodeName: '05_MIDDLEWARE',
    num: '05',
    name: 'Middleware',
    tag: 'PIPELINE LAYER',
    color: '#14B8A6',
    glowColor: '#34D399',
    defaultY: -2.4,
    icon: Shield,
  },
  external: {
    nodeName: '06_EXTERNAL_SERVICES',
    num: '06',
    name: 'External Services',
    tag: 'INTEGRATION LAYER',
    color: '#60A5FA',
    glowColor: '#93C5FD',
    defaultY: -4.0,
    icon: Cloud,
  },
};

const isOversizedOrDistractingProp = (name: string) => {
  const n = (name || '').toLowerCase();
  return (
    n.startsWith('cloud_gateway') ||
    n.startsWith('cloud_plinth') ||
    n.startsWith('shieldicon') ||
    n.startsWith('panel_') ||
    n.includes('energybeam') ||
    n.includes('requestnode_energybeam')
  );
};

// Sub-component for individual layer node
function InteractiveLayerNode({
  layerId,
  originalNode,
  config,
  isSelected,
  onSelect,
  fileCount,
  searchMatch,
}: {
  layerId: string;
  originalNode: THREE.Object3D;
  config: (typeof LAYER_NODE_MAP)[string];
  isSelected: boolean;
  onSelect: () => void;
  fileCount: number;
  searchMatch: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const clonedObject = useMemo(() => originalNode.clone(true), [originalNode]);

  // Apply enhanced studio PBR materials, shadow properties, and filter out oversized props
  useEffect(() => {
    clonedObject.traverse((child) => {
      if (isOversizedOrDistractingProp(child.name)) {
        child.visible = false;
        return;
      }

      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.roughness = Math.min(mat.roughness, 0.35);
              mat.metalness = Math.max(mat.metalness, 0.4);
              mat.envMapIntensity = 1.4;

              // Boost emissive materials for glorious glowing cyber finish
              if (
                mat.emissive &&
                (mat.emissive.r > 0.05 || mat.emissive.g > 0.05 || mat.emissive.b > 0.05)
              ) {
                mat.emissiveIntensity = isSelected ? 3.5 : hovered ? 2.8 : 2.0;
                mat.toneMapped = false;
              }
            }
          });
        }
      }
    });
  }, [clonedObject, isSelected, hovered]);

  // Smooth Y-elevation on hover / selection
  const targetElevation = isSelected ? 0.45 : hovered ? 0.18 : 0;
  const targetScale = isSelected ? 1.02 : hovered ? 1.01 : 1.0;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const factor = Math.min(1, delta * 12);
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetElevation,
      factor
    );

    const curScale = groupRef.current.scale.x;
    const nextScale = THREE.MathUtils.lerp(curScale, targetScale, factor);
    groupRef.current.scale.set(nextScale, nextScale, nextScale);
  });

  const Icon = config.icon;

  return (
    <group
      ref={groupRef}
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
      <primitive object={clonedObject} />

      {/* Selected Halo Ring */}
      {isSelected && (
        <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.4, 4.48, 64]} />
          <meshBasicMaterial
            color={config.glowColor}
            transparent
            opacity={0.75}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

export function Architecture3DModel({
  layers,
  selectedLayerId,
  onSelectLayer,
  searchQuery = '',
}: Architecture3DModelProps) {
  // Load master Blender stack model
  const { scene } = useGLTF('/models/architecture_stack_master.glb');

  // Extract layers and other nodes from scene
  const { layerNodes, studioNodes } = useMemo(() => {
    const layerMap: Record<string, THREE.Object3D> = {};
    const extra: THREE.Object3D[] = [];

    scene.traverse((obj) => {
      // Check if this object matches one of our 6 layer roots
      for (const [key, conf] of Object.entries(LAYER_NODE_MAP)) {
        if (obj.name === conf.nodeName) {
          layerMap[key] = obj;
        }
      }
      if (obj.name === 'DarkMirror_Floor' || obj.name === 'GroundMirrorFloor') {
        extra.push(obj);
      }
    });

    return { layerNodes: layerMap, studioNodes: extra };
  }, [scene]);

  const selectedConfig = LAYER_NODE_MAP[selectedLayerId] || LAYER_NODE_MAP.routes;

  return (
    <group position={[0, 0, 0]}>
      {/* 6 Individual Interactive Architecture Layers */}
      {Object.entries(LAYER_NODE_MAP).map(([layerId, conf]) => {
        const originalNode = layerNodes[layerId];
        if (!originalNode) return null;

        const fileList = layers[layerId] || [];
        const isSelected = selectedLayerId === layerId;
        const searchMatch = searchQuery
          ? conf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            fileList.some((f) => String(f).toLowerCase().includes(searchQuery.toLowerCase()))
          : true;

        return (
          <InteractiveLayerNode
            key={layerId}
            layerId={layerId}
            originalNode={originalNode}
            config={conf}
            isSelected={isSelected}
            onSelect={() => onSelectLayer(layerId)}
            fileCount={fileList.length}
            searchMatch={searchMatch}
          />
        );
      })}

      {/* Dynamic Focused Spot & Point Light on the Selected Layer */}
      {selectedConfig && (
        <>
          <pointLight
            position={[0, selectedConfig.defaultY + 0.8, 3.2]}
            intensity={3.2}
            color={selectedConfig.glowColor}
            distance={7.0}
            decay={1.8}
          />
          <pointLight
            position={[-3.5, selectedConfig.defaultY + 0.5, 1.5]}
            intensity={1.8}
            color={selectedConfig.color}
            distance={5.0}
            decay={2.0}
          />
        </>
      )}

      {/* Dark Reflective Mirror Floor Plinth */}
      <mesh position={[0, -5.4, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial
          color="#02080D"
          roughness={0.16}
          metalness={0.88}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Soft Ground Grid Outline */}
      <gridHelper
        args={[36, 36, '#00D2FF', '#083344']}
        position={[0, -5.39, 0]}
        material-transparent
        material-opacity={0.15}
      />
    </group>
  );
}

// Preload the master GLB model for instantaneous rendering
useGLTF.preload('/models/architecture_stack_master.glb');

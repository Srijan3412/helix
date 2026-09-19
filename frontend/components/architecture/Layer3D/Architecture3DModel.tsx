'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Zap, Terminal, Layers, Database, Shield, Cloud } from 'lucide-react';

interface Architecture3DModelProps {
  layers: Record<string, string[]>;
  selectedLayerId: string;
  onSelectLayer: (layerId: string) => void;
  searchQuery?: string;
  routes?: any[];
  dbType?: string;
}

export const LAYER_ORDER = [
  'routes',
  'controllers',
  'services',
  'repositories',
  'middleware',
  'external',
] as const;

export const LAYER_NODE_MAP: Record<
  string,
  {
    nodeName: string;
    index: number;
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
    index: 0,
    num: '01',
    name: 'Routes',
    tag: 'API LAYER',
    color: '#19D8E8',
    glowColor: '#00F0FF',
    defaultY: 4.0,
    icon: Zap,
  },
  controllers: {
    nodeName: '02_CONTROLLERS',
    index: 1,
    num: '02',
    name: 'Controllers',
    tag: 'LOGIC LAYER',
    color: '#9B7CFF',
    glowColor: '#C084FC',
    defaultY: 2.4,
    icon: Terminal,
  },
  services: {
    nodeName: '03_SERVICES',
    index: 2,
    num: '03',
    name: 'Services',
    tag: 'BUSINESS LAYER',
    color: '#F5B83D',
    glowColor: '#FCD34D',
    defaultY: 0.8,
    icon: Layers,
  },
  repositories: {
    nodeName: '04_REPOSITORIES',
    index: 3,
    num: '04',
    name: 'Repositories',
    tag: 'DATA LAYER',
    color: '#E875C8',
    glowColor: '#F472B6',
    defaultY: -0.8,
    icon: Database,
  },
  middleware: {
    nodeName: '05_MIDDLEWARE',
    index: 4,
    num: '05',
    name: 'Middleware',
    tag: 'PIPELINE LAYER',
    color: '#3ED6A0',
    glowColor: '#34D399',
    defaultY: -2.4,
    icon: Shield,
  },
  external: {
    nodeName: '06_EXTERNAL_SERVICES',
    index: 5,
    num: '06',
    name: 'External Services',
    tag: 'INTEGRATION LAYER',
    color: '#4F9DFF',
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
  layerIndex,
  selectedIndex,
  isSelected,
  onSelect,
  fileCount,
  searchMatch,
}: {
  layerId: string;
  originalNode: THREE.Object3D;
  config: (typeof LAYER_NODE_MAP)[string];
  layerIndex: number;
  selectedIndex: number; // -1 if none selected
  isSelected: boolean;
  onSelect: () => void;
  fileCount: number;
  searchMatch: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const clonedObject = useMemo(() => originalNode.clone(true), [originalNode]);

  // Apply refined studio PBR materials, tone down harsh emissives, and keep dark navy chassis rich
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
              mat.roughness = Math.min(mat.roughness, 0.38);
              mat.metalness = Math.max(mat.metalness, 0.45);
              mat.envMapIntensity = 1.3;

              // Emissive neon trims
              if (
                mat.emissive &&
                (mat.emissive.r > 0.05 || mat.emissive.g > 0.05 || mat.emissive.b > 0.05)
              ) {
                mat.emissiveIntensity = isSelected ? 2.8 : hovered ? 2.2 : 1.5;
                mat.toneMapped = false;
              }
            }
          });
        }
      }
    });
  }, [clonedObject, isSelected, hovered]);

  // Accordion Focus Reveal Animation Calculations:
  // - If no layer selected (selectedIndex === -1): targetY = config.defaultY
  // - If layer is ABOVE the selected layer (layerIndex < selectedIndex): targetY = config.defaultY + 2.0
  // - If layer IS the selected layer (layerIndex === selectedIndex): targetY = config.defaultY + 0.3, targetZ = 0.35, scale = 1.04
  // - If layer is BELOW the selected layer (layerIndex > selectedIndex): targetY = config.defaultY
  let targetY = config.defaultY;
  let targetZ = 0;
  let targetScale = 1.0;

  if (selectedIndex !== -1) {
    if (layerIndex < selectedIndex) {
      // Elevate upper layers upward to open focus inspection gap
      targetY = config.defaultY + 2.0;
    } else if (layerIndex === selectedIndex) {
      // Selected layer lifts slightly into gap, moves forward toward camera, and scales up
      targetY = config.defaultY + 0.3;
      targetZ = 0.35;
      targetScale = 1.04;
    } else {
      // Lower layers remain in standard resting position
      targetY = config.defaultY;
    }
  } else if (hovered) {
    targetY = config.defaultY + 0.15;
    targetScale = 1.015;
  }

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const factor = Math.min(1, delta * 9); // Smooth ~500ms ease-out lerp

    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY,
      factor
    );
    groupRef.current.position.z = THREE.MathUtils.lerp(
      groupRef.current.position.z,
      targetZ,
      factor
    );

    const curScale = groupRef.current.scale.x;
    const nextScale = THREE.MathUtils.lerp(curScale, targetScale, factor);
    groupRef.current.scale.set(nextScale, nextScale, nextScale);
  });

  return (
    <group
      ref={groupRef}
      position={[0, config.defaultY, 0]}
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
      {/* 3D Blender Sub-Hierarchy */}
      <primitive object={clonedObject} position={[0, -config.defaultY, 0]} />

      {/* Subtle Underglow for Selected Slab */}
      {isSelected && (
        <pointLight
          position={[0, 0.3, 0.8]}
          intensity={2.6}
          color={config.glowColor}
          distance={5.0}
          decay={2.0}
        />
      )}
    </group>
  );
}

// Vertical Cyber Spine Component
function CentralArchitectureSpine({
  selectedIndex,
}: {
  selectedIndex: number;
}) {
  return (
    <group position={[0, 0, 0]}>
      {/* Thin luminous vertical spine bar */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 10.8, 16]} />
        <meshStandardMaterial
          color="#00E5FF"
          emissive="#00D2FF"
          emissiveIntensity={1.2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Connection Node Spheres at each layer anchor */}
      {LAYER_ORDER.map((layerId, idx) => {
        const conf = LAYER_NODE_MAP[layerId];
        const isCurrentSelected = idx === selectedIndex;
        return (
          <mesh key={layerId} position={[0, conf.defaultY, 0]}>
            <sphereGeometry args={[isCurrentSelected ? 0.08 : 0.045, 16, 16]} />
            <meshStandardMaterial
              color={isCurrentSelected ? conf.glowColor : '#00E5FF'}
              emissive={isCurrentSelected ? conf.color : '#007A99'}
              emissiveIntensity={isCurrentSelected ? 2.5 : 0.8}
              roughness={0.3}
              metalness={0.7}
            />
          </mesh>
        );
      })}
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
  const { layerNodes } = useMemo(() => {
    const layerMap: Record<string, THREE.Object3D> = {};

    scene.traverse((obj) => {
      for (const [key, conf] of Object.entries(LAYER_NODE_MAP)) {
        if (obj.name === conf.nodeName) {
          layerMap[key] = obj;
        }
      }
    });

    return { layerNodes: layerMap };
  }, [scene]);

  // Selected layer index (-1 if none selected)
  const selectedIndex = LAYER_ORDER.indexOf(selectedLayerId as any);
  const selectedConfig = LAYER_NODE_MAP[selectedLayerId];

  const handleToggleLayer = (layerId: string) => {
    if (selectedLayerId === layerId) {
      // Toggle off to collapse accordion
      onSelectLayer('');
    } else {
      onSelectLayer(layerId);
    }
  };

  return (
    <group
      position={[0, 0, 0]}
      onClick={() => {
        // Clicking empty space in canvas deselects and collapses
        if (selectedLayerId) {
          onSelectLayer('');
        }
      }}
    >
      {/* Central Architecture Spine with connection points */}
      <CentralArchitectureSpine selectedIndex={selectedIndex} />

      {/* 6 Individual Interactive Architecture Layers */}
      {LAYER_ORDER.map((layerId, idx) => {
        const conf = LAYER_NODE_MAP[layerId];
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
            layerIndex={idx}
            selectedIndex={selectedIndex}
            isSelected={isSelected}
            onSelect={() => handleToggleLayer(layerId)}
            fileCount={fileList.length}
            searchMatch={searchMatch}
          />
        );
      })}

      {/* Dynamic Key Focus Spot / Point Light when a layer is inspected */}
      {selectedConfig && (
        <pointLight
          position={[0, selectedConfig.defaultY + 1.2, 3.5]}
          intensity={2.8}
          color={selectedConfig.glowColor}
          distance={8.0}
          decay={1.8}
        />
      )}

      {/* Dark Reflective Studio Floor Plinth */}
      <mesh position={[0, -5.3, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[48, 48]} />
        <meshStandardMaterial
          color="#02080D"
          roughness={0.18}
          metalness={0.85}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Subtle Ground Grid Outline */}
      <gridHelper
        args={[36, 36, '#00D2FF', '#062837']}
        position={[0, -5.29, 0]}
        material-transparent
        material-opacity={0.12}
      />
    </group>
  );
}

// Preload the master GLB model for instantaneous rendering
useGLTF.preload('/models/architecture_stack_master.glb');

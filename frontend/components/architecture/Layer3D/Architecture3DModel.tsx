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

export type LayerId = (typeof LAYER_ORDER)[number];

export const LAYER_NODE_MAP: Record<
  string,
  {
    nodeName: string;
    num: string;
    name: string;
    tag: string;
    color: string;
    glowColor: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }
> = {
  routes: {
    nodeName: '01_ROUTES',
    num: '01',
    name: 'Routes',
    tag: 'API LAYER',
    color: '#19D8E8',
    glowColor: '#00F0FF',
    icon: Zap,
  },
  controllers: {
    nodeName: '02_CONTROLLERS',
    num: '02',
    name: 'Controllers',
    tag: 'LOGIC LAYER',
    color: '#9B7CFF',
    glowColor: '#C084FC',
    icon: Terminal,
  },
  services: {
    nodeName: '03_SERVICES',
    num: '03',
    name: 'Services',
    tag: 'BUSINESS LAYER',
    color: '#F5B83D',
    glowColor: '#FCD34D',
    icon: Layers,
  },
  repositories: {
    nodeName: '04_REPOSITORIES',
    num: '04',
    name: 'Repositories',
    tag: 'DATA LAYER',
    color: '#E875C8',
    glowColor: '#F472B6',
    icon: Database,
  },
  middleware: {
    nodeName: '05_MIDDLEWARE',
    num: '05',
    name: 'Middleware',
    tag: 'PIPELINE LAYER',
    color: '#3ED6A0',
    glowColor: '#34D399',
    icon: Shield,
  },
  external: {
    nodeName: '06_EXTERNAL_SERVICES',
    num: '06',
    name: 'External Services',
    tag: 'INTEGRATION LAYER',
    color: '#4F9DFF',
    glowColor: '#93C5FD',
    icon: Cloud,
  },
};

// Blender original export height offsets (to normalize local origin)
const ORIGINAL_BLENDER_Y: Record<string, number> = {
  routes: 4.0,
  controllers: 2.4,
  services: 0.8,
  repositories: -0.8,
  middleware: -2.4,
  external: -4.0,
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
  baseY,
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
  baseY: number;
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

  // Apply refined studio PBR materials and shadow properties
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
  // - If no layer selected (selectedIndex === -1): targetY = baseY
  // - If layer is ABOVE the selected layer (layerIndex < selectedIndex): targetY = baseY + 2.0
  // - If layer IS the selected layer (layerIndex === selectedIndex): targetY = baseY + 0.3, targetZ = 0.35, scale = 1.04
  // - If layer is BELOW the selected layer (layerIndex > selectedIndex): targetY = baseY
  let targetY = baseY;
  let targetZ = 0;
  let targetScale = 1.0;

  if (selectedIndex !== -1) {
    if (layerIndex < selectedIndex) {
      targetY = baseY + 2.0;
    } else if (layerIndex === selectedIndex) {
      targetY = baseY + 0.3;
      targetZ = 0.35;
      targetScale = 1.04;
    } else {
      targetY = baseY;
    }
  } else if (hovered) {
    targetY = baseY + 0.15;
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

  const origBlenderY = ORIGINAL_BLENDER_Y[layerId] || 0;

  return (
    <group
      ref={groupRef}
      position={[0, baseY, 0]}
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
      {/* 3D Blender Sub-Hierarchy normalized to local origin */}
      <primitive object={clonedObject} position={[0, -origBlenderY, 0]} />

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

// Vertical Cyber Spine Component dynamically scaled to active layers
function CentralArchitectureSpine({
  activeLayerConfigs,
  selectedIndex,
}: {
  activeLayerConfigs: { id: string; config: (typeof LAYER_NODE_MAP)[string]; baseY: number }[];
  selectedIndex: number;
}) {
  const count = activeLayerConfigs.length;
  if (count === 0) return null;

  const topY = activeLayerConfigs[0].baseY;
  const botY = activeLayerConfigs[count - 1].baseY;
  const spineHeight = Math.max(3.0, topY - botY + 2.0);
  const spineCenterY = (topY + botY) / 2;

  return (
    <group position={[0, 0, 0]}>
      {/* Thin luminous vertical spine bar */}
      <mesh position={[0, spineCenterY, 0]}>
        <cylinderGeometry args={[0.025, 0.025, spineHeight, 16]} />
        <meshStandardMaterial
          color="#00E5FF"
          emissive="#00D2FF"
          emissiveIntensity={1.2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Connection Node Spheres at active layer anchors */}
      {activeLayerConfigs.map((item, idx) => {
        const isCurrentSelected = idx === selectedIndex;
        return (
          <mesh key={item.id} position={[0, item.baseY, 0]}>
            <sphereGeometry args={[isCurrentSelected ? 0.08 : 0.045, 16, 16]} />
            <meshStandardMaterial
              color={isCurrentSelected ? item.config.glowColor : '#00E5FF'}
              emissive={isCurrentSelected ? item.config.color : '#007A99'}
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

  // Extract layer nodes from GLTF scene
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

  // Check if any detected files exist from the backend scan
  const hasDetectedFiles = useMemo(() => {
    return Object.values(layers).some((files) => Array.isArray(files) && files.length > 0);
  }, [layers]);

  // Dynamically filter layers: if a layer has NO files in the scanned project, hide it!
  const activeLayerIds = useMemo(() => {
    if (!hasDetectedFiles) {
      // Preview mode / initial empty scan: display full default 6-layer stack
      return LAYER_ORDER;
    }

    // Only include layers that actually exist in the project (file count > 0)
    const filtered = LAYER_ORDER.filter((layerId) => {
      const fileList = layers[layerId];
      return Array.isArray(fileList) && fileList.length > 0;
    });

    return filtered.length > 0 ? filtered : LAYER_ORDER;
  }, [layers, hasDetectedFiles]);

  // Dynamically calculate evenly centered vertical positions for active layers
  const activeLayerConfigs = useMemo(() => {
    const count = activeLayerIds.length;
    const spacing = 1.6; // Uniform gap between slabs
    const topY = ((count - 1) * spacing) / 2;

    return activeLayerIds.map((layerId, idx) => ({
      id: layerId,
      config: LAYER_NODE_MAP[layerId],
      baseY: topY - idx * spacing,
      fileCount: (layers[layerId] || []).length,
    }));
  }, [activeLayerIds, layers]);

  // Selected layer index in the active stack (-1 if none selected)
  const selectedIndex = activeLayerIds.indexOf(selectedLayerId as any);
  const selectedItem = activeLayerConfigs.find((item) => item.id === selectedLayerId);

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
      {/* Central Architecture Spine with connection points for active layers */}
      <CentralArchitectureSpine
        activeLayerConfigs={activeLayerConfigs}
        selectedIndex={selectedIndex}
      />

      {/* Dynamic Interactive Architecture Layer Slabs */}
      {activeLayerConfigs.map((item, idx) => {
        const originalNode = layerNodes[item.id];
        if (!originalNode) return null;

        const isSelected = selectedLayerId === item.id;
        const fileList = layers[item.id] || [];
        const searchMatch = searchQuery
          ? item.config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            fileList.some((f) => String(f).toLowerCase().includes(searchQuery.toLowerCase()))
          : true;

        return (
          <InteractiveLayerNode
            key={item.id}
            layerId={item.id}
            originalNode={originalNode}
            config={item.config}
            baseY={item.baseY}
            layerIndex={idx}
            selectedIndex={selectedIndex}
            isSelected={isSelected}
            onSelect={() => handleToggleLayer(item.id)}
            fileCount={item.fileCount}
            searchMatch={searchMatch}
          />
        );
      })}

      {/* Dynamic Key Focus Spot / Point Light when a layer is inspected */}
      {selectedItem && (
        <pointLight
          position={[0, selectedItem.baseY + 1.2, 3.5]}
          intensity={2.8}
          color={selectedItem.config.glowColor}
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

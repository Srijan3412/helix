'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CircuitPathData {
  points: THREE.Vector3[];
  color: string;
  speed: number;
}

export const CircuitLines: React.FC = () => {
  const particlesRef = useRef<THREE.Group>(null);

  // Generate 3D Orthogonal Circuit Traces matching platform stack
  const paths: CircuitPathData[] = useMemo(() => {
    return [
      // Left Bus: Routes to Repositories & Database
      {
        points: [
          new THREE.Vector3(-2.65, 2.25, 0),
          new THREE.Vector3(-3.4, 2.25, 0),
          new THREE.Vector3(-3.4, -0.45, 0),
          new THREE.Vector3(-3.85, -0.95, 0.3),
        ],
        color: '#00E5FF',
        speed: 0.8,
      },
      // Left Bus: Repositories to Database Node
      {
        points: [
          new THREE.Vector3(-2.65, -0.45, 0),
          new THREE.Vector3(-3.3, -0.45, 0),
          new THREE.Vector3(-3.3, -0.95, 0.3),
          new THREE.Vector3(-3.85, -0.95, 0.3),
        ],
        color: '#EC4899',
        speed: 0.7,
      },
      // Right Bus: Services to External APIs
      {
        points: [
          new THREE.Vector3(2.65, 0.45, 0),
          new THREE.Vector3(3.4, 0.45, 0),
          new THREE.Vector3(3.4, -1.35, 0),
          new THREE.Vector3(3.85, -1.85, 0.3),
        ],
        color: '#60A5FA',
        speed: 0.75,
      },
      // Layer 1 to Layer 2 vertical bus (Routes to Controllers)
      {
        points: [
          new THREE.Vector3(2.65, 2.25, 0),
          new THREE.Vector3(3.0, 2.25, 0),
          new THREE.Vector3(3.0, 1.35, 0),
          new THREE.Vector3(2.65, 1.35, 0),
        ],
        color: '#8B5CF6',
        speed: 0.9,
      },
      // Layer 2 to Layer 3 vertical bus (Controllers to Services)
      {
        points: [
          new THREE.Vector3(-2.65, 1.35, 0),
          new THREE.Vector3(-3.0, 1.35, 0),
          new THREE.Vector3(-3.0, 0.45, 0),
          new THREE.Vector3(-2.65, 0.45, 0),
        ],
        color: '#F59E0B',
        speed: 0.85,
      },
    ];
  }, []);

  // Pre-calculate curves for smooth particle interpolation
  const curves = useMemo(() => {
    return paths.map((p) => new THREE.CatmullRomCurve3(p.points, false, 'catmullrom', 0.1));
  }, [paths]);

  // Animated flow particles along curves
  useFrame((state) => {
    if (!particlesRef.current) return;
    const time = state.clock.getElapsedTime();

    particlesRef.current.children.forEach((child, i) => {
      const curve = curves[i];
      if (!curve) return;
      const speed = paths[i].speed;
      const t = (time * speed * 0.3) % 1;
      const point = curve.getPointAt(t);
      child.position.copy(point);
    });
  });

  return (
    <group>
      {/* Render 3D Circuit Trace Lines */}
      {paths.map((p, i) => {
        const lineGeo = new THREE.BufferGeometry().setFromPoints(p.points);
        return (
          <group key={i}>
            <primitive
              object={
                new THREE.Line(
                  lineGeo,
                  new THREE.LineBasicMaterial({
                    color: p.color,
                    transparent: true,
                    opacity: 0.45,
                    linewidth: 1.5,
                  })
                )
              }
            />

            {/* Circuit Endpoints */}
            {p.points.map((pt, pti) => (
              <mesh key={pti} position={pt}>
                <sphereGeometry args={[0.035, 12, 12]} />
                <meshBasicMaterial color={p.color} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Moving Pulsing Flow Particles */}
      <group ref={particlesRef}>
        {paths.map((p, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.065, 12, 12]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
        ))}
      </group>
    </group>
  );
};

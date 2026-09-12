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

  // Generate 3D Orthogonal Circuit Traces
  const paths: CircuitPathData[] = useMemo(() => {
    return [
      // Left Bus: Top to Middle
      {
        points: [
          new THREE.Vector3(-3.25, 2.7, 0),
          new THREE.Vector3(-4.0, 2.7, 0),
          new THREE.Vector3(-4.0, 1.2, 0),
          new THREE.Vector3(-3.25, 1.2, 0),
        ],
        color: '#00D2FF',
        speed: 0.8,
      },
      // Left Bus: Middleware to Database
      {
        points: [
          new THREE.Vector3(-3.25, -0.6, 0),
          new THREE.Vector3(-4.4, -0.6, 0),
          new THREE.Vector3(-4.4, -1.2, 0.4),
          new THREE.Vector3(-3.9, -1.2, 0.4),
        ],
        color: '#2F80ED',
        speed: 0.6,
      },
      // Right Bus: Top to External APIs
      {
        points: [
          new THREE.Vector3(3.25, 2.6, 0),
          new THREE.Vector3(4.2, 2.6, 0),
          new THREE.Vector3(4.2, -0.5, 0),
          new THREE.Vector3(4.5, -1.8, 0.4),
        ],
        color: '#60A5FA',
        speed: 0.7,
      },
      // Layer 3 to Layer 4 interconnect
      {
        points: [
          new THREE.Vector3(3.25, 0.5, 0),
          new THREE.Vector3(3.7, 0.5, 0),
          new THREE.Vector3(3.7, -0.5, 0),
          new THREE.Vector3(3.25, -0.5, 0),
        ],
        color: '#F59E0B',
        speed: 0.9,
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
            {/* Base line */}
            <primitive
              object={
                new THREE.Line(
                  lineGeo,
                  new THREE.LineBasicMaterial({
                    color: p.color,
                    transparent: true,
                    opacity: 0.5,
                    linewidth: 1.5,
                  })
                )
              }
            />

            {/* Circuit Nodes / Endpoints */}
            {p.points.map((pt, pti) => (
              <mesh key={pti} position={pt}>
                <sphereGeometry args={[0.04, 12, 12]} />
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
            <sphereGeometry args={[0.075, 12, 12]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
        ))}
      </group>
    </group>
  );
};

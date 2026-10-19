"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const PER = 18;
const SOURCES = [
  { color: "#00e5ff", at: new THREE.Vector3(-1.4, 0.8, 0) },
  { color: "#ffb547", at: new THREE.Vector3(1.4, 0.8, 0) },
  { color: "#7cf7c4", at: new THREE.Vector3(0, -1.1, 0) },
];

/** Amazon ML: three record clouds converging and merging into matched entities. */
export function MatchModel() {
  const refs = useRef<(THREE.Object3D | null)[]>([]);
  const { clouds, targets } = useMemo(() => {
    const targets = Array.from({ length: PER }, (_, i) => {
      const a = (i / PER) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * 0.75, Math.sin(a) * 0.75, Math.sin(a * 3) * 0.2);
    });
    const clouds = SOURCES.map((s) => {
      const start = new Float32Array(PER * 3);
      for (let i = 0; i < PER; i++) {
        start.set([s.at.x + (Math.random() - 0.5) * 0.9, s.at.y + (Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.6], i * 3);
      }
      return { start, current: start.slice() };
    });
    return { clouds, targets };
  }, []);

  useFrame(({ clock }) => {
    // Converge, hold as matched triples, drift apart, repeat.
    const t = clock.elapsedTime % 5;
    const k = t < 2 ? THREE.MathUtils.smoothstep(t, 0, 2) : t < 3.6 ? 1 : 1 - THREE.MathUtils.smoothstep(t, 3.6, 5);
    clouds.forEach((c, ci) => {
      for (let i = 0; i < PER; i++) {
        // Each source's i-th record lands next to the same entity target, offset slightly.
        const tg = targets[i];
        const off = (ci - 1) * 0.07;
        c.current[i * 3] = c.start[i * 3] + (tg.x + off - c.start[i * 3]) * k;
        c.current[i * 3 + 1] = c.start[i * 3 + 1] + (tg.y - c.start[i * 3 + 1]) * k;
        c.current[i * 3 + 2] = c.start[i * 3 + 2] + (tg.z + off - c.start[i * 3 + 2]) * k;
      }
      const p = refs.current[ci];
      if (p) ((p as THREE.Points).geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    });
  });

  return (
    <group>
      {clouds.map((c, i) => (
        <points key={i} ref={(el) => void (refs.current[i] = el)}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[c.current, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.11} color={SOURCES[i].color} transparent opacity={0.95} toneMapped={false} />
        </points>
      ))}
      <mesh>
        <torusGeometry args={[0.75, 0.006, 6, 96]} />
        <meshBasicMaterial color="#e8f4f8" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

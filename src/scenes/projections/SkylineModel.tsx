"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const HAZE = 420;
const HAZY = new THREE.Color("#b07a3a");
const CLEAR = new THREE.Color("#7cf7c4");

/** SaansSaathi: a skyline under an air-quality haze that clears as the timeline scrubs. */
export function SkylineModel() {
  const haze = useRef<THREE.PointsMaterial>(null);
  const scrub = useRef<THREE.Mesh>(null);
  const hazePoints = useRef<THREE.Points>(null);

  const buildings = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        x: (i - 7.5) * 0.19,
        z: (i % 3) * 0.16 - 0.16,
        h: 0.3 + ((i * 37) % 11) / 11 + (i % 5 === 0 ? 0.5 : 0),
      })),
    [],
  );
  const hazePos = useMemo(() => {
    const a = new Float32Array(HAZE * 3);
    for (let i = 0; i < HAZE; i++) a.set([(Math.random() - 0.5) * 3.4, Math.random() * 1.8, (Math.random() - 0.5) * 1.2], i * 3);
    return a;
  }, []);
  const color = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }, dt) => {
    // 0 → 1 over the loop: the plan moves activities out of the worst hours.
    const p = (clock.elapsedTime % 6) / 6;
    const clean = THREE.MathUtils.smoothstep(p, 0.15, 0.75);
    if (haze.current) {
      haze.current.opacity = 0.75 - clean * 0.62;
      haze.current.color.copy(color.copy(HAZY).lerp(CLEAR, clean));
    }
    if (scrub.current) scrub.current.position.x = -1.6 + p * 3.2;
    if (hazePoints.current) hazePoints.current.rotation.y += dt * 0.08;
  });

  return (
    <group position={[0, -0.75, 0]} rotation={[0.2, -0.35, 0]}>
      {buildings.map((b, i) => (
        <group key={i} position={[b.x, b.h / 2, b.z]}>
          <mesh>
            <boxGeometry args={[0.15, b.h, 0.15]} />
            <meshBasicMaterial color="#071a26" />
          </mesh>
          <mesh>
            <boxGeometry args={[0.152, b.h, 0.152]} />
            <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.55} />
          </mesh>
        </group>
      ))}
      <points ref={hazePoints} position={[0, 0.2, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[hazePos, 3]} />
        </bufferGeometry>
        <pointsMaterial ref={haze} size={0.05} transparent depthWrite={false} toneMapped={false} />
      </points>
      {/* Timeline rail + scrub head */}
      <mesh position={[0, -0.12, 0.45]}>
        <boxGeometry args={[3.2, 0.012, 0.012]} />
        <meshBasicMaterial color="#ffb547" transparent opacity={0.5} />
      </mesh>
      <mesh ref={scrub} position={[-1.6, -0.12, 0.45]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#ffb547" toneMapped={false} />
      </mesh>
    </group>
  );
}

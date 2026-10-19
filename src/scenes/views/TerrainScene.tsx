"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const COLORS = ["#0b2a36", "#0a7d91", "#00b8d4", "#00e5ff", "#ffb547"].map((c) => new THREE.Color(c));

/** GitHub contribution calendar as a 3D bar terrain (weeks × weekdays). */
export function TerrainScene({ levels }: { levels: number[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);
  const weeks = Math.ceil(levels.length / 7);
  const target = useMemo(() => levels.map((l) => 0.06 + l * 0.32), [levels]);
  const grow = useRef(0);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    levels.forEach((l, i) => mesh.setColorAt(i, COLORS[Math.min(4, l)]));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [levels]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((state, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    grow.current = Math.min(1, grow.current + dt * 0.8);
    levels.forEach((_, i) => {
      const w = Math.floor(i / 7);
      const d = i % 7;
      // Bars rise in a wave from the oldest week to the newest.
      const k = THREE.MathUtils.clamp(grow.current * 2 - w / weeks, 0, 1);
      const h = target[i] * k + 0.001;
      dummy.position.set((w - weeks / 2) * 0.2, h / 2, (d - 3) * 0.2);
      dummy.scale.set(1, h, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (group.current) group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.25;
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4.2, 6.5]} fov={42} onUpdate={(c) => c.lookAt(0, 0, 0)} />
      <group ref={group}>
        <instancedMesh ref={ref} args={[undefined, undefined, levels.length]}>
          <boxGeometry args={[0.16, 1, 0.16]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
      </group>
    </>
  );
}

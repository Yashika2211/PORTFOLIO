"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const N = 11;
const BASE = new THREE.Color("#0a6a7a");
const LIT = new THREE.Color("#ffb547");
const tmpColor = new THREE.Color();

/** CodeNation: a voxel island whose territory tiles light up as reputation spreads. */
export function CodeNationModel() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);

  const tiles = useMemo(() => {
    const out: { x: number; z: number; h: number; d: number }[] = [];
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++) {
        const x = i - (N - 1) / 2;
        const z = j - (N - 1) / 2;
        const d = Math.hypot(x, z);
        const edge = 5 + Math.sin(i * 1.3) * 0.6 + Math.cos(j * 1.7) * 0.6;
        if (d > edge) continue;
        const h = 0.35 + Math.max(0, (1 - d / edge) * 1.4 + Math.sin(i * 0.9) * Math.cos(j * 0.8) * 0.35);
        out.push({ x, z, h, d });
      }
    return out;
  }, []);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Object3D();
    tiles.forEach((t, i) => {
      m.position.set(t.x * 0.22, (t.h * 0.22) / 2, t.z * 0.22);
      m.scale.set(1, t.h, 1);
      m.updateMatrix();
      mesh.setMatrixAt(i, m.matrix);
      mesh.setColorAt(i, BASE);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [tiles]);

  useFrame(({ clock }, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    // Territory claim wave expanding from the centre, looping.
    const front = (t * 1.6) % 7.5;
    tiles.forEach((tile, i) => {
      const k = THREE.MathUtils.clamp(1 - Math.abs(tile.d - front) / 1.2, 0, 1);
      const owned = tile.d < front - 1.2 ? 0.35 : 0;
      mesh.setColorAt(i, tmpColor.copy(BASE).lerp(LIT, Math.max(k, owned)));
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (group.current) group.current.rotation.y += dt * 0.35;
  });

  return (
    <group ref={group} rotation={[0.55, 0, 0]} position={[0, -0.3, 0]}>
      <instancedMesh ref={ref} args={[undefined, undefined, tiles.length]}>
        <boxGeometry args={[0.2, 0.22, 0.2]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.25, 1.32, 64]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

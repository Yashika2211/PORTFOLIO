"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const STEPS = 15; // today + 14 days
const LEN = 3;

/** Same illustrative shape as the 2D fan chart: a median with a widening P10–P90 band. */
function series(d: number) {
  const p50 = Math.sin(d / 2.3) * 0.18 + d * 0.025;
  const spread = 0.06 + d * 0.035;
  return { p10: p50 - spread, p50, p90: p50 + spread * 1.15 };
}

/** cashforecastor: P10/P50/P90 fan chart extruding forward in time toward the viewer. */
export function ForecastModel() {
  const band = useRef<THREE.Mesh>(null);
  const line = useRef<THREE.Line>(null);
  const group = useRef<THREE.Group>(null);

  const { bandGeo, lineGeo } = useMemo(() => {
    const bandPos: number[] = [];
    const idx: number[] = [];
    const linePos: number[] = [];
    for (let d = 0; d < STEPS; d++) {
      const s = series(d);
      // Time runs along +Z (toward the camera) and slightly right.
      const x = (d / (STEPS - 1)) * LEN * 0.6 - LEN * 0.3;
      const z = (d / (STEPS - 1)) * LEN - LEN / 2;
      bandPos.push(x, s.p10 * 3, z, x, s.p90 * 3, z);
      linePos.push(x, s.p50 * 3, z);
      if (d > 0) {
        const a = (d - 1) * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const bandGeo = new THREE.BufferGeometry();
    bandGeo.setAttribute("position", new THREE.Float32BufferAttribute(bandPos, 3));
    bandGeo.setIndex(idx);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePos, 3));
    return { bandGeo, lineGeo };
  }, []);

  useFrame(({ clock }) => {
    // Grow the forecast day by day, hold, then loop.
    const t = clock.elapsedTime % 5;
    const days = Math.min(STEPS, Math.floor((t / 3) * STEPS) + 1);
    bandGeo.setDrawRange(0, Math.max(0, (days - 1) * 6));
    lineGeo.setDrawRange(0, days);
    if (group.current) group.current.rotation.y = -0.6 + Math.sin(clock.elapsedTime * 0.5) * 0.15;
  });

  const lineObj = useMemo(() => new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: "#00e5ff", toneMapped: false })), [lineGeo]);

  return (
    <group ref={group} rotation={[0.25, -0.6, 0]}>
      <mesh ref={band} geometry={bandGeo}>
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
      </mesh>
      <primitive ref={line} object={lineObj} />
      {/* Time axis */}
      <mesh position={[0, -0.9, 0]} rotation={[0, Math.atan2(LEN * 0.6, LEN), 0]}>
        <boxGeometry args={[0.01, 0.01, LEN * 1.17]} />
        <meshBasicMaterial color="#ffb547" toneMapped={false} />
      </mesh>
    </group>
  );
}

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { coreSignal } from "@/components/providers/HudProvider";
import { coreFragment, coreVertex } from "./shaders";

const CYAN = new THREE.Color("#00e5ff");
const AMBER = new THREE.Color("#ffb547");
const ASSEMBLE_S = 2.2;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function useParticleField(count: number) {
  return useMemo(() => {
    const start = new Float32Array(count * 3);
    const target = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Target: a loose shell around the core with a few ring-plane bands.
      const band = i % 4 === 0;
      const theta = Math.random() * Math.PI * 2;
      const phi = band ? Math.PI / 2 + (Math.random() - 0.5) * 0.12 : Math.acos(2 * Math.random() - 1);
      const r = band ? 2.3 + Math.random() * 0.5 : 1.6 + Math.random() * 1.6;
      target.set([r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)], i * 3);
      // Start: scattered far out, so the core "assembles from particles".
      const s = 9 + Math.random() * 6;
      start.set([(Math.random() - 0.5) * s, (Math.random() - 0.5) * s, (Math.random() - 0.5) * s], i * 3);
    }
    return { start, target, current: start.slice() };
  }, [count]);
}

function Ring({ radius, speed, tilt, color, opacity }: { radius: number; speed: number; tilt: [number, number]; color: THREE.Color; opacity: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * speed;
  });
  return (
    <mesh ref={ref} rotation={[tilt[0], tilt[1], 0]}>
      <torusGeometry args={[radius, 0.008, 8, 160]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} />
    </mesh>
  );
}

function DashedRing({ radius, speed }: { radius: number; speed: number }) {
  const ref = useRef<THREE.Group>(null);
  const ticks = useMemo(() => Array.from({ length: 48 }, (_, i) => (i / 48) * Math.PI * 2), []);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * speed;
  });
  return (
    <group ref={ref} rotation={[Math.PI / 2.2, 0, 0]}>
      {ticks.map((a) => (
        <mesh key={a} position={[Math.cos(a) * radius, Math.sin(a) * radius, 0]} rotation={[0, 0, a]}>
          <boxGeometry args={[0.02, 0.09, 0.01]} />
          <meshBasicMaterial color={AMBER} transparent opacity={0.7} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

export function ArcCore({ particles = 1400, detail = 20 }: { particles?: number; detail?: number }) {
  const group = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Mesh>(null);
  const points = useRef<THREE.Points>(null);
  const elapsed = useRef(0);
  const field = useParticleField(particles);

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uEnergy: { value: 0 }, uColor: { value: CYAN }, uAccent: { value: AMBER } }),
    [],
  );

  useFrame((state, dt) => {
    elapsed.current += dt;
    const t = elapsed.current;

    // Energy eases up while speaking and idles with a slow breath.
    const targetEnergy = coreSignal.speaking ? 1 : 0.15 + Math.sin(t * 1.3) * 0.05;
    coreSignal.energy += (targetEnergy - coreSignal.energy) * Math.min(1, dt * 5);
    uniforms.uTime.value = t;
    uniforms.uEnergy.value = coreSignal.energy;

    if (group.current) {
      const { x, y } = coreSignal.pointer;
      group.current.rotation.y += (x * 0.45 - group.current.rotation.y) * 0.05;
      group.current.rotation.x += (-y * 0.3 - group.current.rotation.x) * 0.05;
      const s = 1 + coreSignal.energy * 0.08;
      group.current.scale.setScalar(s);
    }
    if (shell.current) {
      shell.current.rotation.y += dt * 0.12;
      shell.current.rotation.x += dt * 0.05;
    }

    if (points.current) {
      const geo = points.current.geometry;
      const pos = geo.attributes.position as THREE.BufferAttribute;
      if (t < ASSEMBLE_S + 0.1) {
        const k = easeOutCubic(Math.min(1, t / ASSEMBLE_S));
        const { start, target, current } = field;
        for (let i = 0; i < current.length; i++) current[i] = start[i] + (target[i] - start[i]) * k;
        pos.needsUpdate = true;
      }
      points.current.rotation.y += dt * 0.04;
    }
    state.invalidate();
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[1.05, detail]} />
        <shaderMaterial
          vertexShader={coreVertex}
          fragmentShader={coreFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={shell}>
        <icosahedronGeometry args={[1.38, 1]} />
        <meshBasicMaterial color={CYAN} wireframe transparent opacity={0.22} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshBasicMaterial color={"#7ff4ff"} toneMapped={false} />
      </mesh>

      <Ring radius={1.75} speed={0.35} tilt={[Math.PI / 2.1, 0.2]} color={CYAN} opacity={0.75} />
      <Ring radius={2.05} speed={-0.22} tilt={[Math.PI / 2.6, -0.5]} color={CYAN} opacity={0.45} />
      <Ring radius={2.45} speed={0.15} tilt={[Math.PI / 1.8, 0.8]} color={AMBER} opacity={0.4} />
      <DashedRing radius={2.75} speed={0.1} />

      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[field.current, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.025}
          color={CYAN}
          transparent
          opacity={0.85}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </group>
  );
}

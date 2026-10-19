"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { signals } from "@/yashu/signals";
import { coreFragment, coreVertex } from "./shaders";

const CYAN = new THREE.Color("#00e5ff");
const AMBER = new THREE.Color("#ffb547");
const ASSEMBLE_S = 2.2;
const BARS = 64;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function useParticleField(count: number) {
  return useMemo(() => {
    const start = new Float32Array(count * 3);
    const target = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const band = i % 4 === 0;
      const theta = Math.random() * Math.PI * 2;
      const phi = band ? Math.PI / 2 + (Math.random() - 0.5) * 0.12 : Math.acos(2 * Math.random() - 1);
      const r = band ? 2.3 + Math.random() * 0.5 : 1.6 + Math.random() * 1.6;
      target.set([r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)], i * 3);
      const s = 9 + Math.random() * 6;
      start.set([(Math.random() - 0.5) * s, (Math.random() - 0.5) * s, (Math.random() - 0.5) * s], i * 3);
    }
    return { start, target, current: start.slice() };
  }, [count]);
}

/** Rings speed up with the voice, contract and turn amber while listening. */
function Ring({ radius, speed, tilt, accent, opacity }: { radius: number; speed: number; tilt: [number, number]; accent?: boolean; opacity: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const listen = useRef(0);
  useFrame((_, dt) => {
    if (!ref.current || !mat.current) return;
    listen.current += ((signals.listening ? 1 : 0) - listen.current) * Math.min(1, dt * 4);
    ref.current.rotation.z += dt * speed * (1 + signals.voiceLevel * 3 + listen.current);
    ref.current.scale.setScalar(1 - listen.current * 0.16);
    mat.current.color.copy(accent ? AMBER : CYAN).lerp(AMBER, listen.current);
  });
  return (
    <mesh ref={ref} rotation={[tilt[0], tilt[1], 0]}>
      <torusGeometry args={[radius, 0.008, 8, 160]} />
      <meshBasicMaterial ref={mat} transparent opacity={opacity} toneMapped={false} />
    </mesh>
  );
}

/** Radial equalizer bars that pulse with Y.A.S.H.U.'s voice. */
function EqRing({ radius = 1.62 }: { radius?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const heights = useRef(new Float32Array(BARS));
  useFrame((_, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    for (let i = 0; i < BARS; i++) {
      const band = signals.bands[i % 16];
      const target = signals.speaking ? 0.04 + band * 0.55 : signals.listening ? 0.04 + signals.micLevel * 0.3 * (0.5 + 0.5 * Math.sin(i * 0.9)) : 0.02;
      heights.current[i] += (target - heights.current[i]) * Math.min(1, dt * 14);
      const a = (i / BARS) * Math.PI * 2;
      const h = heights.current[i];
      dummy.position.set(Math.cos(a) * (radius + h / 2), Math.sin(a) * (radius + h / 2), 0);
      dummy.rotation.set(0, 0, a - Math.PI / 2);
      dummy.scale.set(1, h, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, BARS]}>
      <boxGeometry args={[0.035, 1, 0.01]} />
      <meshBasicMaterial color={CYAN} transparent opacity={0.85} toneMapped={false} />
    </instancedMesh>
  );
}

export function ArcCore({ particles = 1400, detail = 20 }: { particles?: number; detail?: number }) {
  const group = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Mesh>(null);
  const points = useRef<THREE.Points>(null);
  const elapsed = useRef(0);
  const listen = useRef(0);
  const field = useParticleField(particles);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uEnergy: { value: 0 },
      uListen: { value: 0 },
      uMic: { value: 0 },
      uColor: { value: CYAN },
      uAccent: { value: AMBER },
    }),
    [],
  );

  useEffect(() => () => points.current?.geometry.dispose(), []);

  useFrame((_, dt) => {
    elapsed.current += dt;
    const t = elapsed.current;

    // Voice amplitude while speaking, a slow breath when idle.
    const target = signals.speaking ? 0.25 + signals.voiceLevel * 0.9 : 0.15 + Math.sin(t * 1.1) * 0.06;
    signals.energy += (target - signals.energy) * Math.min(1, dt * 10);
    listen.current += ((signals.listening ? 1 : 0) - listen.current) * Math.min(1, dt * 4);
    uniforms.uTime.value = t;
    uniforms.uEnergy.value = signals.energy;
    uniforms.uListen.value = listen.current;
    uniforms.uMic.value += (signals.micLevel - uniforms.uMic.value) * Math.min(1, dt * 12);

    if (group.current) {
      const px = signals.tilt.enabled ? signals.tilt.x : signals.pointer.x;
      const py = signals.tilt.enabled ? signals.tilt.y : signals.pointer.y;
      group.current.rotation.y += (px * 0.45 - group.current.rotation.y) * 0.05;
      group.current.rotation.x += (-py * 0.3 - group.current.rotation.x) * 0.05;
      group.current.scale.setScalar(1 + signals.energy * 0.1);
    }
    if (shell.current) {
      shell.current.rotation.y += dt * (0.12 + signals.voiceLevel * 0.6);
      shell.current.rotation.x += dt * 0.05;
    }
    if (points.current) {
      const pos = points.current.geometry.attributes.position as THREE.BufferAttribute;
      if (t < ASSEMBLE_S + 0.1) {
        const k = easeOutCubic(Math.min(1, t / ASSEMBLE_S));
        const { start, target: tgt, current } = field;
        for (let i = 0; i < current.length; i++) current[i] = start[i] + (tgt[i] - start[i]) * k;
        pos.needsUpdate = true;
      }
      points.current.rotation.y += dt * 0.04;
    }
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

      <EqRing />
      <Ring radius={1.85} speed={0.35} tilt={[Math.PI / 2.1, 0.2]} opacity={0.75} />
      <Ring radius={2.1} speed={-0.22} tilt={[Math.PI / 2.6, -0.5]} opacity={0.45} />
      <Ring radius={2.45} speed={0.15} tilt={[Math.PI / 1.8, 0.8]} accent opacity={0.4} />

      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[field.current, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.025} color={CYAN} transparent opacity={0.85} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </points>
    </group>
  );
}

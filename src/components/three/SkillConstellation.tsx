"use client";

import { Html } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { skillGroups } from "@/data/portfolio";
import { signals as coreSignal } from "@/yashu/signals";

type Props = {
  active: string | null;
  onHover: (skill: string | null) => void;
  mobile: boolean;
  running: boolean;
};

// Each group orbits on its own tilted ring around the centre.
const ORBITS = [
  { r: 1.5, tilt: [0.35, 0, 0.1], speed: 0.12 },
  { r: 2.4, tilt: [-0.25, 0, -0.3], speed: -0.08 },
  { r: 3.2, tilt: [0.5, 0, 0.45], speed: 0.06 },
  { r: 3.95, tilt: [-0.15, 0, 0.2], speed: -0.045 },
] as const;

function Orbit({ index, active, onHover }: { index: number; active: string | null; onHover: Props["onHover"] }) {
  const group = skillGroups[index];
  const o = ORBITS[index];
  const ref = useRef<THREE.Group>(null);
  const color = useMemo(() => new THREE.Color(group.color), [group.color]);

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * o.speed;
  });

  return (
    <group rotation={o.tilt as unknown as [number, number, number]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[o.r, 0.005, 6, 128]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
      <group ref={ref}>
        {group.skills.map((skill, i) => {
          const a = (i / group.skills.length) * Math.PI * 2;
          const isActive = active === skill;
          return (
            <group key={skill} position={[Math.cos(a) * o.r, 0, Math.sin(a) * o.r]}>
              <mesh
                onPointerOver={(e) => {
                  e.stopPropagation();
                  onHover(skill);
                }}
                onPointerOut={() => onHover(null)}
                scale={isActive ? 1.9 : 1}
              >
                <sphereGeometry args={[0.07, 16, 16]} />
                <meshBasicMaterial color={isActive ? "#ffffff" : color} />
              </mesh>
              <mesh scale={isActive ? 3.2 : 2}>
                <sphereGeometry args={[0.07, 12, 12]} />
                <meshBasicMaterial color={color} transparent opacity={isActive ? 0.35 : 0.12} depthWrite={false} />
              </mesh>
              {isActive && (
                <Html center distanceFactor={9} style={{ pointerEvents: "none" }} zIndexRange={[20, 0]}>
                  <span className="whitespace-nowrap rounded border border-cyan/50 bg-void/90 px-2 py-0.5 font-mono text-xs text-ink">
                    {skill}
                  </span>
                </Html>
              )}
            </group>
          );
        })}
      </group>
    </group>
  );
}

function Scene({ active, onHover }: Pick<Props, "active" | "onHover">) {
  const root = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!root.current) return;
    const { x, y } = coreSignal.pointer;
    root.current.rotation.x += (0.25 - y * 0.2 - root.current.rotation.x) * 0.04;
    root.current.rotation.z += (x * 0.1 - root.current.rotation.z) * 0.04;
  });
  return (
    <group ref={root}>
      <mesh>
        <icosahedronGeometry args={[0.45, 1]} />
        <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.5} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshBasicMaterial color="#7ff4ff" />
      </mesh>
      {skillGroups.map((g, i) => (
        <Orbit key={g.id} index={i} active={active} onHover={onHover} />
      ))}
    </group>
  );
}

export default function SkillConstellation({ active, onHover, mobile, running }: Props) {
  return (
    <Canvas
      frameloop={running ? "always" : "never"}
      dpr={[1, mobile ? 1.5 : 2]}
      camera={{ position: [0, 1.2, mobile ? 12 : 11], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={() => onHover(null)}
    >
      <Scene active={active} onHover={onHover} />
    </Canvas>
  );
}

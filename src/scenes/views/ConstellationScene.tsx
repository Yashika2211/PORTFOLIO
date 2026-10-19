"use client";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { projects, skillGroups } from "@/data/portfolio";
import { TextSprite } from "./TextSprite";

type Props = {
  /** Fine pointer: allow drag-to-rotate (touch keeps page scrolling instead). */
  draggable?: boolean;
  active: string | null;
  pinned: string | null;
  onHover: (skill: string | null) => void;
  onPick: (skill: string) => void;
};

const ORBITS = [
  { r: 1.5, tilt: [0.35, 0, 0.1], speed: 0.12 },
  { r: 2.4, tilt: [-0.25, 0, -0.3], speed: -0.08 },
  { r: 3.2, tilt: [0.5, 0, 0.45], speed: 0.06 },
  { r: 3.95, tilt: [-0.15, 0, 0.2], speed: -0.045 },
] as const;

/** Project beacons on an outer halo; skill beams terminate here. */
const BEACONS = projects.map((p, i) => {
  const a = (i / projects.length) * Math.PI * 2 + Math.PI / 2;
  return { slug: p.slug, title: p.title, skills: p.skills, pos: new THREE.Vector3(Math.cos(a) * 3.9, Math.sin(a) * 3.9, -1.2) };
});

const nodeRefs = new Map<string, THREE.Object3D>();

function Orbit({ index, active, pinned, onHover, onPick }: Props & { index: number }) {
  const group = skillGroups[index];
  const o = ORBITS[index];
  const ref = useRef<THREE.Group>(null);
  const color = useMemo(() => new THREE.Color(group.color), [group.color]);

  useFrame((_, dt) => {
    // Orbits freeze while a skill is pinned so its beams stay readable.
    if (ref.current && !pinned) ref.current.rotation.y += dt * o.speed;
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
          const on = active === skill || pinned === skill;
          return (
            <group key={skill} position={[Math.cos(a) * o.r, 0, Math.sin(a) * o.r]} ref={(el) => void (el ? nodeRefs.set(skill, el) : nodeRefs.delete(skill))}>
              <mesh
                onPointerOver={(e) => {
                  e.stopPropagation();
                  onHover(skill);
                  document.body.style.cursor = "pointer";
                }}
                onPointerOut={() => {
                  onHover(null);
                  document.body.style.cursor = "";
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onPick(skill);
                }}
                scale={on ? 1.9 : 1}
              >
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshBasicMaterial color={on ? "#ffffff" : color} />
              </mesh>
              <mesh scale={on ? 3.2 : 2}>
                <sphereGeometry args={[0.08, 12, 12]} />
                <meshBasicMaterial color={color} transparent opacity={on ? 0.35 : 0.12} depthWrite={false} />
              </mesh>
              {on && <TextSprite text={skill} position={[0, 0.34, 0]} size={0.28} />}
            </group>
          );
        })}
      </group>
    </group>
  );
}

/** Light beams from the pinned skill node to every project beacon that uses it. */
function Beams({ pinned }: { pinned: string | null }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(BEACONS.length * 6), 3));
    return g;
  }, []);
  const mat = useRef<THREE.LineBasicMaterial>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const root = useRef<THREE.Group>(null);

  useFrame((state) => {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const node = pinned ? nodeRefs.get(pinned) : undefined;
    let n = 0;
    if (node && root.current) {
      node.getWorldPosition(tmp);
      root.current.worldToLocal(tmp);
      for (const b of BEACONS) {
        if (!b.skills.includes(pinned!)) continue;
        pos.setXYZ(n++, tmp.x, tmp.y, tmp.z);
        pos.setXYZ(n++, b.pos.x, b.pos.y, b.pos.z);
      }
    }
    geo.setDrawRange(0, n);
    pos.needsUpdate = true;
    if (mat.current) mat.current.opacity = 0.55 + Math.sin(state.clock.elapsedTime * 6) * 0.25;
  });

  return (
    <group ref={root}>
      <lineSegments geometry={geo}>
        <lineBasicMaterial ref={mat} color="#ffb547" transparent toneMapped={false} />
      </lineSegments>
      {BEACONS.map((b) => {
        const lit = pinned ? b.skills.includes(pinned) : false;
        return (
          <group key={b.slug} position={b.pos}>
            <mesh>
              <octahedronGeometry args={[lit ? 0.2 : 0.13, 0]} />
              <meshBasicMaterial color={lit ? "#ffb547" : "#00e5ff"} wireframe={!lit} />
            </mesh>
            <TextSprite text={b.title} position={[0, -0.36, 0]} size={0.24} color={lit ? "#ffb547" : "#9fb3c2"} bg={false} />
          </group>
        );
      })}
    </group>
  );
}

export function ConstellationScene(props: Props) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1.2, 12.5]} fov={45} />
      {props.draggable && (
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} enablePan={false} minDistance={8} maxDistance={15} rotateSpeed={0.6} />
      )}
      <mesh>
        <icosahedronGeometry args={[0.45, 1]} />
        <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.5} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshBasicMaterial color="#7ff4ff" />
      </mesh>
      {skillGroups.map((g, i) => (
        <Orbit key={g.id} index={i} {...props} />
      ))}
      <Beams pinned={props.pinned} />
    </>
  );
}

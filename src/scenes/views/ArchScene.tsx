"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Project } from "@/data/portfolio";
import { signals } from "@/yashu/signals";
import { TextSprite } from "./TextSprite";

const toWorld = (x: number, y: number, i: number) => new THREE.Vector3((x - 50) / 15.5, -(y - 30) / 14, ((i * 7) % 3) - 1);
const boxEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.76, 0.56, 0.31));

/** Break-the-frame architecture: nodes at different depths, packets flowing along edges. */
export function ArchScene({ arch }: { arch: Project["arch"] }) {
  const group = useRef<THREE.Group>(null);
  const packets = useRef<(THREE.Mesh | null)[]>([]);
  const nodes = useMemo(() => arch.nodes.map((n, i) => ({ ...n, pos: toWorld(n.x, n.y, i) })), [arch]);
  const edges = useMemo(() => {
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    return arch.edges.filter((e) => byId[e.from] && byId[e.to]).map((e) => ({ a: byId[e.from].pos, b: byId[e.to].pos }));
  }, [arch, nodes]);
  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setFromPoints(edges.flatMap((e) => [e.a, e.b]));
    return g;
  }, [edges]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    packets.current.forEach((p, i) => {
      if (!p) return;
      const e = edges[i % edges.length];
      const k = (t * 0.6 + i * 0.37) % 1;
      p.position.lerpVectors(e.a, e.b, k);
    });
    const g = group.current;
    if (g) {
      const px = signals.tilt.enabled ? signals.tilt.x : signals.pointer.x;
      const py = signals.tilt.enabled ? signals.tilt.y : signals.pointer.y;
      g.rotation.y += (px * 0.5 - g.rotation.y) * 0.06;
      g.rotation.x += (-py * 0.35 - g.rotation.x) * 0.06;
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 8.4]} fov={42} />
      <group ref={group}>
        <lineSegments geometry={lineGeo}>
          <lineBasicMaterial color="#ffb547" transparent opacity={0.7} toneMapped={false} />
        </lineSegments>
        {nodes.map((n) => (
          <group key={n.id} position={n.pos}>
            <mesh>
              <boxGeometry args={[1.75, 0.55, 0.3]} />
              <meshBasicMaterial color="#04202b" transparent opacity={0.85} />
            </mesh>
            <lineSegments geometry={boxEdges}>
              <lineBasicMaterial color="#00e5ff" toneMapped={false} />
            </lineSegments>
            <TextSprite text={n.label} position={[0, 0, 0.2]} size={0.3} bg={false} />
          </group>
        ))}
        {edges.flatMap((_, i) =>
          [0, 1].map((j) => (
            <mesh key={`${i}-${j}`} ref={(el) => void (packets.current[i * 2 + j] = el)}>
              <sphereGeometry args={[0.06, 12, 12]} />
              <meshBasicMaterial color={j ? "#ffb547" : "#e6fdff"} toneMapped={false} />
            </mesh>
          )),
        )}
      </group>
    </>
  );
}

"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

const COINS = 6;
const BUYER = new THREE.Vector3(-1.25, 0, 0);
const MERCHANT = new THREE.Vector3(1.25, 0, 0);
const tmp = new THREE.Vector3();

/** Haggle: buyer and merchant agent orbs trading glowing coins over a handshake beam. */
export function HaggleModel() {
  const coins = useRef<(THREE.Mesh | null)[]>([]);
  const beam = useRef<THREE.MeshBasicMaterial>(null);
  const orbs = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    coins.current.forEach((c, i) => {
      if (!c) return;
      // Alternate direction: offers go buyer → merchant, counter-offers come back.
      const p = (t * 0.45 + i / COINS) % 1;
      const forward = i % 2 === 0;
      tmp.lerpVectors(forward ? BUYER : MERCHANT, forward ? MERCHANT : BUYER, p);
      tmp.y = Math.sin(p * Math.PI) * 0.75 * (forward ? 1 : -0.6);
      c.position.copy(tmp);
      c.rotation.y = t * 4 + i;
      c.scale.setScalar(Math.sin(p * Math.PI) * 0.9 + 0.1);
    });
    if (beam.current) beam.current.opacity = 0.35 + Math.sin(t * 5) * 0.2;
    if (orbs.current) orbs.current.children.forEach((o, i) => (o.position.y = Math.sin(t * 1.6 + i * 2) * 0.08));
  });

  return (
    <group>
      <group ref={orbs}>
        <group position={BUYER}>
          <mesh>
            <sphereGeometry args={[0.36, 32, 32]} />
            <meshBasicMaterial color="#00e5ff" toneMapped={false} />
          </mesh>
          <mesh>
            <icosahedronGeometry args={[0.55, 1]} />
            <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.4} />
          </mesh>
        </group>
        <group position={MERCHANT}>
          <mesh>
            <sphereGeometry args={[0.36, 32, 32]} />
            <meshBasicMaterial color="#ffb547" toneMapped={false} />
          </mesh>
          <mesh>
            <icosahedronGeometry args={[0.55, 1]} />
            <meshBasicMaterial color="#ffb547" wireframe transparent opacity={0.4} />
          </mesh>
        </group>
      </group>
      {/* Handshake beam */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 2.5, 8]} />
        <meshBasicMaterial ref={beam} color="#e6fdff" transparent opacity={0.4} toneMapped={false} />
      </mesh>
      {Array.from({ length: COINS }, (_, i) => (
        <mesh key={i} ref={(el) => void (coins.current[i] = el)} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.035, 20]} />
          <meshBasicMaterial color={i % 2 ? "#ffe2a8" : "#ffb547"} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

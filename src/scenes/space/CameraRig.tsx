"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { signals } from "@/yashu/signals";

/** One waypoint per section (hero → contact); the core sits near the first. */
export const WAYPOINTS: [number, number, number][] = [
  [0, 0, 6.6], // hero
  [-2.5, 1.2, -6], // about
  [2.4, -0.8, -20], // skills
  [-1.2, 0.6, -36], // projects
  [2.8, 1.2, -52], // experience
  [0, -1.2, -66], // achievements
  [0, 0, -80], // contact
];

const tmp = new THREE.Vector3();
const look = new THREE.Vector3();
const heroLook = new THREE.Vector3(0, 0, 0);

/** Scroll-driven camera path through the holographic space. */
export function CameraRig({ animate }: { animate: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(WAYPOINTS.map((p) => new THREE.Vector3(...p)), false, "centripetal"), []);
  const t = useRef(0);
  const shake = useRef(0);

  useFrame((_, dt) => {
    const target = animate ? signals.scroll : 0;
    // Warp makes the camera catch up fast, so it visibly flies through.
    const k = Math.min(1, dt * (signals.warp > 0.05 ? 7 : 3.2));
    t.current += (target - t.current) * k;

    curve.getPointAt(Math.min(0.999, t.current), tmp);
    camera.position.copy(tmp);
    curve.getPointAt(Math.min(1, t.current + 0.025), look);
    const blend = THREE.MathUtils.smoothstep(t.current, 0, 0.06);
    look.lerp(heroLook, 1 - blend);

    // Subtle pointer parallax on top of the path.
    const px = signals.tilt.enabled ? signals.tilt.x : signals.pointer.x;
    const py = signals.tilt.enabled ? signals.tilt.y : signals.pointer.y;
    camera.position.x += px * 0.25;
    camera.position.y += py * 0.15;

    shake.current = signals.warp * 0.06 + signals.glitch * 0.05;
    if (shake.current > 0.001) {
      camera.position.x += (Math.random() - 0.5) * shake.current;
      camera.position.y += (Math.random() - 0.5) * shake.current;
    }
    camera.lookAt(look);

    const fov = 45 + signals.warp * 30;
    // drei <View>s can leave their aspect on the shared camera; re-assert the canvas aspect.
    const aspect = size.width / size.height;
    if (Math.abs(camera.fov - fov) > 0.01 || camera.aspect !== aspect) {
      camera.fov += (fov - camera.fov) * Math.min(1, dt * 8);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    }
    signals.glitch = Math.max(0, signals.glitch - dt * 2.5);
  });

  return null;
}

/** Thin hexagonal gates the camera passes through at each section location. */
export function Gates() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    ref.current?.children.forEach((g, i) => (g.rotation.z += dt * (i % 2 ? 0.05 : -0.04)));
  });
  return (
    <group ref={ref}>
      {WAYPOINTS.slice(1).map((p, i) => (
        <group key={i} position={[p[0] * 0.6, p[1] * 0.6, p[2] - 7]}>
          <mesh>
            <torusGeometry args={[5.5, 0.012, 6, 6]} />
            <meshBasicMaterial color={i % 3 === 2 ? "#ffb547" : "#00e5ff"} transparent opacity={0.14} toneMapped={false} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 6]}>
            <torusGeometry args={[6.2, 0.006, 6, 6]} />
            <meshBasicMaterial color="#00e5ff" transparent opacity={0.07} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

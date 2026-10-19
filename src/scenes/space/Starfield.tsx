"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { signals } from "@/yashu/signals";

/**
 * Instanced particle field filling the camera path. During a warp jump the
 * vertex shader stretches every particle along Z into a light streak — one
 * draw call, no per-frame matrix updates.
 */
export function Starfield({ count = 2400, overdrive = false }: { count?: number; overdrive?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const uniforms = useMemo(() => ({ uStretch: { value: 1 } }), []);

  const material = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({
      vertexColors: false,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uStretch = uniforms.uStretch;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uStretch;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\ntransformed.z *= uStretch;");
    };
    return m;
  }, [uniforms]);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 3 + Math.pow(Math.random(), 0.6) * 26;
      dummy.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.7, 14 - Math.random() * 120);
      dummy.scale.setScalar(0.5 + Math.random() * 1.2);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.set(Math.random() < 0.12 ? "#ffb547" : Math.random() < 0.5 ? "#00e5ff" : "#7fdfff"));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return () => material.dispose();
  }, [count, material]);

  useFrame((_, dt) => {
    const target = 1 + signals.warp * 60;
    uniforms.uStretch.value += (target - uniforms.uStretch.value) * Math.min(1, dt * 8);
    if (ref.current) ref.current.rotation.z += dt * (0.01 + (overdrive ? 0.35 : 0) + signals.warp * 0.2);
  });

  return (
    <instancedMesh ref={ref} args={[undefined, material, count]} frustumCulled={false}>
      <boxGeometry args={[0.022, 0.022, 0.2]} />
    </instancedMesh>
  );
}

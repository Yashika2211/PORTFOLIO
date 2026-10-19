"use client";

import { PerspectiveCamera, View } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { lazy, Suspense, useRef, type ComponentType, type LazyExoticComponent, type ReactNode } from "react";
import * as THREE from "three";

/** One lazily-loaded chunk per model; `preloadModel` warms it as the card nears the viewport. */
const loaders: Record<string, () => Promise<{ default: ComponentType }>> = {
  haggle: () => import("./HaggleModel").then((m) => ({ default: m.HaggleModel })),
  codenation: () => import("./CodeNationModel").then((m) => ({ default: m.CodeNationModel })),
  cashforecastor: () => import("./ForecastModel").then((m) => ({ default: m.ForecastModel })),
  "saans-saathi": () => import("./SkylineModel").then((m) => ({ default: m.SkylineModel })),
  "amazon-ml-2026": () => import("./MatchModel").then((m) => ({ default: m.MatchModel })),
};
const models: Record<string, LazyExoticComponent<ComponentType>> = Object.fromEntries(
  Object.entries(loaders).map(([k, load]) => [k, lazy(load)]),
);

export function preloadModel(slug: string) {
  void loaders[slug]?.();
}

/** Rises out of the projector and settles in front of the card; sinks back when hidden. */
function Rise({ shown, children }: { shown: boolean; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const k = useRef(0);
  useFrame((state, dt) => {
    k.current += ((shown ? 1 : 0) - k.current) * Math.min(1, dt * 6);
    const g = ref.current;
    if (!g) return;
    const e = k.current;
    g.position.y = -1.8 * (1 - e) + Math.sin(state.clock.elapsedTime * 1.4) * 0.05 * e;
    g.scale.setScalar(0.15 + e * 0.85);
    g.visible = e > 0.02;
  });
  return <group ref={ref}>{children}</group>;
}

export default function ProjectionView({ slug, shown }: { slug: string; shown: boolean }) {
  const Model = models[slug];
  if (!Model) return null;
  return (
    <View index={2} className="pointer-events-none absolute bottom-[22%] right-[2%] h-[150%] w-[40%]">
      <PerspectiveCamera makeDefault position={[0, 0.2, 5]} fov={40} />
      <Rise shown={shown}>
        <Suspense fallback={null}>
          <Model />
        </Suspense>
      </Rise>
      {/* Projector light cone */}
      <mesh position={[0, -1.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.4, 48]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={shown ? 0.8 : 0.25} toneMapped={false} />
      </mesh>
    </View>
  );
}

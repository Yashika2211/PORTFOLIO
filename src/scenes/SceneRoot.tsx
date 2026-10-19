"use client";

import { PerformanceMonitor, View } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { signals } from "@/yashu/signals";
import { useYashu } from "@/yashu/store";
import { ArcCore } from "./core/ArcCore";
import { CameraRig, Gates } from "./space/CameraRig";
import { Starfield } from "./space/Starfield";

/** Quality tiers chosen by PerformanceMonitor: 2 = full, 1 = reduced, 0 = minimal. */
type Tier = 0 | 1 | 2;
const PARTICLES: Record<Tier, number> = { 0: 700, 1: 1600, 2: 2600 };
const CORE_PARTICLES: Record<Tier, number> = { 0: 450, 1: 900, 2: 1400 };
const DPR: Record<Tier, number> = { 0: 1, 1: 1.5, 2: 2 };

function Effects({ tier }: { tier: Tier }) {
  const offset = useMemo(() => new THREE.Vector2(0.0008, 0.0005), []);
  useFrame(() => {
    // Glitch cut + warp push the RGB split; idles almost invisible.
    const k = 0.0008 + signals.glitch * 0.012 + signals.warp * 0.004;
    offset.set(k, k * 0.6);
  });
  const bloom = <Bloom intensity={1.05} luminanceThreshold={0.15} luminanceSmoothing={0.3} mipmapBlur />;
  const chroma = <ChromaticAberration offset={offset} blendFunction={BlendFunction.NORMAL} radialModulation={false} modulationOffset={0} />;
  const vignette = <Vignette eskil={false} offset={0.3} darkness={0.45} />;
  // EffectComposer rejects null children, so each tier gets its own explicit pass list.
  return tier === 2 ? (
    <EffectComposer multisampling={0} renderPriority={1}>
      {bloom}
      {chroma}
      <Noise opacity={0.03} premultiply />
      {vignette}
    </EffectComposer>
  ) : (
    <EffectComposer multisampling={0} renderPriority={1}>
      {bloom}
      {chroma}
      {vignette}
    </EffectComposer>
  );
}

/** Without post-processing, something still has to render the main scene before the Views. */
function PlainRender() {
  useFrame(({ gl, scene, camera }) => {
    gl.autoClear = true;
    gl.render(scene, camera);
  }, 1);
  return null;
}

export default function SceneRoot({ mobile, lowPower, animate }: { mobile: boolean; lowPower: boolean; animate: boolean }) {
  const [tier, setTier] = useState<Tier>(mobile || lowPower ? 0 : 2);
  const [visible, setVisible] = useState(true);
  const overdrive = useYashu((s) => s.overdrive);

  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === "visible");
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      signals.scroll = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };
    onScroll();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <Canvas
      className="!fixed inset-0"
      style={{ position: "fixed", inset: 0, pointerEvents: "none" }}
      eventSource={typeof document !== "undefined" ? document.body : undefined}
      eventPrefix="client"
      frameloop={visible ? "always" : "never"}
      dpr={[1, DPR[tier]]}
      camera={{ position: [0, 0, 6.6], fov: 45, near: 0.1, far: 200 }}
      gl={{ antialias: tier > 0, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      aria-hidden="true"
    >
      <PerformanceMonitor
        flipflops={3}
        onIncline={() => setTier((t) => (Math.min(2, t + 1) as Tier))}
        onDecline={() => setTier((t) => (Math.max(0, t - 1) as Tier))}
        onFallback={() => setTier(0)}
      >
        <CameraRig animate={animate} />
        <group position={mobile ? [0, -1.5, -1.5] : [2.1, 0, 0]}>
          <ArcCore particles={CORE_PARTICLES[tier]} detail={tier === 2 ? 20 : 10} />
        </group>
        <Starfield count={PARTICLES[tier]} overdrive={overdrive} />
        <Gates />
        {tier === 0 ? <PlainRender /> : <Effects tier={tier} />}
        <View.Port />
      </PerformanceMonitor>
    </Canvas>
  );
}

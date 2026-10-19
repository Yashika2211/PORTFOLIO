"use client";

import { Canvas } from "@react-three/fiber";
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ArcCore } from "./ArcCore";

/** Pauses rendering whenever the element is off-screen or the tab is hidden. */
function useShouldRender(ref: React.RefObject<HTMLElement | null>) {
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ref]);
  return onScreen && tabVisible;
}

export default function CoreCanvas({ mobile }: { mobile: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const active = useShouldRender(wrap);
  const chroma = useRef(new THREE.Vector2(0.0009, 0.0006));

  return (
    <div ref={wrap} className="absolute inset-0" aria-hidden="true">
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={[1, mobile ? 1.5 : 2]}
        camera={{ position: [0, 0, mobile ? 8.2 : 6.6], fov: 45 }}
        gl={{ antialias: !mobile, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <ArcCore particles={mobile ? 500 : 1400} detail={mobile ? 10 : 20} />
        {!mobile && (
          <EffectComposer multisampling={0}>
            <Bloom intensity={1.1} luminanceThreshold={0.15} luminanceSmoothing={0.3} mipmapBlur />
            <ChromaticAberration offset={chroma.current} blendFunction={BlendFunction.NORMAL} radialModulation={false} modulationOffset={0} />
            <Noise opacity={0.035} premultiply />
            <Vignette eskil={false} offset={0.25} darkness={0.7} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}

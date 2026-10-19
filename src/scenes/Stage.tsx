"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { canRender3D, useCapabilities } from "@/lib/capabilities";
import { useYashu } from "@/yashu/store";

const SceneRoot = dynamic(() => import("./SceneRoot"), { ssr: false });

/**
 * Mounts the single shared WebGL canvas behind the DOM when the device can
 * handle it. Otherwise nothing renders here and components keep their 2D
 * fallbacks (they read `gl3d` from the store).
 */
export function Stage({ ready }: { ready: boolean }) {
  const caps = useCapabilities();
  // Reduced motion gets the calm 2D fallbacks — no camera path, warp or glitch.
  const enabled = ready && canRender3D(caps) && !caps.reducedMotion;
  const stealth = useYashu((s) => s.stealth);
  const overdrive = useYashu((s) => s.overdrive);

  useEffect(() => {
    useYashu.getState().set({ gl3d: enabled });
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-[5] transition-[opacity,filter] duration-700"
      style={{
        opacity: stealth ? 0.3 : 1,
        filter: overdrive ? "hue-rotate(-150deg) saturate(1.5) brightness(1.1)" : undefined,
      }}
    >
      <SceneRoot mobile={caps.mobile} lowPower={caps.lowPower} animate />
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { canRender3D, useCapabilities } from "@/lib/capabilities";
import { useYashu } from "@/yashu/store";

const SceneRoot = dynamic(() => import("./SceneRoot"), { ssr: false });

/**
 * Mounts the single shared WebGL canvas behind the DOM when the device can
 * handle it. Otherwise nothing renders here and components keep their 2D
 * fallbacks (they read `gl3d` from the store).
 *
 * The stage is heavy (three.js parse + shader compiles), so it waits for the
 * visitor's first interaction or for the browser to go idle — the page is
 * interactive immediately and the 2D core crossfades into the 3D one.
 */
function useArmed(ready: boolean) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!ready || armed) return;
    const go = () => setArmed(true);
    const events = ["pointermove", "pointerdown", "wheel", "touchstart", "keydown"] as const;
    events.forEach((e) => window.addEventListener(e, go, { once: true, passive: true }));
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const t = window.setTimeout(() => (w.requestIdleCallback ? w.requestIdleCallback(go, { timeout: 2000 }) : go()), 2500);
    return () => {
      clearTimeout(t);
      events.forEach((e) => window.removeEventListener(e, go));
    };
  }, [ready, armed]);
  return armed;
}

export function Stage({ ready }: { ready: boolean }) {
  const caps = useCapabilities();
  // Reduced motion gets the calm 2D fallbacks — no camera path, warp or glitch.
  const armed = useArmed(ready);
  const [forced2D, setForced2D] = useState(false);
  useEffect(() => {
    // `localStorage["yashu:quality"] = "off"` → pure 2D mode (also used by e2e tests).
    try {
      setForced2D(window.localStorage.getItem("yashu:quality") === "off");
    } catch {
      /* storage blocked */
    }
  }, []);
  const enabled = armed && !forced2D && canRender3D(caps) && !caps.reducedMotion;
  const glReady = useYashu((s) => s.glReady);
  const stealth = useYashu((s) => s.stealth);
  const overdrive = useYashu((s) => s.overdrive);
  // While a briefing is open the canvas rises above it so its 3D views can pop out.
  const briefing = useYashu((s) => s.openProject !== null);

  useEffect(() => {
    useYashu.getState().set({ gl3d: enabled });
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 transition-[opacity,filter] duration-700 ${briefing ? "z-[86]" : "-z-[5]"}`}
      style={{
        opacity: !glReady ? 0 : stealth ? 0.3 : 1,
        filter: overdrive ? "hue-rotate(-150deg) saturate(1.5) brightness(1.1)" : undefined,
      }}
    >
      <SceneRoot mobile={caps.mobile} lowPower={caps.lowPower} animate />
    </div>
  );
}

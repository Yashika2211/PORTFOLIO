"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useYashu } from "../store";

type Pt = { x: number; y: number };

/** Consent dialog + corner skeleton preview for optional MediaPipe gesture control. */
export function GesturePanel() {
  const { prompt, on, set } = useYashu(useShallow((s) => ({ prompt: s.gesturePrompt, on: s.gestures, set: s.set })));
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const edges = useRef<[number, number][]>([]);

  const draw = useCallback((pts: Pt[] | null) => {
    const c = canvas.current;
    const g = c?.getContext("2d");
    if (!c || !g) return;
    g.clearRect(0, 0, c.width, c.height);
    if (!pts) return;
    // Mirror so the skeleton moves the same way as the visitor's hand.
    const X = (p: Pt) => (1 - p.x) * c.width;
    const Y = (p: Pt) => p.y * c.height;
    g.strokeStyle = "#00e5ff";
    g.lineWidth = 2;
    for (const [a, b] of edges.current) {
      g.beginPath();
      g.moveTo(X(pts[a]), Y(pts[a]));
      g.lineTo(X(pts[b]), Y(pts[b]));
      g.stroke();
    }
    g.fillStyle = "#ffb547";
    for (const p of pts) {
      g.beginPath();
      g.arc(X(p), Y(p), 2.5, 0, Math.PI * 2);
      g.fill();
    }
  }, []);

  const enable = async () => {
    setStatus("loading");
    try {
      const mod = await import("../gestures");
      edges.current = mod.HAND_EDGES;
      set({ gestures: true, gesturePrompt: false });
      await mod.startGestures(video.current!, draw);
      setStatus("idle");
    } catch {
      set({ gestures: false });
      setStatus("error");
    }
  };

  useEffect(() => {
    if (on) return;
    void import("../gestures").then((m) => m.stopGestures());
  }, [on]);

  return (
    <>
      {/* The video element is never shown or uploaded — it only feeds the on-device model. */}
      <video ref={video} className="hidden" playsInline muted aria-hidden="true" />
      {prompt && (
        <div role="dialog" aria-modal="false" aria-labelledby="gesture-title" className="glass fixed bottom-24 left-1/2 z-[72] w-[min(440px,calc(100vw-32px))] -translate-x-1/2 p-5">
          <p className="hud-label text-amber">Optional · camera</p>
          <p id="gesture-title" className="mt-1 font-display text-lg uppercase tracking-wide text-ink">
            Enable gesture control?
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            <li>Open palm = pause · swipe = next / previous section · pinch = open the focused card.</li>
            <li className="text-ink/90">Video is processed on this device and never leaves it. Nothing is recorded or uploaded.</li>
            <li>Downloads the MediaPipe hand model (~8 MB) the first time.</li>
          </ul>
          {status === "error" && <p className="mt-2 text-sm text-amber">Camera unavailable or permission denied.</p>}
          <div className="mt-4 flex gap-3">
            <button type="button" className="btn-energy amber" onClick={enable} disabled={status === "loading"}>
              {status === "loading" ? "Loading model…" : "Allow camera"}
            </button>
            <button type="button" className="btn-energy" onClick={() => set({ gesturePrompt: false })}>
              Not now
            </button>
          </div>
        </div>
      )}
      {on && (
        <div className="glass fixed bottom-24 left-4 z-[71] p-2 sm:left-8 md:bottom-12">
          <div className="flex items-center justify-between gap-3 px-1 pb-1">
            <span className="hud-label">Hands</span>
            <button type="button" className="font-mono text-[11px] text-muted hover:text-ink" onClick={() => set({ gestures: false })}>
              stop ✕
            </button>
          </div>
          <canvas ref={canvas} width={160} height={120} className="block rounded bg-void/70" aria-label="Hand skeleton preview" role="img" />
        </div>
      )}
    </>
  );
}

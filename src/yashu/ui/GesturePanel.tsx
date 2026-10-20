"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import type { GestureFrame, GestureName } from "../gestures";
import { useYashu } from "../store";

const LEGEND: [string, string][] = [
  ["☝️", "point to aim"],
  ["🤏", "pinch to click"],
  ["✊", "fist to scroll"],
  ["🖐", "hold to pause · swipe for sections"],
  ["👍", "hold to open"],
  ["✌️", "hold for the tour"],
];
const NAMES: Record<GestureName, string> = {
  none: "tracking",
  point: "☝️ aiming",
  pinch: "🤏 pinch",
  fist: "✊ grab · scrolling",
  palm: "🖐 open palm",
  thumbs: "👍 thumbs up",
  victory: "✌️ victory",
};

/** Consent dialog, live preview with skeleton, air cursor and feedback for gesture control. */
export function GesturePanel() {
  const { prompt, on, set } = useYashu(useShallow((s) => ({ prompt: s.gesturePrompt, on: s.gestures, set: s.set })));
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const edges = useRef<[number, number][]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [showCam, setShowCam] = useState(true);
  const [label, setLabel] = useState<GestureName>("none");
  const [hold, setHold] = useState(0);
  const [action, setAction] = useState<string | null>(null);
  const [seen, setSeen] = useState(false);

  const onFrame = useCallback((f: GestureFrame) => {
    // Cursor is moved directly (every frame) — no React render.
    const c = cursor.current;
    if (c) {
      c.style.opacity = f.cursor.visible ? "1" : "0";
      c.style.transform = `translate3d(${f.cursor.x}px, ${f.cursor.y}px, 0) translate(-50%, -50%) scale(${f.cursor.pressed ? 0.6 : 1})`;
      c.dataset.pressed = f.cursor.pressed ? "1" : "0";
    }
    const cv = canvas.current;
    const g = cv?.getContext("2d");
    if (cv && g) {
      g.clearRect(0, 0, cv.width, cv.height);
      if (f.landmarks) {
        const X = (p: { x: number }) => (1 - p.x) * cv.width;
        const Y = (p: { y: number }) => p.y * cv.height;
        g.strokeStyle = f.gesture === "pinch" || f.gesture === "fist" ? "#ffb547" : "#00e5ff";
        g.lineWidth = 2.5;
        for (const [a, b] of edges.current) {
          g.beginPath();
          g.moveTo(X(f.landmarks[a]), Y(f.landmarks[a]));
          g.lineTo(X(f.landmarks[b]), Y(f.landmarks[b]));
          g.stroke();
        }
        g.fillStyle = "#e6fdff";
        for (const p of f.landmarks) {
          g.beginPath();
          g.arc(X(p), Y(p), 2.5, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
    setSeen(!!f.landmarks);
    setLabel(f.gesture);
    setHold(f.hold);
    if (f.action) setAction(f.action);
  }, []);

  useEffect(() => {
    if (!action) return;
    const t = window.setTimeout(() => setAction(null), 1600);
    return () => clearTimeout(t);
  }, [action]);

  const enable = async () => {
    setStatus("loading");
    try {
      const mod = await import("../gestures");
      edges.current = mod.HAND_EDGES;
      set({ gestures: true, gesturePrompt: false });
      await mod.startGestures(video.current!, onFrame);
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

  const C = 2 * Math.PI * 16;

  return (
    <>
      {prompt && (
        <div role="dialog" aria-modal="false" aria-labelledby="gesture-title" className="glass fixed bottom-24 left-1/2 z-[72] w-[min(460px,calc(100vw-32px))] -translate-x-1/2 p-5">
          <p className="hud-label text-amber">Optional · camera</p>
          <p id="gesture-title" className="mt-1 font-display text-lg uppercase tracking-wide text-ink">
            Enable gesture control?
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted">
            {LEGEND.map(([e, t]) => (
              <li key={t}>
                <span aria-hidden="true">{e}</span> {t}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink/90">Video is processed on this device and never leaves it. Nothing is recorded or uploaded.</p>
          <p className="text-xs text-muted">Downloads the MediaPipe gesture model (~8 MB) the first time. Works best with your hand ~50 cm from the camera in good light.</p>
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

      {/* Air cursor */}
      <div
        ref={cursor}
        aria-hidden="true"
        className="air-cursor pointer-events-none fixed left-0 top-0 z-[97] h-9 w-9 rounded-full border-2 border-cyan opacity-0 shadow-[0_0_16px_#00e5ff] transition-[opacity,border-color] duration-150 data-[pressed=1]:border-amber data-[pressed=1]:bg-amber/30"
      />

      {/* Video stays local: it only feeds the on-device model and this preview. */}
      <div className={on ? "glass fixed bottom-24 left-4 z-[71] w-[212px] p-2 sm:left-8 md:bottom-12" : "hidden"}>
        <div className="flex items-center justify-between gap-2 px-1 pb-1">
          <span className="hud-label">Hands</span>
          <span className="flex gap-2">
            <button type="button" className="font-mono text-[11px] text-muted hover:text-ink" onClick={() => setShowCam((v) => !v)} aria-pressed={showCam}>
              cam
            </button>
            <button type="button" className="font-mono text-[11px] text-muted hover:text-ink" onClick={() => set({ gestures: false })}>
              stop ✕
            </button>
          </span>
        </div>
        <div className="relative h-[147px] w-[196px] overflow-hidden rounded bg-void/80">
          <video
            ref={video}
            playsInline
            muted
            aria-hidden="true"
            className={`absolute inset-0 h-full w-full -scale-x-100 object-cover transition-opacity ${showCam ? "opacity-45" : "opacity-0"}`}
          />
          <canvas ref={canvas} width={196} height={147} className="absolute inset-0" role="img" aria-label="Hand skeleton preview" />
          {hold > 0 && hold < 1 && (
            <svg viewBox="0 0 40 40" className="absolute right-2 top-2 h-10 w-10 -rotate-90" aria-hidden="true">
              <circle cx="20" cy="20" r="16" fill="none" stroke="rgb(255 181 71 / 0.25)" strokeWidth="3" />
              <circle cx="20" cy="20" r="16" fill="none" stroke="#ffb547" strokeWidth="3" strokeDasharray={C} strokeDashoffset={C * (1 - hold)} />
            </svg>
          )}
          {!seen && <p className="absolute inset-x-0 bottom-2 text-center font-mono text-[10px] text-muted">show your hand to the camera</p>}
        </div>
        <p className="mt-1.5 px-1 font-mono text-[11px] text-cyan" aria-live="polite">
          {action ? <span className="text-amber">› {action}</span> : NAMES[label]}
        </p>
      </div>
    </>
  );
}

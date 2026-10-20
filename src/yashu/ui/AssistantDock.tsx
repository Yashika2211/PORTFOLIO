"use client";

import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { assistant } from "@/data/portfolio";
import { runCommand } from "../commands";
import { micSupported, startListening, stopListening } from "../listen";
import { signals } from "../signals";
import { useYashu } from "../store";

/** Live waveform orb: voice bands when speaking, mic ripple when listening, flicker when thinking. */
function Orb() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const g = c.getContext("2d")!;
    const S = 64;
    c.width = c.height = S * 2;
    g.scale(2, 2);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const draw = (t: number) => {
      g.clearRect(0, 0, S, S);
      const cx = S / 2;
      const thinking = signals.thinking;
      const listening = signals.listening;
      const color = listening ? "255,181,71" : thinking ? "230,253,255" : "0,229,255";
      // Core glow
      const lvl = signals.speaking ? signals.voiceLevel : listening ? signals.micLevel : thinking ? 0.5 + Math.sin(t / 40) * 0.3 : 0.15 + Math.sin(t / 700) * 0.08;
      const grad = g.createRadialGradient(cx, cx, 1, cx, cx, 12 + lvl * 8);
      grad.addColorStop(0, `rgba(${color},0.95)`);
      grad.addColorStop(1, `rgba(${color},0)`);
      g.fillStyle = grad;
      g.beginPath();
      g.arc(cx, cx, 22, 0, Math.PI * 2);
      g.fill();
      // Radial bars
      const N = 32;
      g.strokeStyle = `rgba(${color},0.9)`;
      g.lineWidth = 1.6;
      g.lineCap = "round";
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2 + (thinking && !reduced ? t / 300 : 0);
        const band = signals.speaking ? signals.bands[i % 16] : listening ? signals.micLevel * (0.5 + 0.5 * Math.sin(i + t / 90)) : thinking ? 0.3 * (0.5 + 0.5 * Math.sin(i * 1.7 + t / 60)) : 0.04;
        const r0 = 20;
        const r1 = r0 + 2 + band * 9;
        g.beginPath();
        g.moveTo(cx + Math.cos(a) * r0, cx + Math.sin(a) * r0);
        g.lineTo(cx + Math.cos(a) * r1, cx + Math.sin(a) * r1);
        g.stroke();
      }
      // Outer ring
      g.strokeStyle = `rgba(${color},0.35)`;
      g.setLineDash([3, 3]);
      g.beginPath();
      g.arc(cx, cx, 30, reduced ? 0 : t / 2000, (reduced ? 0 : t / 2000) + Math.PI * 2);
      g.stroke();
      g.setLineDash([]);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="h-16 w-16" aria-hidden="true" />;
}

const LABEL = { idle: "online", thinking: "processing", speaking: "speaking" } as const;

/** Persistent assistant presence: state, reasoning steps, one-tap mic and the command bar. */
export function AssistantDock() {
  const { mode, steps, listening, followUp, setCommandOpen } = useYashu(
    useShallow((s) => ({ mode: s.mode, steps: s.steps, listening: s.listening, followUp: s.followUp, setCommandOpen: s.setCommandOpen })),
  );
  const [micOk, setMicOk] = useState(false);
  useEffect(() => setMicOk(micSupported()), []);
  const state = mode !== "idle" ? LABEL[mode] : followUp ? "go ahead" : listening ? "listening" : LABEL.idle;

  return (
    <div className="fixed bottom-4 right-4 z-[66] flex items-end gap-2 md:bottom-10 md:right-8">
      {steps.length > 0 && (
        <ol className="glass mb-2 hidden max-w-[240px] px-3 py-2 font-mono text-[11px] text-cyan sm:block" aria-hidden="true">
          {steps.map((s, i) => (
            <li key={s} className="holo-row">
              <span className="text-muted">{i === steps.length - 1 ? "›" : "✓"}</span> {s}
              {i === steps.length - 1 && "…"}
            </li>
          ))}
        </ol>
      )}
      <div className="flex flex-col items-end gap-1.5">
        {micOk && (
          <button
            type="button"
            onClick={() => (listening ? stopListening() : startListening("once", (t) => void runCommand(t, "voice")))}
            aria-pressed={listening}
            aria-label={listening ? "Stop listening" : `Speak to ${assistant.name}`}
            className={`flex h-9 w-9 items-center justify-center self-center rounded-full border backdrop-blur transition ${
              listening ? "border-amber bg-amber/20 text-amber" : "border-cyan/40 bg-void/70 text-cyan hover:bg-cyan/10"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
          </button>
        )}
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="group relative rounded-full border border-cyan/50 bg-void/80 shadow-[0_0_24px_rgba(0,229,255,0.3)] backdrop-blur transition hover:scale-105"
          aria-label={`Talk to ${assistant.name}`}
          aria-haspopup="dialog"
        >
          <Orb />
          <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted">
            <span className={state === "online" ? "text-mint" : "text-amber"}>●</span> {state}
          </span>
        </button>
      </div>
      <span className="sr-only" role="status">
        {assistant.name} is {state}
      </span>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { playShimmer, playWhoosh } from "@/lib/sound";
import { useYashu } from "../store";
import { speakLine } from "../voice";

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

/** Konami code → Protocol: Overdrive. `sudo hire yashika` → celebration (triggered via the store). */
export function EasterEggs() {
  const celebrate = useYashu((s) => s.celebrate);
  const overdrive = useYashu((s) => s.overdrive);
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    let i = 0;
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      i = key === KONAMI[i] ? i + 1 : key === KONAMI[0] ? 1 : 0;
      if (i < KONAMI.length) return;
      i = 0;
      const s = useYashu.getState();
      const on = !s.overdrive;
      s.set({ overdrive: on });
      if (on) {
        s.unlock("overdrive", "Overdrive", "Found the Konami code.");
        playWhoosh();
        void speakLine("Protocol: Overdrive. All limiters disengaged.");
      } else void speakLine("Overdrive disengaged. Back to nominal.");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.documentElement.toggleAttribute("data-overdrive", overdrive);
  }, [overdrive]);

  useEffect(() => {
    if (!celebrate) return;
    setBurst(celebrate);
    playShimmer();
    const t = window.setTimeout(() => setBurst(0), 1900);
    return () => clearTimeout(t);
  }, [celebrate]);

  if (!burst) return null;
  return <Celebration key={burst} />;
}

function Celebration() {
  const [bits] = useState(() =>
    Array.from({ length: 90 }, (_, i) => {
      const a = Math.random() * Math.PI * 2;
      const d = 180 + Math.random() * 420;
      return { x: Math.cos(a) * d, y: Math.sin(a) * d, c: i % 3 ? "#00e5ff" : "#ffb547", s: 3 + Math.random() * 5, r: Math.random() * 720 };
    }),
  );
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[91] flex items-center justify-center">
      {bits.map((b, i) => (
        <span
          key={i}
          className="celebrate-bit absolute rounded-sm"
          style={{ width: b.s, height: b.s * 2, background: b.c, "--x": `${b.x}px`, "--y": `${b.y}px`, "--r": `${b.r}deg` } as React.CSSProperties}
        />
      ))}
      <p className="celebrate-text font-display text-4xl font-black uppercase tracking-[0.2em] text-amber sm:text-6xl">Access granted</p>
    </div>
  );
}

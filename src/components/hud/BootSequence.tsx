"use client";

import { useCallback, useEffect, useState } from "react";
import { assistant } from "@/data/portfolio";
import { BOOT_KEY } from "@/lib/boot";
import { playSound } from "@/lib/sound";

const LINE_MS = 430;

export function BootSequence({ onDone }: { onDone?: (played: boolean) => void }) {
  const [visible, setVisible] = useState(true);
  const [lines, setLines] = useState(0);
  const [leaving, setLeaving] = useState(false);

  const finish = useCallback(() => {
    try {
      localStorage.setItem(BOOT_KEY, "1");
    } catch {
      /* ignore */
    }
    setLeaving(true);
    window.setTimeout(() => {
      document.documentElement.classList.add("booted");
      setVisible(false);
      onDone?.(true);
    }, 450);
  }, [onDone]);

  useEffect(() => {
    if (document.documentElement.classList.contains("booted")) {
      setVisible(false);
      onDone?.(false);
      return;
    }
    playSound("boot");
    const timers = assistant.bootLines.map((_, i) => window.setTimeout(() => setLines(i + 1), 500 + i * LINE_MS));
    timers.push(window.setTimeout(finish, 500 + assistant.bootLines.length * LINE_MS + 450));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("keydown", onKey);
    };
  }, [finish, onDone]);

  if (!visible) return null;

  return (
    <div
      className={`boot-overlay fixed inset-0 z-[90] flex items-center justify-center bg-void transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
      role="status"
      aria-live="polite"
      aria-label="Loading portfolio"
    >
      <div className="boot-scan pointer-events-none absolute inset-x-0 h-px bg-cyan shadow-[0_0_24px_4px_rgba(0,229,255,0.6)]" />
      <div className="w-[min(560px,calc(100vw-32px))] font-mono text-sm text-cyan sm:text-base">
        <p className="hud-label mb-4 text-amber">{assistant.name} · boot</p>
        {assistant.bootLines.slice(0, lines).map((l, i) => (
          <p key={l} className="boot-line leading-7">
            <span className="text-muted">{String(i).padStart(2, "0")} &gt;</span> {l}
          </p>
        ))}
        <span className="pulse-dot inline-block h-4 w-2 translate-y-0.5 bg-cyan" aria-hidden="true" />
      </div>
      <button
        type="button"
        onClick={finish}
        className="btn-energy absolute bottom-8 right-4 sm:right-8"
        aria-label="Skip intro"
      >
        Skip intro →
      </button>
    </div>
  );
}

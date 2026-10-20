"use client";

import { useEffect } from "react";
import { projects, sections } from "@/data/portfolio";
import { useYashu } from "./store";
import { speakLine } from "./voice";

const GAP_MS = 25_000;
const MAX_PER_VISIT = 6;

let lastAt = 0;
let count = 0;
const fired = new Set<string>();

/** Say something unprompted — only within the budget and never over the visitor. */
function remark(key: string, line: string, extra?: () => void) {
  const s = useYashu.getState();
  const now = Date.now();
  if (fired.has(key) || count >= MAX_PER_VISIT || now - lastAt < GAP_MS) return;
  if (s.tour.active || s.commandOpen || s.stealth || s.mode !== "idle" || s.listening) return;
  fired.add(key);
  lastAt = now;
  count++;
  extra?.();
  void speakLine(line);
}

/** Proactive, rate-limited situational awareness: dwell, skim, resume, tab return, first briefing. */
export function Awareness({ ready }: { ready: boolean }) {
  useEffect(() => {
    if (!ready) return;
    lastAt = Date.now(); // don't talk right after the greeting
    const timers: number[] = [];

    // Dwell on a case file (hover or keyboard focus) for 6 seconds.
    let dwell = 0;
    const onOver = (e: Event) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>("[data-case]");
      clearTimeout(dwell);
      if (!card) return;
      const p = projects.find((x) => x.slug === card.dataset.case);
      if (!p) return;
      dwell = window.setTimeout(
        () =>
          remark(`dwell:${p.slug}`, `${p.title} caught your eye. Say "tell me more" — or ask for the numbers.`, () =>
            useYashu.getState().set({ focus: p.slug }),
          ),
        6000,
      );
    };
    const onOut = (e: Event) => {
      if (!(e.target as HTMLElement).closest("[data-case]")) clearTimeout(dwell);
    };

    // Resume button hover for 1.2 seconds.
    let resume = 0;
    const onResumeOver = (e: Event) => {
      const a = (e.target as HTMLElement).closest('a[download]');
      clearTimeout(resume);
      if (a) resume = window.setTimeout(() => remark("resume", "One page, no filler. Good call."), 1200);
    };

    // Fast skimming: sustained high scroll velocity.
    let lastY = window.scrollY;
    let lastT = performance.now();
    let fastSince = 0;
    const onScroll = () => {
      const now = performance.now();
      const v = Math.abs(window.scrollY - lastY) / Math.max(1, now - lastT); // px/ms
      lastY = window.scrollY;
      lastT = now;
      if (v > 3) {
        fastSince ||= now;
        if (now - fastSince > 900)
          remark("skim", "Skimming? Here's the ten-second version.", () => useYashu.getState().showCard({ kind: "briefing" }));
      } else fastSince = 0;
    };

    // Coming back to the tab after a while.
    let hiddenAt = 0;
    const onVis = () => {
      if (document.visibilityState === "hidden") hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > 20_000) {
        const label = sections.find((x) => x.id === useYashu.getState().currentSection)?.label ?? "the core";
        fired.delete("return");
        remark("return", `Welcome back. We were at ${label}.`);
      }
    };

    // First briefing opened.
    const unsub = useYashu.subscribe((s, prev) => {
      if (s.openProject && !prev.openProject) {
        timers.push(
          window.setTimeout(() => remark("briefingTip", 'While you\'re in here, ask me "what\'s the stack", "the numbers" or "next one".'), 3500),
        );
      }
    });

    document.addEventListener("pointerover", onOver);
    document.addEventListener("focusin", onOver);
    document.addEventListener("pointerout", onOut);
    document.addEventListener("pointerover", onResumeOver);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearTimeout(dwell);
      clearTimeout(resume);
      timers.forEach(clearTimeout);
      unsub();
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("focusin", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("pointerover", onResumeOver);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ready]);

  return null;
}

"use client";

import { projects, sections } from "@/data/portfolio";
import { scrollToElement, scrollToSection } from "@/components/providers/SmoothScroll";
import { narration } from "./lines";
import { useYashu } from "./store";
import { speakLine, stopSpeaking } from "./voice";

type Stop = { target: () => HTMLElement | null; line: string; ms: number };

function buildStops(): Stop[] {
  const stops: Stop[] = [];
  for (const s of sections) {
    stops.push({ target: () => document.getElementById(s.id), line: narration[s.id], ms: 5200 });
    if (s.id === "projects") {
      for (const p of projects) {
        const m = p.metrics[0];
        stops.push({
          target: () => document.querySelector(`[data-case="${p.slug}"]`),
          line: `${p.title}: ${m.value} — ${m.label}.`,
          ms: 6200,
        });
      }
    }
  }
  stops.push({ target: () => document.getElementById("contact"), line: "That's the tour. Control returned to you.", ms: 3000 });
  return stops;
}

let timer = 0;
let cleanup: (() => void) | null = null;

export function stopTour(reason: "done" | "interrupted" = "interrupted") {
  window.clearTimeout(timer);
  cleanup?.();
  cleanup = null;
  const s = useYashu.getState();
  if (!s.tour.active) return;
  s.set({ tour: { ...s.tour, active: false } });
  if (reason === "interrupted") {
    stopSpeaking();
    s.say("Tour paused. You have the controls.");
  } else {
    s.unlock("tourist", "Tourist", "Completed the guided tour.");
  }
}

/** Auto-piloted narrated run through every section; any input hands control back. */
export function startTour() {
  if (useYashu.getState().tour.active) return;
  const stops = buildStops();
  const s = useYashu.getState();
  s.set({ tour: { active: true, step: 0, total: stops.length } });

  // Ignore the input events our own scrolling generates for a moment after each move.
  let armedAt = Date.now() + 800;
  const interrupt = (e: Event) => {
    if (Date.now() < armedAt) return;
    if (e instanceof KeyboardEvent && ["Shift", "Meta", "Control", "Alt"].includes(e.key)) return;
    stopTour("interrupted");
  };
  const opts = { passive: true } as const;
  window.addEventListener("wheel", interrupt, opts);
  window.addEventListener("touchstart", interrupt, opts);
  window.addEventListener("keydown", interrupt);
  window.addEventListener("pointerdown", interrupt, opts);
  cleanup = () => {
    window.removeEventListener("wheel", interrupt);
    window.removeEventListener("touchstart", interrupt);
    window.removeEventListener("keydown", interrupt);
    window.removeEventListener("pointerdown", interrupt);
  };

  const go = (i: number) => {
    if (!useYashu.getState().tour.active) return;
    if (i >= stops.length) return stopTour("done");
    useYashu.getState().set({ tour: { active: true, step: i + 1, total: stops.length } });
    const el = stops[i].target();
    armedAt = Date.now() + 1800;
    if (el) {
      if (el.id) scrollToSection(el.id);
      else scrollToElement(el);
    }
    void speakLine(stops[i].line);
    timer = window.setTimeout(() => go(i + 1), stops[i].ms);
  };
  go(0);
}

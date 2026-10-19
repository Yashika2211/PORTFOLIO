"use client";

import { useEffect, useRef } from "react";
import { sections } from "@/data/portfolio";
import { ACHIEVEMENTS, SECRET } from "./achievements";
import { greeting, idleNudges, narration, returningGreeting } from "./lines";
import { useYashu } from "./store";
import type { SectionId } from "./types";
import { speakLine } from "./voice";

const IDLE_MS = 20_000;

/** Y.A.S.H.U.'s behaviour loop: greetings, idle nudges, narration and achievements. */
export function Director({ ready }: { ready: boolean }) {
  const hydrated = useYashu((s) => s.hydrated);
  const greeted = useRef(false);

  // Greeting (first-time visitors are greeted by the voice prompt instead).
  useEffect(() => {
    if (!ready || !hydrated || greeted.current) return;
    greeted.current = true;
    const s = useYashu.getState();
    if (s.voice !== null) {
      const line = s.lastVisit ? returningGreeting(s.lastProject) : greeting();
      window.setTimeout(() => void speakLine(line), 900);
    }
    s.set({ lastVisit: Date.now() });
    const h = new Date().getHours();
    if (h >= 0 && h < 5) s.unlock("nightOwl", "Night owl", "Visited after midnight.");
  }, [ready, hydrated]);

  // Idle nudges.
  useEffect(() => {
    if (!ready) return;
    let timer = 0;
    let count = 0;
    const arm = () => {
      window.clearTimeout(timer);
      if (count >= 3) return;
      timer = window.setTimeout(() => {
        const s = useYashu.getState();
        if (s.tour.active || s.openProject || s.commandOpen) return arm();
        void speakLine(idleNudges[count % idleNudges.length]);
        count++;
        arm();
      }, IDLE_MS + count * 25_000);
    };
    const events = ["pointermove", "keydown", "wheel", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, arm, { passive: true }));
    arm();
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, arm));
    };
  }, [ready]);

  // Section tracking + first-view narration.
  useEffect(() => {
    if (!ready) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const id = e.target.id as SectionId;
          const s = useYashu.getState();
          s.enterSection(id);
          if (!s.narrated.includes(id) && id !== "hero") {
            s.markNarrated(id);
            if (s.voice === true && !s.tour.active) void speakLine(narration[id]);
          }
        }
      },
      { threshold: 0.35 },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [ready]);

  // Achievement rules derived from state.
  useEffect(
    () =>
      useYashu.subscribe((s) => {
        if (s.visited.length >= sections.length) s.unlock("explorer", "Explorer", "Visited every section.");
        if (s.opened.length >= 3) s.unlock("deepDiver", "Deep diver", "Opened 3 case files.");
        if (ACHIEVEMENTS.every((a) => s.achievements.includes(a.id))) s.unlock(SECRET.id, SECRET.title, SECRET.body);
      }),
    [],
  );

  return null;
}

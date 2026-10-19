"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import { playShimmer, playWhoosh } from "@/lib/sound";
import { scrollToSection } from "@/components/providers/SmoothScroll";
import { signals } from "../signals";
import { useYashu } from "../store";

gsap.registerPlugin(ScrollTrigger);

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const GLYPHS = "01アイウエオカキクケコサシスセソ<>/{}[]#$%=+ABCDEF";

function glyphColumn(len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += GLYPHS[(Math.random() * GLYPHS.length) | 0] + "\n";
  return s;
}

/**
 * Scene-change choreography:
 *  - warp jump on command navigation (WebGL streaks + DOM streak overlay), skippable
 *  - data-stream wipe between About and Skills
 *  - glitch cut on returning to the hero
 *  - hologram materialize on glass panels
 * Every one degrades to a 200ms fade under prefers-reduced-motion.
 */
export function Transitions() {
  const [fade, setFade] = useState(false);
  const [wipe, setWipe] = useState(0);
  const [warpOn, setWarpOn] = useState(false);
  const streaks = useRef<HTMLDivElement>(null);

  // ---------- Warp jump ----------
  useEffect(() => {
    let tl: gsap.core.Timeline | null = null;
    let skip: ((e: Event) => void) | null = null;
    const end = () => {
      if (skip) {
        window.removeEventListener("keydown", skip);
        window.removeEventListener("pointerdown", skip);
        skip = null;
      }
      setWarpOn(false);
    };
    const unsub = useYashu.subscribe((s, prev) => {
      if (!s.warp || s.warp === prev.warp) return;
      const target = s.warp.target;
      tl?.kill();
      end();
      if (reduced() || !s.gl3d) {
        setFade(true);
        window.setTimeout(() => {
          scrollToSection(target, { immediate: true });
          setFade(false);
        }, 200);
        return;
      }
      playWhoosh();
      setWarpOn(true);
      const state = { w: signals.warp };
      tl = gsap
        .timeline({ onComplete: end })
        .to(state, { w: 1, duration: 0.42, ease: "power2.in", onUpdate: () => void (signals.warp = state.w) })
        .add(() => scrollToSection(target, { duration: 0.45 }))
        .to(state, { w: 0, duration: 0.75, ease: "power3.out", onUpdate: () => void (signals.warp = state.w) }, "+=0.05");
      // Any key or click skips straight to the destination.
      skip = () => {
        tl?.kill();
        signals.warp = 0;
        scrollToSection(target, { immediate: true });
        end();
      };
      window.setTimeout(() => {
        if (!skip) return;
        window.addEventListener("keydown", skip, { once: true });
        window.addEventListener("pointerdown", skip, { once: true });
      }, 60);
    });
    return () => {
      unsub();
      tl?.kill();
      end();
    };
  }, []);

  // Drive the DOM streak overlay from the shared warp signal.
  useEffect(() => {
    if (!warpOn) return;
    let raf = 0;
    const tick = () => {
      if (streaks.current) streaks.current.style.opacity = String(signals.warp * 0.9);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (streaks.current) streaks.current.style.opacity = "0";
    };
  }, [warpOn]);

  // ---------- Data-stream wipe (About → Skills) ----------
  useEffect(() => {
    if (reduced()) return;
    let last = 0;
    const st = ScrollTrigger.create({
      trigger: "#skills",
      start: "top 75%",
      onEnter: () => {
        if (Date.now() - last < 4000 || signals.warp > 0) return;
        last = Date.now();
        setWipe((n) => n + 1);
      },
      onLeaveBack: () => {
        if (Date.now() - last < 4000) return;
        last = Date.now();
        setWipe((n) => n + 1);
      },
    });
    return () => st.kill();
  }, []);

  // ---------- Glitch cut on returning to the hero ----------
  useEffect(
    () =>
      useYashu.subscribe((s, prev) => {
        if (s.currentSection !== "hero" || prev.currentSection === "hero" || reduced()) return;
        signals.glitch = 1;
        const title = document.getElementById("hero-title");
        title?.classList.add("is-glitching", "glitch-cut");
        window.setTimeout(() => title?.classList.remove("is-glitching", "glitch-cut"), 450);
      }),
    [],
  );

  // ---------- Hologram materialize ----------
  useEffect(() => {
    const panels = Array.from(document.querySelectorAll<HTMLElement>("main section:not(#hero) .glass"));
    panels.forEach((p) => p.setAttribute("data-mat", "out"));
    let lastShimmer = 0;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).setAttribute("data-mat", "in");
          io.unobserve(e.target);
          if (Date.now() - lastShimmer > 600) {
            lastShimmer = Date.now();
            playShimmer();
          }
        }
      },
      { threshold: 0.15 },
    );
    panels.forEach((p) => io.observe(p));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-[88] bg-void transition-opacity duration-200 ${fade ? "opacity-100" : "opacity-0"}`}
      />
      <div ref={streaks} aria-hidden="true" className="warp-streaks pointer-events-none fixed inset-0 z-[87] opacity-0" />
      {wipe > 0 && <DataStream key={wipe} />}
    </>
  );
}

function DataStream() {
  const [cols] = useState(() => Array.from({ length: 28 }, () => ({ text: glyphColumn(40), delay: Math.random() * 0.25 })));
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setDone(true), 1300);
    return () => clearTimeout(t);
  }, []);
  if (done) return null;
  return (
    <div aria-hidden="true" className="data-stream pointer-events-none fixed inset-0 z-[86] flex justify-between overflow-hidden">
      {cols.map((c, i) => (
        <pre key={i} className="data-col font-mono text-[13px] leading-[15px] text-cyan" style={{ animationDelay: `${c.delay}s` }}>
          {c.text}
        </pre>
      ))}
    </div>
  );
}

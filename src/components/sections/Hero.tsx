"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import { assistant, profile } from "@/data/portfolio";
import { canRender3D, useCapabilities } from "@/lib/capabilities";
import { ScrambleText } from "@/components/hud/ScrambleText";
import { StaticCore } from "@/components/fallback/StaticCore";
import { useHud } from "@/components/providers/HudProvider";
import { scrollToSection } from "@/components/providers/SmoothScroll";

const CoreCanvas = dynamic(() => import("@/components/three/CoreCanvas"), {
  ssr: false,
  loading: () => <StaticCore />,
});

/** Staggered HUD entrance delay; the animation lives in .hud-in (globals.css). */
const d = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

export function Hero({ ready }: { ready: boolean }) {
  const caps = useCapabilities();
  const { setCommandOpen } = useHud();
  const use3D = canRender3D(caps) && !caps.reducedMotion;

  return (
    <section id="hero" aria-labelledby="hero-title" className="relative flex min-h-[100svh] items-center overflow-hidden pt-24">
      <div className="pointer-events-none absolute inset-0 md:left-[30%]">
        {ready && use3D ? <CoreCanvas mobile={caps.mobile} /> : <StaticCore />}
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-8">
        <div className="max-w-2xl" data-play={ready}>
          <p className="hud-in hud-label flicker mb-5 flex items-center gap-2" style={d(0.1)}>
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-amber" aria-hidden="true" />
            {assistant.name} {"//"} {assistant.expansion}
          </p>

          <h1
            id="hero-title"
            className="hud-in font-display text-[2.6rem] font-black uppercase leading-[0.95] tracking-wide text-ink text-glow sm:text-7xl lg:text-8xl"
            style={d(0.2)}
          >
            <ScrambleText key={String(ready)} text={profile.name} duration={1400} delay={250} />
          </h1>

          <p className="hud-in mt-6 max-w-xl text-lg text-ink/90 sm:text-xl" style={d(0.45)}>
            {profile.headline}
          </p>
          <p className="hud-in mt-3 font-mono text-base text-amber" style={d(0.55)}>
            &gt; {profile.tagline}
          </p>

          <div className="hud-in mt-10 flex flex-wrap gap-3" style={d(0.7)}>
            <button type="button" className="btn-energy" onClick={() => scrollToSection("projects")}>
              View case files
            </button>
            <a className="btn-energy amber" href={profile.resume} download>
              Download resume
            </a>
            <button type="button" className="btn-energy" onClick={() => setCommandOpen(true)}>
              Talk to {assistant.name}
            </button>
          </div>

          <dl className="hud-in mt-12 grid max-w-lg grid-cols-3 gap-3 font-mono text-xs" style={d(0.85)}>
            {[
              ["LOC", profile.location],
              ["EDU", "SRM AP · CSE (DS)"],
              ["CGPA", profile.education.cgpa],
            ].map(([k, v]) => (
              <div key={k} className="glass px-3 py-2">
                <dt className="text-cyan">{k}</dt>
                <dd className="mt-0.5 text-ink/90">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-16 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
        aria-hidden="true"
      >
        <span className="hud-label text-muted">scroll</span>
        <span className="h-10 w-px bg-gradient-to-b from-cyan to-transparent" />
      </div>
    </section>
  );
}

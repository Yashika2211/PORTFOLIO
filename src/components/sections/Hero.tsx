"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
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

const panel = (delay: number) => ({
  initial: { opacity: 0, y: 18, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { delay, duration: 0.7, ease: [0.2, 0.7, 0.2, 1] as const },
});

export function Hero({ ready }: { ready: boolean }) {
  const caps = useCapabilities();
  const { setCommandOpen } = useHud();
  const use3D = canRender3D(caps) && !caps.reducedMotion;

  return (
    <section id="hero" aria-labelledby="hero-title" className="relative flex min-h-[100svh] items-center overflow-hidden pt-24">
      <div className="pointer-events-none absolute inset-0 md:left-[30%]">{ready && use3D ? <CoreCanvas mobile={caps.mobile} /> : <StaticCore />}</div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-8">
        {ready && (
          <div className="max-w-2xl">
            <motion.p {...panel(0.1)} className="hud-label flicker mb-5 flex items-center gap-2">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-amber" aria-hidden="true" />
              {assistant.name} // {assistant.expansion}
            </motion.p>

            <motion.h1
              {...panel(0.2)}
              id="hero-title"
              className="font-display text-5xl font-black uppercase leading-[0.95] tracking-wide text-ink text-glow sm:text-7xl lg:text-8xl"
            >
              <ScrambleText text={profile.name} duration={1400} delay={250} />
            </motion.h1>

            <motion.p {...panel(0.45)} className="mt-6 max-w-xl text-lg text-ink/90 sm:text-xl">
              {profile.headline}
            </motion.p>
            <motion.p {...panel(0.55)} className="mt-3 font-mono text-base text-amber">
              &gt; {profile.tagline}
            </motion.p>

            <motion.div {...panel(0.7)} className="mt-10 flex flex-wrap gap-3">
              <button type="button" className="btn-energy" onClick={() => scrollToSection("projects")}>
                View case files
              </button>
              <a className="btn-energy amber" href={profile.resume} download>
                Download resume
              </a>
              <button type="button" className="btn-energy" onClick={() => setCommandOpen(true)}>
                Talk to {assistant.name}
              </button>
            </motion.div>

            <motion.dl {...panel(0.85)} className="mt-12 grid max-w-lg grid-cols-3 gap-3 font-mono text-xs">
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
            </motion.dl>
          </div>
        )}
        {!ready && <h1 className="sr-only">{profile.name}</h1>}
      </div>

      <div className="pointer-events-none absolute bottom-16 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex" aria-hidden="true">
        <span className="hud-label text-muted">scroll</span>
        <span className="h-10 w-px bg-gradient-to-b from-cyan to-transparent" />
      </div>
    </section>
  );
}

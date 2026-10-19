"use client";

import { useEffect, useState } from "react";
import { useInView } from "@/lib/useInView";
import { ScrambleText } from "./ScrambleText";

type Props = { index: string; kicker: string; title: string; id: string; children?: React.ReactNode };

/** Section title with HUD index, scramble decode and a one-shot glitch on entry. */
export function SectionHeading({ index, kicker, title, id, children }: Props) {
  const [ref, inView] = useInView<HTMLDivElement>(0.6);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    if (!inView || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setGlitch(true);
    const t = window.setTimeout(() => setGlitch(false), 400);
    return () => clearTimeout(t);
  }, [inView]);

  return (
    <div ref={ref} className="mb-12 max-w-3xl">
      <p className="hud-label mb-3 flex items-center gap-3">
        <span className="text-amber">{index}</span>
        <span className="h-px w-10 bg-cyan/50" aria-hidden="true" />
        {kicker}
      </p>
      <h2
        id={id}
        className={`glitch font-display text-3xl font-bold uppercase tracking-wide text-ink sm:text-5xl ${glitch ? "is-glitching" : ""}`}
      >
        <ScrambleText text={title} onView duration={900} />
      </h2>
      {children && <div className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{children}</div>}
    </div>
  );
}

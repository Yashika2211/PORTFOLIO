"use client";

import { useState } from "react";
import { profile, stats, type Stat } from "@/data/portfolio";
import { useCountUp, useInView } from "@/lib/useInView";
import { SectionHeading } from "@/components/hud/SectionHeading";

const R = 42;
const C = 2 * Math.PI * R;

function Gauge({ stat, start }: { stat: Stat; start: boolean }) {
  const n = useCountUp(stat.value, start);
  // Ring fill is decorative except for the F0.5 score, which is a true 0–1 ratio.
  const ratio = stat.value <= 1 ? stat.value : 1;
  const progress = stat.value === 0 ? 0 : (n / stat.value) * ratio;
  const shown = stat.decimals ? n.toFixed(stat.decimals) : Math.round(n).toString();

  return (
    <li className="glass flex flex-col items-center p-4 text-center">
      <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={R} fill="none" stroke="rgb(0 229 255 / 0.12)" strokeWidth="6" />
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke="#00e5ff"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - progress)}
          style={{ filter: "drop-shadow(0 0 4px #00e5ff)" }}
        />
        <circle cx="50" cy="50" r="33" fill="none" stroke="#ffb547" strokeOpacity="0.4" strokeDasharray="1 4" />
      </svg>
      <p className="-mt-[66px] mb-9 font-display text-lg font-bold tabular-nums text-ink" aria-hidden="true">
        {stat.prefix}
        {shown}
        {stat.suffix}
      </p>
      <p className="text-sm leading-snug text-muted">
        <span className="sr-only">
          {stat.prefix}
          {stat.decimals ? stat.value.toFixed(stat.decimals) : stat.value}
          {stat.suffix}{" "}
        </span>
        {stat.label}
      </p>
    </li>
  );
}

function IdCard() {
  const [ref, inView] = useInView<HTMLDivElement>(0.4);
  const [flipped, setFlipped] = useState(false);
  // Card starts showing its back and flips to the front on entry.
  const showBack = !inView || flipped;

  return (
    <div ref={ref} className="[perspective:1400px]">
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-label={showBack ? "Show ID card front" : "Show ID card back (education and links)"}
        className="relative block aspect-[1.58/1] w-full max-w-md text-left transition-transform duration-[1100ms] [transform-style:preserve-3d] [transition-timing-function:cubic-bezier(0.2,0.7,0.2,1)]"
        style={{ transform: showBack ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        {/* Front */}
        <div className="glass scan-hover absolute inset-0 flex flex-col justify-between p-5 [backface-visibility:hidden] sm:p-6" aria-hidden={showBack}>
          <div className="flex items-start justify-between">
            <span className="hud-label">ID // YB-2027</span>
            <span className="font-mono text-[10px] text-mint">● VERIFIED</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-cyan/60 font-display text-xl font-black text-cyan text-glow sm:h-20 sm:w-20 sm:text-2xl">
              YB
              <span className="absolute inset-[-6px] rounded-full border border-dashed border-amber/40" aria-hidden="true" />
            </div>
            <div>
              <p className="font-display text-lg font-bold uppercase tracking-wide text-ink sm:text-2xl">{profile.name}</p>
              <p className="mt-1 text-xs text-muted sm:text-sm">{profile.headline}</p>
            </div>
          </div>
          <div className="flex items-end justify-between font-mono text-[11px] text-muted">
            <span>{profile.location}</span>
            <span className="text-amber">tap to flip ↻</span>
          </div>
        </div>

        {/* Back */}
        <div
          className="glass absolute inset-0 flex flex-col justify-between p-5 [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-6"
          aria-hidden={!showBack}
        >
          <span className="hud-label">Education</span>
          <div>
            <p className="font-display text-base font-bold text-ink sm:text-lg">{profile.education.degree}</p>
            <p className="text-sm text-muted">{profile.education.school}</p>
            <p className="mt-1 font-mono text-xs text-muted">{profile.education.period}</p>
          </div>
          <p className="font-mono text-sm">
            <span className="text-cyan">CGPA</span> <span className="text-ink">{profile.education.cgpa}</span>
          </p>
        </div>
      </button>
    </div>
  );
}

export function About() {
  const [ref, inView] = useInView<HTMLUListElement>(0.25);
  return (
    <section id="about" aria-labelledby="about-title" className="relative mx-auto max-w-7xl px-4 py-28 sm:px-8">
      <SectionHeading id="about-title" index="01" kicker="Operator profile" title="About">
        I build ML systems, AI agents and backends that ship — and I test them until the numbers hold. Currently a
        B.Tech CSE (Data Science) student at SRM University AP, freelancing on web, e-commerce and backend work.
      </SectionHeading>

      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,28rem)_1fr]">
        <IdCard />
        <ul ref={ref} className="grid grid-cols-2 gap-4 sm:grid-cols-3" aria-label="Key stats">
          {stats.map((s) => (
            <Gauge key={s.id} stat={s} start={inView} />
          ))}
        </ul>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { achievements, type Achievement } from "@/data/portfolio";
import { useInView } from "@/lib/useInView";
import { playSound } from "@/lib/sound";
import { SectionHeading } from "@/components/hud/SectionHeading";

const ICONS: Record<Achievement["icon"], React.ReactNode> = {
  trophy: <path d="M8 4h8v4a4 4 0 0 1-8 0V4Zm0 1H5a3 3 0 0 0 3 4m8-4h3a3 3 0 0 1-3 4m-4 3v4m-3 3h6m-5 0 1-3h2l1 3" />,
  flag: <path d="M6 21V4m0 0h10l-2 3.5L16 11H6" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </>
  ),
  code: <path d="m9 7-5 5 5 5m6-10 5 5-5 5m-2-12-2 14" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
};

const HEX = "50,3 93,27 93,73 50,97 7,73 7,27";

export function Achievements() {
  const [ref, inView] = useInView<HTMLUListElement>(0.3);
  const [unlocked, setUnlocked] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setUnlocked(achievements.length);
      return;
    }
    const timers = achievements.map((_, i) =>
      window.setTimeout(() => {
        setUnlocked(i + 1);
        playSound("click");
      }, 250 + i * 260),
    );
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  return (
    <section id="achievements" aria-labelledby="achievements-title" className="relative mx-auto max-w-7xl px-4 py-28 sm:px-8">
      <SectionHeading id="achievements-title" index="05" kicker="Unlocked" title="Achievements">
        <span className="font-mono text-sm text-cyan" aria-live="polite">
          {unlocked}/{achievements.length} badges unlocked
        </span>
      </SectionHeading>

      <ul ref={ref} className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
        {achievements.map((a, i) => {
          const on = i < unlocked;
          return (
            <li key={a.id} className="flex flex-col items-center text-center">
              <div
                className={`relative h-28 w-28 transition-all duration-700 ${
                  on ? "scale-100 opacity-100" : "scale-90 opacity-35 grayscale"
                }`}
              >
                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
                  <polygon points={HEX} fill={on ? "rgb(255 181 71 / 0.08)" : "rgb(159 179 194 / 0.05)"} stroke={on ? "#ffb547" : "#9fb3c2"} strokeWidth="1.5" />
                  <polygon points={HEX} fill="none" stroke="#00e5ff" strokeOpacity={on ? 0.5 : 0.15} strokeWidth="0.6" transform="translate(50 50) scale(0.82) translate(-50 -50)" />
                </svg>
                <svg
                  viewBox="0 0 24 24"
                  className={`absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 ${on ? "text-amber drop-shadow-[0_0_8px_#ffb547]" : "text-muted"}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {ICONS[a.icon]}
                </svg>
              </div>
              <p className="mt-3 font-display text-sm font-bold uppercase tracking-wide text-ink">{a.title}</p>
              <p className="mt-1 text-xs leading-snug text-muted">{a.detail}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

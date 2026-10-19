"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { experience } from "@/data/portfolio";
import { SectionHeading } from "@/components/hud/SectionHeading";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function Experience() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".log-line",
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: ".log-list", start: "top 70%", end: "bottom 60%", scrub: true },
          },
        );
        gsap.utils.toArray<HTMLElement>(".log-entry").forEach((el) => {
          gsap.from(el, {
            x: 40,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 80%", toggleActions: "play none none reverse" },
          });
          gsap.fromTo(
            el.querySelector(".log-node"),
            { scale: 0.4, boxShadow: "0 0 0 rgba(0,229,255,0)" },
            {
              scale: 1,
              boxShadow: "0 0 18px rgba(0,229,255,0.9)",
              scrollTrigger: { trigger: el, start: "top 65%", toggleActions: "play none none reverse" },
            },
          );
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="experience" aria-labelledby="experience-title" className="relative mx-auto max-w-5xl px-4 py-28 sm:px-8">
      <SectionHeading id="experience-title" index="04" kicker="Mission log" title="Experience">
        18 months of internships plus freelance work — most recent first.
      </SectionHeading>

      <div className="log-list relative">
        <div aria-hidden="true" className="absolute bottom-0 left-[7px] top-0 w-px bg-cyan/15 sm:left-[11px]" />
        <div
          aria-hidden="true"
          className="log-line absolute bottom-0 left-[7px] top-0 w-px origin-top bg-gradient-to-b from-cyan via-cyan to-amber shadow-[0_0_10px_#00e5ff] sm:left-[11px]"
        />
        <ol className="space-y-12">
          {experience.map((e, i) => (
            <li key={e.org + e.period} className="log-entry relative pl-8 sm:pl-12">
              <span
                aria-hidden="true"
                className="log-node absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2 border-cyan bg-void sm:h-[23px] sm:w-[23px]"
              >
                <span className="absolute inset-[3px] rounded-full bg-cyan sm:inset-[5px]" />
              </span>
              <article className="glass p-5 sm:p-6">
                <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="font-mono text-xs text-amber">
                    LOG {String(experience.length - i).padStart(2, "0")} · {e.period}
                  </p>
                  <p className="hud-label text-muted">{e.org}</p>
                </header>
                <h3 className="mt-2 font-display text-lg font-bold uppercase tracking-wide text-ink sm:text-xl">{e.role}</h3>
                <ul className="mt-4 space-y-2">
                  {e.points.map((p) => (
                    <li key={p} className="flex gap-3 text-sm leading-relaxed text-ink/85 sm:text-base">
                      <span className="mt-2 h-1 w-3 shrink-0 bg-cyan/70" aria-hidden="true" />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

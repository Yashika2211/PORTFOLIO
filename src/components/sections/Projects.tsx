"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { projects, type Project } from "@/data/portfolio";
import { playSound } from "@/lib/sound";
import { SectionHeading } from "@/components/hud/SectionHeading";
import { useShallow } from "zustand/react/shallow";
import { useYashu } from "@/yashu/store";
import { Lab } from "./Lab";

gsap.registerPlugin(ScrollTrigger, useGSAP);

function CaseFile({ project, index }: { project: Project; index: number }) {
  const { openCaseFile, activeSkill } = useYashu(useShallow((s) => ({ openCaseFile: s.openCaseFile, activeSkill: s.activeSkill })));
  const tilt = useRef<HTMLDivElement>(null);
  const related = activeSkill ? project.skills.includes(activeSkill) : null;
  const headline = project.metrics[0];

  const onMove = (e: React.PointerEvent) => {
    const el = tilt.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateY(${px * 10}deg) rotateX(${-py * 10}deg) translateZ(10px)`;
  };
  const onLeave = () => {
    if (tilt.current) tilt.current.style.transform = "";
  };

  return (
    <li data-case={project.slug} className={`case-file [perspective:1200px] ${index % 2 ? "lg:ml-auto" : ""} lg:w-[78%]`}>
      <div ref={tilt} className="transition-transform duration-300 ease-out [transform-style:preserve-3d]">
        <button
          type="button"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            openCaseFile(project.slug, { x: r.left, y: r.top, w: r.width, h: r.height });
          }}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          onMouseEnter={() => playSound("hover")}
          aria-label={`Open case file: ${project.title} — ${project.subtitle}`}
          className={`glass scan-hover group block w-full p-6 text-left transition-[box-shadow,opacity,border-color] duration-300 hover:border-cyan/70 hover:shadow-[0_0_0_1px_rgba(0,229,255,0.45),0_0_40px_rgba(0,229,255,0.2)] sm:p-8 ${
            related === true ? "!border-amber/80 shadow-[0_0_40px_rgba(255,181,71,0.25)]" : ""
          } ${related === false ? "opacity-40" : ""}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="hud-label">
              Case file {String(index + 1).padStart(2, "0")}
              {project.event && <span className="ml-2 text-amber">· {project.event}</span>}
            </span>
            <span className="font-mono text-[11px] text-muted">
              {project.live ? "● live" : "○ source"} · {project.stack.length} modules
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <h3 className="font-display text-2xl font-bold uppercase tracking-wide text-ink sm:text-4xl">{project.title}</h3>
              <p className="mt-1 text-muted">{project.subtitle}</p>
              <p className="mt-4 line-clamp-3 leading-relaxed text-ink/85">{project.built[0]}</p>
            </div>
            <div className="shrink-0 sm:text-right">
              <p className="font-display text-3xl font-black text-amber sm:text-4xl">{headline.value}</p>
              <p className="max-w-[14rem] text-xs text-muted">{headline.label}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <ul className="flex flex-wrap gap-1.5" aria-label="Stack">
              {project.stack.slice(0, 5).map((s) => (
                <li key={s} className="rounded border border-cyan/20 px-2 py-0.5 font-mono text-[11px] text-ink/80">
                  {s}
                </li>
              ))}
              {project.stack.length > 5 && <li className="px-1 font-mono text-[11px] text-muted">+{project.stack.length - 5}</li>}
            </ul>
            <span className="font-display text-xs uppercase tracking-[0.2em] text-cyan transition group-hover:translate-x-1">
              Open briefing →
            </span>
          </div>
        </button>
      </div>
    </li>
  );
}

export function Projects() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      // Camera dolly: each case file flies in from deep space and drifts past.
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px)", () => {
        gsap.utils.toArray<HTMLElement>(".case-file").forEach((el, i) => {
          const side = i % 2 ? 1 : -1;
          gsap.fromTo(
            el,
            { z: -700, rotateY: side * 22, rotateX: 8, opacity: 0, y: 80 },
            {
              z: 0,
              rotateY: 0,
              rotateX: 0,
              opacity: 1,
              y: 0,
              ease: "power2.out",
              scrollTrigger: { trigger: el, start: "top bottom", end: "top 55%", scrub: 0.6 },
            },
          );
        });
      });
      // Mobile: a light fade-up instead of the 3D dolly.
      mm.add("(prefers-reduced-motion: no-preference) and (max-width: 1023px)", () => {
        gsap.utils.toArray<HTMLElement>(".case-file").forEach((el) => {
          gsap.from(el, {
            y: 40,
            opacity: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none none" },
          });
        });
      });
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(".projects-grid-bg", {
          backgroundPositionY: "400px",
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="projects" aria-labelledby="projects-title" className="relative py-28">
      <div
        aria-hidden="true"
        className="projects-grid-bg pointer-events-none absolute inset-0 -z-10 opacity-40 [background-image:linear-gradient(rgba(0,229,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.08)_1px,transparent_1px)] [background-size:80px_80px] [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]"
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <SectionHeading id="projects-title" index="03" kicker="Case files" title="Projects">
          Five missions, ordered by impact. Open any file for the full briefing — problem, build, architecture and numbers.
        </SectionHeading>
        <ol className="space-y-10 [perspective:1600px] sm:space-y-14">
          {projects.map((p, i) => (
            <CaseFile key={p.slug} project={p} index={i} />
          ))}
        </ol>
        <Lab />
      </div>
    </section>
  );
}

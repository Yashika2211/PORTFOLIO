"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { projects } from "@/data/portfolio";
import { playSound } from "@/lib/sound";
import { useShallow } from "zustand/react/shallow";
import { useYashu } from "@/yashu/store";
import { setScrollLocked } from "@/components/providers/SmoothScroll";
import { ArchDiagram } from "./ArchDiagram";
import { FanChart } from "./FanChart";

function Block({ n, label, children }: { n: string; label: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h3 className="hud-label mb-3 flex items-center gap-2">
        <span className="text-amber">{n}</span> {label}
      </h3>
      {children}
    </section>
  );
}

export function ProjectBriefing() {
  const { openProject, closeCaseFile, origin } = useYashu(
    useShallow((s) => ({ openProject: s.openProject, closeCaseFile: s.closeCaseFile, origin: s.portalOrigin })),
  );
  const project = projects.find((p) => p.slug === openProject) ?? null;
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!project) return;
    opener.current = document.activeElement as HTMLElement | null;
    setScrollLocked(true);
    playSound("open");
    window.setTimeout(() => closeRef.current?.focus(), 50);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCaseFile();
      // Minimal focus trap: keep Tab inside the dialog.
      if (e.key === "Tab" && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      setScrollLocked(false);
      playSound("close");
      opener.current?.focus?.();
    };
  }, [project, closeCaseFile]);

  // Portal iris: grows from the clicked card's centre and collapses back into it.
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cx = origin ? origin.x + origin.w / 2 : typeof window !== "undefined" ? window.innerWidth / 2 : 0;
  const cy = origin ? origin.y + origin.h / 2 : typeof window !== "undefined" ? window.innerHeight / 2 : 0;
  const closed = reduced ? { opacity: 0 } : { clipPath: `circle(0px at ${cx}px ${cy}px)`, opacity: 1 };
  const opened = reduced ? { opacity: 1 } : { clipPath: `circle(150% at ${cx}px ${cy}px)`, opacity: 1 };

  return (
    <AnimatePresence>
      {project && !reduced && (
        <motion.div
          key={`iris-${project.slug}`}
          aria-hidden="true"
          className="pointer-events-none fixed z-[86] rounded-full border-2 border-cyan shadow-[0_0_40px_10px_rgba(0,229,255,0.5),inset_0_0_40px_rgba(0,229,255,0.6)]"
          style={{ left: cx - 40, top: cy - 40, width: 80, height: 80 }}
          initial={{ scale: 0.2, opacity: 1 }}
          animate={{ scale: 30, opacity: 0 }}
          exit={{ scale: 0.2, opacity: [0, 1, 0] }}
          transition={{ duration: 0.7, ease: [0.5, 0, 0.2, 1] }}
        />
      )}
      {project && (
        <motion.div
          key={project.slug}
          className="fixed inset-0 z-[85] overflow-y-auto overscroll-contain bg-void/85 backdrop-blur-md"
          data-lenis-prevent
          initial={closed}
          animate={opened}
          exit={closed}
          transition={{ duration: reduced ? 0.2 : 0.6, ease: [0.6, 0, 0.2, 1] }}
          onMouseDown={(e) => e.target === e.currentTarget && closeCaseFile()}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="briefing-title"
            className="glass relative mx-auto my-6 w-[calc(100%-2rem)] max-w-5xl p-5 sm:my-12 sm:p-10"
            initial={{ y: 40, rotateX: 8, opacity: 0, filter: "blur(8px)" }}
            animate={{ y: 0, rotateX: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="hud-label mb-2">
                  Mission briefing {project.event && <span className="text-amber">· {project.event}</span>}
                </p>
                <h2 id="briefing-title" className="font-display text-3xl font-black uppercase tracking-wide text-ink text-glow sm:text-5xl">
                  {project.title}
                </h2>
                <p className="mt-2 text-lg text-muted">{project.subtitle}</p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => closeCaseFile()}
                className="shrink-0 rounded-md border border-cyan/40 px-3 py-2 font-mono text-xs text-muted transition hover:border-cyan hover:text-ink"
                aria-label="Close briefing"
              >
                ESC ✕
              </button>
            </div>

            <div className="grid gap-x-10 lg:grid-cols-[1.1fr_1fr]">
              <div>
                <Block n="01" label="Problem">
                  <p className="leading-relaxed text-ink/90">{project.problem}</p>
                </Block>
                <Block n="02" label="What I built">
                  <ul className="space-y-3">
                    {project.built.map((b) => (
                      <li key={b} className="flex gap-3 leading-relaxed text-ink/90">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-cyan" aria-hidden="true" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </Block>
              </div>
              <div>
                <Block n="03" label="Architecture">
                  <ArchDiagram arch={project.arch} title={project.title} uid={project.slug} />
                </Block>
                <Block n="04" label="Hard numbers">
                  <dl className="grid grid-cols-2 gap-3">
                    {project.metrics.map((m) => (
                      <div key={m.label} className="rounded-lg border border-amber/30 bg-amber/5 p-3">
                        <dt className="sr-only">{m.label}</dt>
                        <dd>
                          <span className="block font-display text-2xl font-bold text-amber">{m.value}</span>
                          <span className="mt-1 block text-xs leading-snug text-muted" aria-hidden="true">
                            {m.label}
                          </span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Block>
              </div>
            </div>

            {project.fanChart && (
              <Block n="05" label="Forecast hologram">
                <FanChart />
              </Block>
            )}

            <Block n={project.fanChart ? "06" : "05"} label="Stack">
              <ul className="flex flex-wrap gap-2">
                {project.stack.map((s) => (
                  <li key={s} className="rounded-md border border-cyan/25 bg-cyan/5 px-3 py-1 font-mono text-xs text-ink/90">
                    {s}
                  </li>
                ))}
              </ul>
            </Block>

            <div className="flex flex-wrap gap-3 border-t border-cyan/15 pt-6">
              {project.live && (
                <a href={project.live} target="_blank" rel="noopener noreferrer" className="btn-energy amber">
                  Launch live ↗
                </a>
              )}
              {project.repo && (
                <a href={project.repo} target="_blank" rel="noopener noreferrer" className="btn-energy">
                  View source ↗
                </a>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

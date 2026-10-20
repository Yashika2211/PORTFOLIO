"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { experience, profile, projects, sections, stats } from "@/data/portfolio";
import type { Card } from "../conversation";
import { useYashu } from "../store";

const P = (slug: string) => projects.find((p) => p.slug === slug)!;

function Chips({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((s, i) => (
        <li key={s} className="holo-row rounded border border-cyan/30 bg-cyan/5 px-2 py-0.5 font-mono text-[11px] text-ink/90" style={{ animationDelay: `${i * 50}ms` }}>
          {s}
        </li>
      ))}
    </ul>
  );
}

function Metrics({ slug, n = 4 }: { slug: string; n?: number }) {
  return (
    <dl className="grid grid-cols-2 gap-2">
      {P(slug).metrics.slice(0, n).map((m, i) => (
        <div key={m.label} className="holo-row rounded border border-amber/30 bg-amber/5 p-2" style={{ animationDelay: `${i * 80}ms` }}>
          <dt className="sr-only">{m.label}</dt>
          <dd>
            <span className="block font-display text-lg font-bold text-amber">{m.value}</span>
            <span className="block text-[11px] leading-snug text-muted">{m.label}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ProjectCard({ slug, view }: { slug: string; view: "overview" | "stack" | "numbers" | "problem" }) {
  const p = P(slug);
  const open = () => useYashu.getState().openCaseFile(slug);
  const briefingOpen = useYashu((s) => s.openProject !== null);
  return (
    <>
      <p className="hud-label text-amber">{view === "overview" ? "Case file" : view}</p>
      <h3 className="mt-1 font-display text-xl font-bold uppercase tracking-wide text-ink">{p.title}</h3>
      <p className="mb-3 text-xs text-muted">{p.subtitle}</p>
      {view === "stack" && <Chips items={p.stack} />}
      {view === "numbers" && <Metrics slug={slug} />}
      {view === "problem" && <p className="text-sm leading-relaxed text-ink/90">{p.problem}</p>}
      {view === "overview" && (
        <ul className="space-y-1.5 text-sm leading-relaxed text-ink/90">
          {p.built.slice(0, 2).map((b, i) => (
            <li key={b} className="holo-row flex gap-2" style={{ animationDelay: `${i * 90}ms` }}>
              <span className="mt-2 h-1 w-1 shrink-0 rotate-45 bg-cyan" aria-hidden="true" />
              {b}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {!briefingOpen && (
          <button type="button" className="btn-energy !px-3 !py-1.5 !text-[10px]" onClick={open}>
            Open briefing
          </button>
        )}
        <span className="self-center font-mono text-[10px] text-muted">try: &ldquo;numbers&rdquo; · &ldquo;stack&rdquo; · &ldquo;next one&rdquo;</span>
      </div>
    </>
  );
}

function CompareCard({ a, b }: { a: string; b: string }) {
  const rows = [P(a), P(b)];
  return (
    <>
      <p className="hud-label text-amber">Comparison</p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {rows.map((p, i) => (
          <div key={p.slug} className="holo-row" style={{ animationDelay: `${i * 120}ms` }}>
            <h3 className="font-display text-base font-bold uppercase tracking-wide text-ink">{p.title}</h3>
            <p className="text-[11px] text-muted">{p.event ?? p.subtitle}</p>
            <ul className="mt-2 space-y-1.5">
              {p.metrics.slice(0, 3).map((m) => (
                <li key={m.label} className="text-xs">
                  <span className="font-display font-bold text-amber">{m.value}</span> <span className="text-muted">{m.label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 font-mono text-[10px] text-cyan">
              {p.stack.length} modules · {p.live ? "live" : "source"}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

function PitchCard() {
  const hack = stats.find((s) => s.id === "hack")!.value;
  const months = stats.find((s) => s.id === "intern")!.value;
  const evidence = [
    ["Ships", `${hack} hackathon wins · ${projects.length} flagship builds, ${projects.filter((p) => p.live).length} live`],
    ["Measures", "p95 latency −35% · forecast coverage 77.7% → 84.1% · 0.9807 macro F0.5"],
    ["Proven", `${months} months of internships · ${experience.length} roles · CGPA ${profile.education.cgpa}`],
  ];
  return (
    <>
      <p className="hud-label text-amber">Why hire Yashika</p>
      <ol className="mt-2 space-y-2">
        {evidence.map(([k, v], i) => (
          <li key={k} className="holo-row flex gap-3" style={{ animationDelay: `${i * 120}ms` }}>
            <span className="font-display text-sm font-bold text-cyan">0{i + 1}</span>
            <span>
              <span className="block font-display text-sm font-bold uppercase tracking-wide text-ink">{k}</span>
              <span className="block text-xs text-muted">{v}</span>
            </span>
          </li>
        ))}
      </ol>
      <a href={profile.resume} download className="btn-energy amber mt-3 !px-3 !py-1.5 !text-[10px]">
        Resume ↓
      </a>
    </>
  );
}

function BriefingCard() {
  const highlights = [
    `${projects[0].title} — ${projects[0].metrics[0].value} ${projects[0].metrics[0].label}`,
    `${stats.find((s) => s.id === "hack")!.value} hackathon wins · SIH 2025 qualifier`,
    `Now: ${experience[0].role}`,
  ];
  return (
    <>
      <p className="hud-label text-amber">Briefing</p>
      <h3 className="mt-1 font-display text-lg font-bold uppercase tracking-wide text-ink">{profile.name}</h3>
      <p className="text-xs text-muted">{profile.headline}</p>
      <ul className="mt-3 space-y-1.5 text-sm text-ink/90">
        {highlights.map((h, i) => (
          <li key={h} className="holo-row flex gap-2" style={{ animationDelay: `${i * 100}ms` }}>
            <span className="text-cyan">›</span>
            {h}
          </li>
        ))}
      </ul>
      <p className="mt-3 font-mono text-[10px] text-muted">try: &ldquo;take the tour&rdquo; · &ldquo;why should I hire her&rdquo;</p>
    </>
  );
}

function useDiagnostics() {
  const [rows, setRows] = useState<[string, string][]>([]);
  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { effectiveType?: string; downlink?: number } };
    const ua = navigator.userAgent;
    const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chromium" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Unknown";
    const os = /Mac/.test(ua) ? (navigator.maxTouchPoints > 1 ? "iPadOS" : "macOS") : /Win/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "Unknown";
    let gpu = "unavailable";
    try {
      const gl = document.createElement("canvas").getContext("webgl");
      gpu = gl ? `WebGL ${gl.getParameter(gl.VERSION).toString().match(/\d\.\d/)?.[0] ?? ""}`.trim() : "no WebGL";
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      /* ignore */
    }
    const all: [string, string][] = [
      ["client", `${browser} · ${os}`],
      ["display", `${window.innerWidth}×${window.innerHeight} @${window.devicePixelRatio}x`],
      ["compute", `${nav.hardwareConcurrency ?? "?"} cores${nav.deviceMemory ? ` · ${nav.deviceMemory} GB` : ""}`],
      ["graphics", `${gpu} · ${useYashu.getState().gl3d ? "holographic stage" : "2D mode"}`],
      ["network", nav.connection?.effectiveType ? `${nav.connection.effectiveType}${nav.connection.downlink ? ` · ~${nav.connection.downlink} Mb/s` : ""}` : navigator.onLine ? "online" : "offline"],
      ["locale", `${Intl.DateTimeFormat().resolvedOptions().timeZone} · ${navigator.language}`],
      ["motion", window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduced" : "full"],
    ];
    const timers = all.map((row, i) => window.setTimeout(() => setRows((r) => [...r, row]), 180 * (i + 1)));
    return () => timers.forEach(clearTimeout);
  }, []);
  return rows;
}

function DiagnosticsCard() {
  const rows = useDiagnostics();
  return (
    <>
      <p className="hud-label text-amber">Diagnostics</p>
      <dl className="mt-2 space-y-1 font-mono text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="holo-row flex justify-between gap-4 border-b border-cyan/10 pb-1">
            <dt className="text-muted">{k}</dt>
            <dd className="text-right text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 font-mono text-[10px] text-mint">● all checks local · nothing transmitted</p>
    </>
  );
}

function SectionCard({ id }: { id: (typeof sections)[number]["id"] }) {
  const label = sections.find((s) => s.id === id)!.label;
  return (
    <>
      <p className="hud-label text-amber">Location</p>
      <h3 className="mt-1 font-display text-lg font-bold uppercase tracking-wide text-ink">{label}</h3>
      <p className="mt-1 font-mono text-[10px] text-muted">try: &ldquo;next section&rdquo; · &ldquo;brief me&rdquo;</p>
    </>
  );
}

function Body({ card }: { card: Card }) {
  switch (card.kind) {
    case "project":
      return <ProjectCard slug={card.slug} view={card.view} />;
    case "compare":
      return <CompareCard a={card.a} b={card.b} />;
    case "pitch":
      return <PitchCard />;
    case "briefing":
      return <BriefingCard />;
    case "diagnostics":
      return <DiagnosticsCard />;
    case "section":
      return <SectionCard id={card.id} />;
  }
}

/** Holographic answer panel that assembles next to the assistant dock. */
export function HoloCard() {
  const current = useYashu((s) => s.card);
  const hover = useRef(false);

  useEffect(() => {
    if (!current) return;
    const t = window.setInterval(() => {
      if (!hover.current) useYashu.getState().showCard(null);
    }, 22_000);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !useYashu.getState().openProject && useYashu.getState().showCard(null);
    window.addEventListener("keydown", onKey);
    return () => {
      clearInterval(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [current]);

  return (
    <AnimatePresence mode="wait">
      {current && (
        <motion.aside
          key={current.id}
          aria-label="Y.A.S.H.U. answer"
          className="holo-card glass fixed bottom-24 left-4 z-[87] w-[min(380px,calc(100vw-32px))] p-4 sm:left-8 md:bottom-14"
          onMouseEnter={() => (hover.current = true)}
          onMouseLeave={() => (hover.current = false)}
          initial={{ opacity: 0, scaleY: 0.05, y: 20 }}
          animate={{ opacity: 1, scaleY: 1, y: 0 }}
          exit={{ opacity: 0, scaleY: 0.05 }}
          transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ transformOrigin: "bottom" }}
        >
          <button
            type="button"
            onClick={() => useYashu.getState().showCard(null)}
            className="absolute right-3 top-3 font-mono text-xs text-muted hover:text-ink"
            aria-label="Dismiss answer"
          >
            ✕
          </button>
          <Body card={current.card} />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useMemo, useState } from "react";

const W = 560;
const H = 220;
const PAD = { l: 36, r: 12, t: 14, b: 26 };
const DAYS = 14;

/** Deterministic illustrative series: a P50 path with widening P10/P90 bands. */
function useSeries() {
  return useMemo(() => {
    const out: { d: number; p10: number; p50: number; p90: number }[] = [];
    for (let d = 0; d <= DAYS; d++) {
      const p50 = 62 + Math.sin(d / 2.3) * 9 + d * 0.9;
      const spread = 3 + d * 1.35;
      out.push({ d, p10: p50 - spread, p50, p90: p50 + spread * 1.15 });
    }
    return out;
  }, []);
}

export function FanChart() {
  const data = useSeries();
  const [hover, setHover] = useState<number | null>(null);
  const min = Math.min(...data.map((p) => p.p10)) - 4;
  const max = Math.max(...data.map((p) => p.p90)) + 4;
  const x = (d: number) => PAD.l + (d / DAYS) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - min) / (max - min)) * (H - PAD.t - PAD.b);

  const line = (k: "p10" | "p50" | "p90") => data.map((p, i) => `${i ? "L" : "M"}${x(p.d)},${y(p[k])}`).join(" ");
  const band =
    data.map((p, i) => `${i ? "L" : "M"}${x(p.d)},${y(p.p90)}`).join(" ") +
    [...data].reverse().map((p) => `L${x(p.d)},${y(p.p10)}`).join(" ") +
    "Z";
  const h = hover !== null ? data[hover] : null;

  return (
    <figure className="glass p-4">
      <figcaption className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="hud-label">14-day cash forecast · P10 / P50 / P90</span>
        <span className="font-mono text-[11px] text-muted">illustrative shape — not real merchant data</span>
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="Illustrative fan chart: median forecast line with an uncertainty band that widens over 14 days."
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          const d = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * DAYS);
          setHover(Math.max(0, Math.min(DAYS, d)));
        }}
      >
        {[0, 0.5, 1].map((t) => (
          <line key={t} x1={PAD.l} x2={W - PAD.r} y1={PAD.t + t * (H - PAD.t - PAD.b)} y2={PAD.t + t * (H - PAD.t - PAD.b)} stroke="rgb(159 179 194 / 0.15)" />
        ))}
        {[0, 7, 14].map((d) => (
          <text key={d} x={x(d)} y={H - 8} textAnchor="middle" className="fill-muted font-mono" fontSize="10">
            {d === 0 ? "today" : `+${d}d`}
          </text>
        ))}
        <path d={band} fill="#00e5ff" fillOpacity="0.16" className="fan-band" />
        <path d={line("p90")} fill="none" stroke="#00e5ff" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="3 3" />
        <path d={line("p10")} fill="none" stroke="#00e5ff" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="3 3" />
        <path d={line("p50")} fill="none" stroke="#00e5ff" strokeWidth="2" className="fan-line" pathLength={1} style={{ filter: "drop-shadow(0 0 4px #00e5ff)" }} />
        {h && (
          <g>
            <line x1={x(h.d)} x2={x(h.d)} y1={PAD.t} y2={H - PAD.b} stroke="#ffb547" strokeOpacity="0.6" />
            <circle cx={x(h.d)} cy={y(h.p50)} r="4" fill="#00e5ff" stroke="#05070d" strokeWidth="2" />
          </g>
        )}
      </svg>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-muted">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-cyan" aria-hidden="true" /> P50 median
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 bg-cyan/20" aria-hidden="true" /> P10–P90 band
          </span>
        </div>
        <span aria-live="polite" className="text-ink/80">
          {h ? `${h.d === 0 ? "today" : `+${h.d}d`} · P10 ${h.p10.toFixed(0)} · P50 ${h.p50.toFixed(0)} · P90 ${h.p90.toFixed(0)}` : "hover to inspect"}
        </span>
      </div>
    </figure>
  );
}

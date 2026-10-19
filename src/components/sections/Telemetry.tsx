"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { profile } from "@/data/portfolio";
import { timeAgo, useGitHub } from "@/lib/github";
import { useContributions, useWeather } from "@/lib/telemetry";
import { useYashu } from "@/yashu/store";

const TerrainView = dynamic(() => import("@/scenes/views/TerrainView"), { ssr: false });

const HEAT = ["bg-[#0b2a36]", "bg-[#0a7d91]", "bg-[#00b8d4]", "bg-cyan", "bg-amber"];

function useServices() {
  const [s, setS] = useState({ llm: "checking", tts: "checking" });
  useEffect(() => {
    Promise.all(
      ["/api/ask", "/api/tts"].map((u) =>
        fetch(u)
          .then((r) => r.json() as Promise<{ enabled: boolean }>)
          .then((j) => (j.enabled ? "online" : "standby"))
          .catch(() => "offline"),
      ),
    ).then(([llm, tts]) => setS({ llm, tts }));
  }, []);
  return s;
}

/** Live HUD widgets: contribution terrain, latest push, Bengaluru time/weather, systems status. */
export function Telemetry() {
  const gh = useGitHub();
  const contrib = useContributions();
  const weather = useWeather();
  const services = useServices();
  const { gl3d, voice } = useYashu(useShallow((s) => ({ gl3d: s.gl3d, voice: s.voice })));
  const [time, setTime] = useState("--:--");
  useEffect(() => {
    const f = new Intl.DateTimeFormat("en-GB", { timeZone: profile.timezone, hour: "2-digit", minute: "2-digit" });
    const tick = () => setTime(f.format(new Date()));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  // Last 26 weeks keeps the terrain readable at widget size.
  const days = contrib?.days.slice(-182) ?? [];
  const levels = days.map((d) => d.level);
  const active = days.filter((d) => d.level > 0).length;
  const latest = gh.recent[0];

  return (
    <div className="mt-20">
      <h3 className="hud-label mb-6 flex items-center gap-3">
        <span className="text-amber">05.b</span>
        <span className="h-px w-10 bg-cyan/50" aria-hidden="true" />
        Live telemetry
      </h3>
      <div className="grid gap-4 md:grid-cols-3">
        <figure className="glass relative p-4 md:col-span-2">
          <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="hud-label">GitHub activity · last 26 weeks</span>
            <span className="font-mono text-xs text-muted">
              {contrib === null ? "loading…" : days.length ? `${active} active days` : "offline — see GitHub"}
            </span>
          </figcaption>
          <div
            className="relative mt-3 h-44"
            role="img"
            aria-label={days.length ? `Contribution terrain: ${active} active days in the last 26 weeks.` : "Contribution data unavailable."}
          >
            {gl3d && levels.length > 0 ? (
              <TerrainView levels={levels} />
            ) : (
              <div className="grid h-full grid-flow-col grid-rows-7 gap-[3px] overflow-hidden" aria-hidden="true">
                {levels.map((l, i) => (
                  <span key={i} className={`rounded-[2px] ${HEAT[l] ?? HEAT[0]}`} />
                ))}
              </div>
            )}
          </div>
        </figure>

        <div className="grid gap-4">
          <div className="glass p-4">
            <p className="hud-label">Latest push</p>
            {latest ? (
              <a href={latest.url} target="_blank" rel="noopener noreferrer" className="mt-1 block font-mono text-sm text-ink hover:text-cyan">
                {latest.name} ↗
              </a>
            ) : null}
            <p className="font-mono text-xs text-muted" suppressHydrationWarning>
              {latest ? timeAgo(latest.pushedAt) : "—"} · {gh.publicRepos} repos [{gh.source}]
            </p>
          </div>
          <div className="glass p-4">
            <p className="hud-label">Bengaluru</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-ink" suppressHydrationWarning>
              {time} <span className="text-sm font-normal text-muted">IST</span>
            </p>
            <p className="font-mono text-xs text-muted">{weather ? `${weather.temp}°C · ${weather.label}` : "weather offline"}</p>
          </div>
          <div className="glass p-4">
            <p className="hud-label">Systems status</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-xs">
              {[
                ["render", gl3d ? "webgl" : "2d"],
                ["voice", voice ? "engaged" : "silent"],
                ["llm", services.llm],
                ["tts", services.tts],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-muted">{k}</dt>
                  <dd className={v === "online" || v === "webgl" || v === "engaged" ? "text-mint" : "text-ink/80"}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

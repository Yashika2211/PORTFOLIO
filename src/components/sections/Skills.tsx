"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { awsServices, projects, skillGroups } from "@/data/portfolio";
import { canRender3D, useCapabilities } from "@/lib/capabilities";
import { playSound } from "@/lib/sound";
import { SectionHeading } from "@/components/hud/SectionHeading";
import { useShallow } from "zustand/react/shallow";
import { useYashu } from "@/yashu/store";

const SkillConstellation = dynamic(() => import("@/components/three/SkillConstellation"), { ssr: false });

/** Mount once near the viewport, then keep rendering only while on screen. */
function useVisibility<T extends Element>() {
  const ref = useRef<T>(null);
  const [mounted, setMounted] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setOnScreen(e.isIntersecting);
        if (e.isIntersecting) setMounted(true);
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, mounted, onScreen };
}

export function Skills() {
  const caps = useCapabilities();
  const { activeSkill, setActiveSkill } = useYashu(useShallow((s) => ({ activeSkill: s.activeSkill, setActiveSkill: s.setActiveSkill })));
  const { ref, mounted, onScreen } = useVisibility<HTMLDivElement>();
  const usedIn = activeSkill ? projects.filter((p) => p.skills.includes(activeSkill)) : [];
  const show3D = canRender3D(caps) && !caps.reducedMotion;

  return (
    <section id="skills" aria-labelledby="skills-title" className="relative mx-auto max-w-7xl px-4 py-28 sm:px-8">
      <SectionHeading id="skills-title" index="02" kicker="Capability matrix" title="Skills">
        Hover, tap or focus any skill to light up the case files that use it. The number on each chip is how many featured projects use it.
      </SectionHeading>

      <div className="grid items-start gap-10 lg:grid-cols-2">
        <div ref={ref} className="relative aspect-square w-full max-lg:max-h-[420px]" aria-hidden="true">
          <div className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgba(0,229,255,0.12),transparent_70%)]" />
          {show3D && mounted ? (
            <SkillConstellation active={activeSkill} onHover={setActiveSkill} mobile={caps.mobile} running={onScreen} />
          ) : (
            <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
              {skillGroups.map((g, i) => (
                <ellipse
                  key={g.id}
                  cx="100"
                  cy="100"
                  rx={36 + i * 18}
                  ry={(36 + i * 18) * 0.38}
                  fill="none"
                  stroke={g.color}
                  strokeOpacity="0.45"
                  transform={`rotate(${[-12, 18, -28, 8][i]} 100 100)`}
                />
              ))}
              <circle cx="100" cy="100" r="9" fill="#7ff4ff" />
            </svg>
          )}
          <div className="pointer-events-none absolute bottom-2 left-2 font-mono text-xs text-muted">
            {activeSkill ? (
              <span>
                <span className="text-amber">{activeSkill}</span>
                {usedIn.length > 0 && <> → {usedIn.map((p) => p.title).join(", ")}</>}
              </span>
            ) : (
              "hover a node"
            )}
          </div>
        </div>

        <div className="space-y-7" onMouseLeave={() => setActiveSkill(null)}>
          {skillGroups.map((g) => (
            <div key={g.id}>
              <h3 className="hud-label mb-3 flex items-center gap-2" style={{ color: g.color }}>
                <span className="h-2 w-2 rounded-full" style={{ background: g.color, boxShadow: `0 0 8px ${g.color}` }} aria-hidden="true" />
                {g.label}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {g.skills.map((s) => {
                  const active = activeSkill === s;
                  const count = projects.filter((p) => p.skills.includes(s)).length;
                  return (
                    <li key={s}>
                      <button
                        type="button"
                        onMouseEnter={() => {
                          setActiveSkill(s);
                          playSound("hover");
                        }}
                        onFocus={() => setActiveSkill(s)}
                        onBlur={() => setActiveSkill(null)}
                        aria-label={count ? `${s} — used in ${count} featured project${count > 1 ? "s" : ""}` : s}
                        className={`rounded-md border px-3 py-1.5 text-sm transition ${
                          active
                            ? "border-amber bg-amber/10 text-ink shadow-[0_0_14px_rgba(255,181,71,0.35)]"
                            : "border-cyan/20 bg-deep/60 text-ink/85 hover:border-cyan/60"
                        }`}
                      >
                        {s}
                        {count > 0 && <span className="ml-1.5 font-mono text-[10px] text-cyan">{count}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {g.id === "backend" && (
                <p className="mt-2 font-mono text-xs text-muted">AWS: {awsServices.join(" · ")}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { assistant, profile, sections } from "@/data/portfolio";
import { useGitHub } from "@/lib/github";
import { playSound } from "@/lib/sound";
import { ACHIEVEMENTS } from "@/yashu/achievements";
import { runCommand } from "@/yashu/commands";
import { micSupported, startListening, stopListening } from "@/yashu/listen";
import { useShallow } from "zustand/react/shallow";
import { useYashu } from "@/yashu/store";
import { scrollToSection } from "@/components/providers/SmoothScroll";

function Corner({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" width="44" height="44" viewBox="0 0 44 44" className={`pointer-events-none fixed z-40 hidden md:block ${className}`}>
      <path d="M1 22 V1 H22" fill="none" stroke="#00e5ff" strokeOpacity="0.8" strokeWidth="1.5" />
      <path d="M6 12 V6 H12" fill="none" stroke="#ffb547" strokeOpacity="0.8" strokeWidth="1" />
    </svg>
  );
}

function useClock() {
  const [time, setTime] = useState("--:--:--");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: profile.timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function useScrollProgress() {
  const [pct, setPct] = useState(0);
  const [active, setActive] = useState<string>("hero");
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setPct(max > 0 ? Math.round((window.scrollY / max) * 100) : 0);
      const mid = window.innerHeight * 0.4;
      for (const s of [...sections].reverse()) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= mid) {
          setActive(s.id);
          break;
        }
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return { pct, active };
}

function Toggle({ on, label, onClick, disabled, hint }: { on: boolean; label: string; onClick: () => void; disabled?: boolean; hint?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        onClick();
        playSound("click");
      }}
      disabled={disabled}
      aria-pressed={on}
      aria-label={hint ? `${label} — ${hint}` : label}
      title={hint ?? `${label} ${on ? "on" : "off"}`}
      className="flex items-center gap-1.5 whitespace-nowrap rounded border border-cyan/30 px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-muted transition hover:border-cyan hover:text-ink disabled:opacity-40 aria-pressed:border-amber/70 aria-pressed:text-amber"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-amber shadow-[0_0_6px_#ffb547]" : "bg-muted/50"}`} aria-hidden="true" />
      {label}
    </button>
  );
}

export function HudFrame() {
  const time = useClock();
  const { pct, active } = useScrollProgress();
  const gh = useGitHub();
  const { voice, sound, setVoice, toggleSound, setCommandOpen, micOn, listening, set, badges, gestures } = useYashu(
    useShallow((s) => ({
      voice: s.voice,
      sound: s.sound,
      setVoice: s.setVoice,
      toggleSound: s.toggleSound,
      setCommandOpen: s.setCommandOpen,
      micOn: s.micOn,
      listening: s.listening,
      set: s.set,
      badges: s.achievements.filter((a) => ACHIEVEMENTS.some((x) => x.id === a)).length,
      gestures: s.gestures,
    })),
  );
  const [ttsOk, setTtsOk] = useState(true);
  const [micOk, setMicOk] = useState(false);
  useEffect(() => {
    setTtsOk("speechSynthesis" in window);
    setMicOk(micSupported());
  }, []);
  const toggleWake = () => {
    if (micOn) {
      stopListening();
      set({ micOn: false });
    } else {
      set({ micOn: true });
      startListening("wake", (t) => void runCommand(t, "voice"));
    }
  };

  return (
    <>
      {/* Background ornaments */}
      <div aria-hidden="true" className="hex-grid pointer-events-none fixed inset-0 -z-10 opacity-70" />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[140vmax] w-[140vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,229,255,0.07),transparent_55%)]" />
        <div className="radar-sweep absolute left-1/2 top-1/2 h-[120vmax] w-[120vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(0,229,255,0.06)_30deg,transparent_60deg)]" />
      </div>

      <Corner className="left-2 top-2" />
      <Corner className="right-2 top-2 rotate-90" />
      <Corner className="bottom-2 right-2 rotate-180" />
      <Corner className="bottom-2 left-2 -rotate-90" />

      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-8">
        <div className="glass mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-2 sm:px-4">
          <button
            type="button"
            onClick={() => scrollToSection("hero")}
            className="font-display text-sm font-bold tracking-[0.25em] text-cyan text-glow"
            aria-label={`${assistant.name} — back to top`}
          >
            {assistant.name}
          </button>

          <nav aria-label="Sections" className="hidden xl:block">
            <ul className="flex items-center gap-1">
              {sections.slice(1).map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(s.id);
                      playSound("click");
                    }}
                    aria-current={active === s.id ? "true" : undefined}
                    className="rounded px-2.5 py-1 font-display text-[11px] uppercase tracking-[0.18em] text-muted transition hover:text-ink aria-[current]:bg-cyan/10 aria-[current]:text-cyan"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 md:flex">
              <Toggle on={voice === true} label="Voice" onClick={() => setVoice(voice !== true)} disabled={!ttsOk} />
              <Toggle on={sound} label="SFX" onClick={toggleSound} />
              <Toggle
                on={gestures}
                label="Hands"
                hint="hand-gesture control"
                onClick={() => (gestures ? set({ gestures: false }) : set({ gesturePrompt: true }))}
              />
              {micOk && <Toggle on={micOn} label="Wake" hint={"listen for \u201cHey Yashu\u201d"} onClick={toggleWake} />}
            </div>
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="hidden items-center gap-2 whitespace-nowrap rounded border border-cyan/30 px-2 py-1 font-mono text-[11px] text-muted transition hover:border-cyan hover:text-ink 2xl:flex"
              aria-label="Open command bar"
            >
              Ask <kbd className="rounded bg-cyan/10 px-1 text-cyan">⌘K</kbd>
            </button>
            <Link href="/recruiter" className="btn-energy amber whitespace-nowrap !px-3 !py-1.5 !text-[10px]">
              Skip the show →
            </Link>
          </div>
        </div>
      </header>

      {micOn && (
        <div
          role="status"
          className="fixed left-1/2 top-[4.6rem] z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-amber/60 bg-void/85 px-3 py-1 font-mono text-[11px] text-amber backdrop-blur"
        >
          <span className={`h-2 w-2 rounded-full bg-amber ${listening ? "pulse-dot" : "opacity-50"}`} aria-hidden="true" />
          Listening for &ldquo;Hey Yashu&rdquo;
        </div>
      )}

      {/* Bottom readouts */}
      <footer
        aria-label="System readouts"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 hidden px-8 pb-3 font-mono text-[11px] text-muted md:block"
      >
        <div className="mx-auto flex max-w-7xl items-end justify-between">
          <dl className="flex gap-5">
            <div className="flex gap-1.5">
              <dt className="text-cyan">BLR</dt>
              <dd className="tabular-nums" suppressHydrationWarning>
                {time} IST
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Status</dt>
              <dd className="flex items-center gap-1.5">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-mint" aria-hidden="true" /> systems nominal
              </dd>
            </div>
          </dl>
          <dl className="flex gap-5 text-right">
            <div className="flex gap-1.5">
              <dt className="text-amber">BADGES</dt>
              <dd className="tabular-nums">
                {badges}/{ACHIEVEMENTS.length}
              </dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-cyan">REPOS</dt>
              <dd className="tabular-nums">
                {gh.publicRepos}
                <span className="ml-1 text-muted/70">[{gh.source}]</span>
              </dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-cyan">SCROLL</dt>
              <dd className="w-9 tabular-nums">{String(pct).padStart(3, "0")}%</dd>
            </div>
          </dl>
        </div>
      </footer>

      {/* Scroll progress rail */}
      <div aria-hidden="true" className="fixed right-1 top-1/2 z-40 hidden h-40 w-px -translate-y-1/2 bg-cyan/15 md:block">
        <div className="w-px bg-cyan shadow-[0_0_8px_#00e5ff]" style={{ height: `${pct}%` }} />
      </div>
    </>
  );
}

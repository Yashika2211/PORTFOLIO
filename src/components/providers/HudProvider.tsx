"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setSoundEnabled } from "@/lib/sound";

/**
 * Mutable signal read every frame by the 3D core (no React re-render).
 * `speaking` makes the core pulse; `pointer` drives parallax.
 */
export const coreSignal = { speaking: false, energy: 0, pointer: { x: 0, y: 0 } };

type HudState = {
  voice: boolean;
  sound: boolean;
  toggleVoice: () => void;
  toggleSound: () => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  openProject: string | null;
  setOpenProject: (slug: string | null) => void;
  /** Skill hovered/focused in the constellation — highlights related projects. */
  activeSkill: string | null;
  setActiveSkill: (skill: string | null) => void;
};

const HudContext = createContext<HudState | null>(null);

const PREFS_KEY = "yashu:prefs:v1";

function loadPrefs(): { voice: boolean; sound: boolean } {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { voice: false, sound: false, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { voice: false, sound: false };
}

export function HudProvider({ children }: { children: ReactNode }) {
  const [voice, setVoice] = useState(false);
  const [sound, setSound] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [openProject, setOpenProject] = useState<string | null>(null);
  const [activeSkill, setActiveSkill] = useState<string | null>(null);

  useEffect(() => {
    const p = loadPrefs();
    setVoice(p.voice);
    setSound(p.sound);
  }, []);

  useEffect(() => {
    setSoundEnabled(sound);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ voice, sound }));
    } catch {
      /* ignore */
    }
  }, [voice, sound]);

  const toggleVoice = useCallback(() => setVoice((v) => !v), []);
  const toggleSound = useCallback(() => setSound((v) => !v), []);

  const value = useMemo(
    () => ({
      voice,
      sound,
      toggleVoice,
      toggleSound,
      commandOpen,
      setCommandOpen,
      openProject,
      setOpenProject,
      activeSkill,
      setActiveSkill,
    }),
    [voice, sound, toggleVoice, toggleSound, commandOpen, openProject, activeSkill],
  );

  return <HudContext.Provider value={value}>{children}</HudContext.Provider>;
}

export function useHud(): HudState {
  const ctx = useContext(HudContext);
  if (!ctx) throw new Error("useHud must be used inside <HudProvider>");
  return ctx;
}

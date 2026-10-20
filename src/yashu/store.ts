"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SectionId } from "./types";

export type Toast = { id: number; title: string; body: string };
export type Subtitle = { id: number; text: string; streaming?: boolean };

export type Rect = { x: number; y: number; w: number; h: number };

type State = {
  /** Persisted state has been read from localStorage. */
  hydrated: boolean;
  /** The shared WebGL scene is running (false → 2D fallbacks render instead). */
  gl3d: boolean;
  /** null = visitor hasn't chosen yet (show the ENGAGE / SILENT MODE prompt). */
  voice: boolean | null;
  sound: boolean;
  micOn: boolean;
  listening: boolean;
  gestures: boolean;
  overdrive: boolean;
  /** "go dark": dims ambient visuals and silences audio. */
  stealth: boolean;
  /** Gesture-control consent panel is open. */
  gesturePrompt: boolean;
  /** Bumped to play the celebratory sequence (sudo hire yashika). */
  celebrate: number;

  commandOpen: boolean;
  openProject: string | null;
  /** Where the portal iris should grow from / collapse back to. */
  portalOrigin: Rect | null;
  activeSkill: string | null;
  /** Skill clicked in the constellation — draws beams to its projects. */
  pinnedSkill: string | null;

  currentSection: SectionId;
  visited: SectionId[];
  narrated: SectionId[];
  opened: string[];
  lastProject: string | null;
  lastVisit: number | null;

  tour: { active: boolean; step: number; total: number };
  achievements: string[];
  toasts: Toast[];
  subtitle: Subtitle | null;
  /** Bumped to trigger a warp jump to a section. */
  warp: { id: number; target: SectionId } | null;
};

type Actions = {
  set: (p: Partial<State>) => void;
  setVoice: (on: boolean) => void;
  toggleSound: () => void;
  setCommandOpen: (open: boolean) => void;
  openCaseFile: (slug: string, origin?: Rect | null) => void;
  closeCaseFile: () => void;
  setActiveSkill: (s: string | null) => void;
  enterSection: (id: SectionId) => void;
  markNarrated: (id: SectionId) => void;
  unlock: (id: string, title: string, body: string) => void;
  dismissToast: (id: number) => void;
  say: (text: string, streaming?: boolean) => void;
  warpTo: (target: SectionId) => void;
};

let seq = 0;

/**
 * Writes are ignored until the first rehydrate has read localStorage, so an
 * early `set()` (e.g. the stage flagging WebGL) can't overwrite saved prefs.
 */
let canWrite = false;
const guardedStorage = {
  getItem: (k: string) => window.localStorage.getItem(k),
  setItem: (k: string, v: string) => {
    if (canWrite) window.localStorage.setItem(k, v);
  },
  removeItem: (k: string) => window.localStorage.removeItem(k),
};

export const useYashu = create<State & Actions>()(
  persist(
    (set, get) => ({
      hydrated: false,
      gl3d: false,
      voice: null,
      sound: false,
      micOn: false,
      listening: false,
      gestures: false,
      overdrive: false,
      stealth: false,
      gesturePrompt: false,
      celebrate: 0,
      commandOpen: false,
      openProject: null,
      portalOrigin: null,
      activeSkill: null,
      pinnedSkill: null,
      currentSection: "hero",
      visited: [],
      narrated: [],
      opened: [],
      lastProject: null,
      lastVisit: null,
      tour: { active: false, step: 0, total: 0 },
      achievements: [],
      toasts: [],
      subtitle: null,
      warp: null,

      set: (p) => set(p),
      setVoice: (on) => set({ voice: on }),
      toggleSound: () => set((s) => ({ sound: !s.sound })),
      setCommandOpen: (open) => set({ commandOpen: open }),
      openCaseFile: (slug, origin = null) =>
        set((s) => ({
          openProject: slug,
          portalOrigin: origin,
          lastProject: slug,
          opened: s.opened.includes(slug) ? s.opened : [...s.opened, slug],
        })),
      closeCaseFile: () => set({ openProject: null }),
      setActiveSkill: (activeSkill) => set({ activeSkill }),
      enterSection: (id) =>
        set((s) => ({ currentSection: id, visited: s.visited.includes(id) ? s.visited : [...s.visited, id] })),
      markNarrated: (id) => set((s) => ({ narrated: [...s.narrated, id] })),
      unlock: (id, title, body) => {
        if (get().achievements.includes(id)) return;
        const toast = { id: ++seq, title, body };
        set((s) => ({ achievements: [...s.achievements, id], toasts: [...s.toasts, toast] }));
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      say: (text, streaming = false) => set({ subtitle: { id: ++seq, text, streaming } }),
      warpTo: (target) => set({ warp: { id: ++seq, target } }),
    }),
    {
      name: "yashu:state:v1",
      // Guarded and `window.`-scoped: the server (Node has its own global localStorage) never writes.
      storage: createJSONStorage(() => guardedStorage),
      onRehydrateStorage: () => () => {
        canWrite = true;
      },
      // Rehydrated manually after mount so SSR markup matches the first client render.
      skipHydration: true,
      partialize: (s) => ({
        voice: s.voice,
        sound: s.sound,
        visited: s.visited,
        opened: s.opened,
        lastProject: s.lastProject,
        lastVisit: s.lastVisit,
        achievements: s.achievements,
      }),
    },
  ),
);

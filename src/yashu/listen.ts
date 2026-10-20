"use client";

import { respond } from "./conversation";
import { stripWake } from "./intents";
import { signals } from "./signals";
import { useYashu } from "./store";
import { stopSpeaking } from "./voice";

/**
 * Speech input via the Web Speech API.
 *  - "once": the next utterance is the command (mic button)
 *  - "wake": stays on; utterances starting with "Hey Yashu" (or a common
 *    mis-hearing) fire, plus a 10s follow-up window after each answer
 *
 * Reliability notes:
 *  - We do NOT open a second getUserMedia stream for the waveform: Safari and
 *    Chrome on Android won't share the mic, so recognition would hear nothing.
 *    The waveform is driven from the recogniser's own speech/result events.
 *  - We ask for 5 alternatives and keep the one the router understands best
 *    ("open Hegel" → "open Haggle").
 *  - Every failure is surfaced with a concrete fix.
 */

type Alt = { transcript: string; confidence?: number };
type RecResult = ArrayLike<Alt> & { isFinal: boolean };
type Rec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { resultIndex: number; results: ArrayLike<RecResult> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onspeechstart: (() => void) | null;
  onsoundstart: (() => void) | null;
  onspeechend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function Ctor(): (new () => Rec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const micSupported = () => Ctor() !== null;

const isBrave = () => typeof navigator !== "undefined" && "brave" in navigator;

const ERRORS: Record<string, string> = {
  "not-allowed": "Microphone is blocked. Click the lock icon in the address bar, allow the microphone, then try again.",
  "service-not-allowed": "This browser blocked speech recognition. Allow the microphone for this site, or use Chrome or Edge.",
  "audio-capture": "I can't find a microphone. Check it's connected and not in use by another app.",
  network: "Speech recognition couldn't reach its service. Brave and some privacy setups block it — try Chrome, Edge or Safari, or type instead.",
  "no-speech": "I didn't hear anything. Speak right after tapping the mic, a little closer to it.",
  "language-not-supported": "Your browser doesn't support Indian-English recognition — switching to US English.",
};

let rec: Rec | null = null;
let wantOn = false;
let lang = "en-IN";
let level = 0;
let levelRaf = 0;
/** Conversation mode: after an answer, follow-ups don't need the wake phrase for a while. */
let followUntil = 0;
let followTimer = 0;
const FOLLOW_MS = 10_000;

function openFollowUp() {
  followUntil = Date.now() + FOLLOW_MS;
  useYashu.getState().set({ followUp: true });
  clearTimeout(followTimer);
  followTimer = window.setTimeout(() => useYashu.getState().set({ followUp: false }), FOLLOW_MS);
}

/** Synthetic mic level from recogniser events (no second mic stream). */
function bump(v: number) {
  level = Math.max(level, v);
  if (levelRaf) return;
  const tick = () => {
    level *= 0.92;
    signals.micLevel = level * (0.75 + Math.random() * 0.25);
    levelRaf = level > 0.02 ? requestAnimationFrame(tick) : 0;
    if (!levelRaf) signals.micLevel = 0;
  };
  levelRaf = requestAnimationFrame(tick);
}

function setListening(on: boolean) {
  signals.listening = on;
  useYashu.getState().set(on ? { listening: true } : { listening: false, heard: "" });
  if (!on) {
    level = 0;
    signals.micLevel = 0;
  }
}

/** Pick the alternative the conversation engine understands best. */
export function bestAlternative(alts: string[]): string {
  const s = useYashu.getState();
  const ctx = { focus: s.focus, section: s.currentSection, openProject: s.openProject };
  let best = alts[0] ?? "";
  let bestScore = -1;
  for (const a of alts) {
    const r = respond(a, ctx);
    const score = r.intent === "fallback" ? 0 : r.confidence + (r.intent === "wake" ? -0.5 : 0);
    if (score > bestScore) {
      best = a;
      bestScore = score;
    }
  }
  return best;
}

function fail(code: string) {
  const msg = ERRORS[code];
  if (!msg) return;
  useYashu.getState().set({ micError: msg });
  useYashu.getState().say(msg);
}

export function startListening(mode: "once" | "wake", onCommand: (text: string) => void) {
  const C = Ctor();
  if (!C) {
    fail("service-not-allowed");
    return;
  }
  stopListening();
  // Pressing the mic interrupts Y.A.S.H.U. — otherwise its voice would mask yours.
  stopSpeaking();
  useYashu.getState().set({ micError: null, heard: "" });
  if (isBrave()) useYashu.getState().say("Heads up: Brave often blocks speech recognition. If nothing happens, try Chrome or Edge.");

  wantOn = true;
  let gotResult = false;
  let errored = false;
  rec = new C();
  rec.lang = lang;
  rec.continuous = mode === "wake";
  rec.interimResults = true;
  rec.maxAlternatives = 5;

  rec.onsoundstart = () => bump(0.35);
  rec.onspeechstart = () => bump(0.7);
  rec.onspeechend = () => bump(0.2);

  rec.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      const alts = Array.from({ length: res.length }, (_, k) => res[k]?.transcript ?? "").filter(Boolean);
      bump(0.6 + Math.random() * 0.3);
      if (!res.isFinal) {
        useYashu.getState().set({ heard: alts[0] ?? "" });
        continue;
      }
      gotResult = true;
      useYashu.getState().set({ heard: "" });
      if (mode === "once") {
        onCommand(bestAlternative(alts));
        continue;
      }
      // Wake mode: ignore Y.A.S.H.U.'s own voice picked up by the mic.
      if (signals.speaking || Date.now() - signals.spokeAt < 900) continue;
      const woke = alts.filter((a) => stripWake(a).woke);
      if (woke.length || Date.now() < followUntil) {
        onCommand(bestAlternative(woke.length ? woke : alts));
        openFollowUp();
      }
    }
  };

  rec.onerror = (e) => {
    if (e.error === "aborted") return;
    if (e.error === "no-speech" && mode === "wake") return; // normal in always-on mode
    errored = true;
    if (e.error === "language-not-supported" && lang !== "en-US") {
      lang = "en-US";
      fail(e.error);
      window.setTimeout(() => startListening(mode, onCommand), 100);
      return;
    }
    if (e.error === "not-allowed" || e.error === "service-not-allowed" || e.error === "audio-capture" || e.error === "network") {
      wantOn = false;
      useYashu.getState().set({ micOn: false });
    }
    fail(e.error);
  };

  rec.onend = () => {
    // Chrome ends continuous sessions after silence; restart while wake mode is on.
    if (wantOn && mode === "wake") {
      try {
        rec?.start();
        return;
      } catch {
        /* fall through */
      }
    }
    if (mode === "once" && !gotResult && !errored) fail("no-speech");
    setListening(false);
    if (mode === "wake") useYashu.getState().set({ micOn: false });
  };

  try {
    rec.start();
    setListening(true);
    bump(0.3);
  } catch {
    setListening(false);
    fail("audio-capture");
  }
  if (mode === "once") wantOn = false;
}

export function stopListening() {
  wantOn = false;
  followUntil = 0;
  useYashu.getState().set({ followUp: false });
  try {
    rec?.abort();
  } catch {
    /* already stopped */
  }
  rec = null;
  setListening(false);
}

"use client";

import { closeMicAnalyser, openMicAnalyser } from "./audio";
import { stripWake } from "./intents";
import { signals } from "./signals";
import { useYashu } from "./store";

type Rec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function Ctor(): (new () => Rec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const micSupported = () => Ctor() !== null;

let rec: Rec | null = null;
let wantOn = false;
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

function setListening(on: boolean) {
  signals.listening = on;
  useYashu.getState().set({ listening: on });
  if (on) void openMicAnalyser();
  else closeMicAnalyser();
}

/**
 * Listen for speech.
 *  - mode "once": the next utterance is the command (mic button / Cmd+K).
 *  - mode "wake": stays on; only utterances starting with "Hey Yashu" fire.
 */
export function startListening(mode: "once" | "wake", onCommand: (text: string) => void) {
  const C = Ctor();
  if (!C) return;
  stopListening();
  wantOn = true;
  rec = new C();
  rec.lang = "en-IN";
  rec.continuous = mode === "wake";
  rec.interimResults = false;
  rec.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      if (!res.isFinal) continue;
      const transcript = res[0]?.transcript ?? "";
      // Don't treat Y.A.S.H.U.'s own voice, picked up by the mic, as a command.
      if (signals.speaking || Date.now() - signals.spokeAt < 900) continue;
      if (mode === "once") {
        onCommand(transcript);
        continue;
      }
      const { woke } = stripWake(transcript);
      if (woke || Date.now() < followUntil) {
        onCommand(transcript);
        openFollowUp();
      }
    }
  };
  rec.onerror = (e) => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      wantOn = false;
      useYashu.getState().set({ micOn: false });
      useYashu.getState().say("Microphone access was blocked — you can still type commands.");
    }
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
    setListening(false);
    if (mode === "wake") useYashu.getState().set({ micOn: false });
  };
  try {
    rec.start();
    setListening(true);
  } catch {
    setListening(false);
  }
  if (mode === "once") wantOn = false;
}

export function stopListening() {
  wantOn = false;
  followUntil = 0;
  useYashu.getState().set({ followUp: false });
  try {
    rec?.stop();
  } catch {
    /* already stopped */
  }
  rec = null;
  setListening(false);
}

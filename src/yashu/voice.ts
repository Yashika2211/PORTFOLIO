"use client";

import { useMemo } from "react";
import { getAudioContext, getVoiceAnalyser, startPump } from "./audio";
import { signals } from "./signals";
import { useYashu } from "./store";

/**
 * Y.A.S.H.U.'s voice. Two providers behind one interface:
 *  1. "browser": speechSynthesis (default, free, offline-capable)
 *  2. "premium": /api/tts (server-side key) — decoded and routed through an
 *     AnalyserNode so the core reacts to the real voice amplitude.
 * Every line is ALWAYS mirrored to the subtitle panel; audio only plays once
 * the visitor has opted in.
 */

type Provider = "browser" | "premium";

let premium: boolean | null = null;
let current: { stop: () => void } | null = null;
const memCache = new Map<string, AudioBuffer>();

// ---------- IndexedDB cache for premium audio ----------
const DB = "yashu-tts";
function idb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore("lines");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}
async function idbGet(key: string): Promise<ArrayBuffer | null> {
  const db = await idb();
  if (!db) return null;
  return new Promise((resolve) => {
    const r = db.transaction("lines").objectStore("lines").get(key);
    r.onsuccess = () => resolve((r.result as ArrayBuffer) ?? null);
    r.onerror = () => resolve(null);
  });
}
async function idbPut(key: string, buf: ArrayBuffer) {
  const db = await idb();
  db?.transaction("lines", "readwrite").objectStore("lines").put(buf, key);
}

async function premiumAvailable(): Promise<boolean> {
  if (premium !== null) return premium;
  try {
    const r = await fetch("/api/tts");
    premium = r.ok && ((await r.json()) as { enabled: boolean }).enabled;
  } catch {
    premium = false;
  }
  return premium;
}

// ---------- Browser provider ----------
function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const score = (v: SpeechSynthesisVoice) =>
    (/en[-_]IN/i.test(v.lang) ? 40 : /en[-_]GB/i.test(v.lang) ? 30 : /^en/i.test(v.lang) ? 10 : 0) +
    (/natural|neural|premium|enhanced|google/i.test(v.name) ? 8 : 0) +
    (v.localService ? 1 : 0);
  return [...voices].sort((a, b) => score(b) - score(a))[0];
}

function speakBrowser(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve();
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.pitch = 0.95;
    u.rate = 1.02;
    const v = pickVoice();
    if (v) u.voice = v;

    // speechSynthesis exposes no audio stream, so synthesize a speech-shaped
    // envelope from word boundaries for the audio-reactive core.
    let level = 0;
    let raf = 0;
    const tick = () => {
      level *= 0.9;
      signals.voiceLevel = Math.max(0.12, level) * (0.8 + Math.random() * 0.4);
      for (let b = 0; b < 16; b++) signals.bands[b] = signals.voiceLevel * (0.4 + 0.6 * Math.abs(Math.sin(performance.now() / 90 + b)));
      raf = requestAnimationFrame(tick);
    };
    const done = () => {
      cancelAnimationFrame(raf);
      signals.speaking = false;
      signals.voiceLevel = 0;
      signals.bands.fill(0);
      resolve();
    };
    u.onstart = () => {
      signals.speaking = true;
      raf = requestAnimationFrame(tick);
    };
    u.onboundary = () => (level = 0.7 + Math.random() * 0.3);
    u.onend = done;
    u.onerror = done;
    current = { stop: () => synth.cancel() };
    synth.speak(u);
  });
}

// ---------- Premium provider ----------
async function speakPremium(text: string): Promise<boolean> {
  const c = getAudioContext();
  const analyser = getVoiceAnalyser();
  if (!c || !analyser) return false;
  let buffer = memCache.get(text);
  if (!buffer) {
    let bytes = await idbGet(text);
    if (!bytes) {
      const r = await fetch("/api/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!r.ok) return false;
      bytes = await r.arrayBuffer();
      void idbPut(text, bytes.slice(0));
    }
    buffer = await c.decodeAudioData(bytes.slice(0));
    memCache.set(text, buffer);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  src.connect(analyser);
  startPump();
  signals.speaking = true;
  current = { stop: () => src.stop() };
  await new Promise<void>((resolve) => {
    src.onended = () => resolve();
    src.start();
  });
  signals.speaking = false;
  signals.voiceLevel = 0;
  signals.bands.fill(0);
  return true;
}

export function stopSpeaking() {
  current?.stop();
  current = null;
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

/** Speak a line (if voice is on) and always show it as a subtitle. */
export async function speakLine(text: string): Promise<Provider | null> {
  const { voice, say } = useYashu.getState();
  say(text);
  if (voice !== true) return null;
  stopSpeaking();
  const setMode = (mode: "idle" | "speaking") => useYashu.getState().set({ mode });
  setMode("speaking");
  try {
    if (await premiumAvailable()) {
      if (await speakPremium(text)) return "premium";
    }
    await speakBrowser(text);
    return "browser";
  } catch {
    await speakBrowser(text);
    return "browser";
  } finally {
    setMode("idle");
    signals.spokeAt = Date.now();
  }
}

export function useYashuVoice() {
  const enabled = useYashu((s) => s.voice === true);
  return useMemo(
    () => ({
      enabled,
      speak: speakLine,
      stop: stopSpeaking,
      supported: typeof window !== "undefined" && "speechSynthesis" in window,
    }),
    [enabled],
  );
}

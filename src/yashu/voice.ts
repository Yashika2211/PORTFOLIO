"use client";

import { useMemo } from "react";
import { getAudioContext, getVoiceAnalyser, startPump } from "./audio";
import { signals } from "./signals";
import { chunkSentences, toSpeech } from "./speech-text";
import { useYashu } from "./store";
import { femaleVoices, rankVoices } from "./voices";

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
type VoicePrefs = { name?: string; rate?: number };
const PREFS_KEY = "yashu:voice:v1";

export function getVoicePrefs(): VoicePrefs {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}") as VoicePrefs;
  } catch {
    return {};
  }
}
export function setVoicePrefs(p: VoicePrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...getVoicePrefs(), ...p }));
  } catch {
    /* ignore */
  }
}

/** speechSynthesis loads voices asynchronously; wait (briefly) until they exist. */
export function loadVoices(timeout = 1500): Promise<SpeechSynthesisVoice[]> {
  if (!("speechSynthesis" in window)) return Promise.resolve([]);
  const synth = window.speechSynthesis;
  const now = synth.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => {
      synth.removeEventListener("voiceschanged", done);
      clearInterval(poll);
      clearTimeout(timer);
      resolve(synth.getVoices());
    };
    synth.addEventListener("voiceschanged", done);
    const poll = window.setInterval(() => synth.getVoices().length && done(), 100);
    const timer = window.setTimeout(done, timeout);
  });
}

/** Female voices available on this device, best first. */
export async function listFemaleVoices() {
  return femaleVoices(await loadVoices());
}

function chooseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const { name } = getVoicePrefs();
  const picked = name ? voices.find((v) => v.name === name) : undefined;
  return picked ?? femaleVoices(voices)[0] ?? rankVoices(voices)[0];
}

/**
 * iOS/Safari only allow speech that starts inside a user gesture. Call this
 * synchronously from the click that enables voice; later lines then play.
 */
export function primeSpeech() {
  getAudioContext();
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(" ");
  u.volume = 0;
  window.speechSynthesis.speak(u);
}

async function speakBrowser(text: string, opts: { voiceName?: string } = {}): Promise<void> {
  if (!("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  const voices = await loadVoices();
  const voice = opts.voiceName ? voices.find((v) => v.name === opts.voiceName) : chooseVoice(voices);
  const rate = getVoicePrefs().rate ?? 1;
  const chunks = chunkSentences(toSpeech(text));
  synth.cancel();
  let cancelled = false;
  current = {
    stop: () => {
      cancelled = true;
      synth.cancel();
    },
  };

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
  // Chrome stalls long speech queues unless nudged.
  const keepAlive = window.setInterval(() => synth.speaking && !synth.paused && synth.resume(), 9000);

  signals.speaking = true;
  raf = requestAnimationFrame(tick);
  try {
    for (const chunk of chunks) {
      if (cancelled) break;
      await new Promise<void>((resolve) => {
        const u = new SpeechSynthesisUtterance(chunk);
        if (voice) {
          u.voice = voice;
          u.lang = voice.lang;
        }
        u.rate = rate;
        u.pitch = 1;
        u.onboundary = () => (level = 0.7 + Math.random() * 0.3);
        u.onend = () => resolve();
        u.onerror = () => resolve();
        // Safety net: some engines never fire onend.
        window.setTimeout(resolve, 1500 + chunk.length * 110);
        synth.speak(u);
      });
    }
  } finally {
    clearInterval(keepAlive);
    cancelAnimationFrame(raf);
    signals.speaking = false;
    signals.voiceLevel = 0;
    signals.bands.fill(0);
  }
}

/** Speak a sample line in a given voice (voice picker preview). */
export function previewVoice(name: string) {
  primeSpeech();
  void speakBrowser("Hello. I'm Yashu, Yashika's assistant. This is how I'll sound.", { voiceName: name });
}

// ---------- Premium provider ----------
async function speakPremium(line: string): Promise<boolean> {
  const text = toSpeech(line);
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

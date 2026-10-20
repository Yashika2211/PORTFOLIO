"use client";

import { signals } from "./signals";

/** One shared AudioContext for voice analysis and UI sound design. (Mic level comes from the recogniser — see listen.ts.) */
let ctx: AudioContext | null = null;
let voiceAnalyser: AnalyserNode | null = null;
let raf = 0;

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Analyser that premium-TTS audio is routed through before the speakers. */
export function getVoiceAnalyser(): AnalyserNode | null {
  const c = getAudioContext();
  if (!c) return null;
  if (!voiceAnalyser) {
    voiceAnalyser = c.createAnalyser();
    voiceAnalyser.fftSize = 256;
    voiceAnalyser.smoothingTimeConstant = 0.7;
    voiceAnalyser.connect(c.destination);
  }
  return voiceAnalyser;
}

const freq = new Uint8Array(128);

/** Per-frame pump: copies analyser data into `signals` for the shaders. */
function pump() {
  if (voiceAnalyser && signals.speaking) {
    voiceAnalyser.getByteFrequencyData(freq);
    let sum = 0;
    for (let b = 0; b < 16; b++) {
      // Speech energy lives in the low-mid bins; spread 16 bands over the first 64.
      let v = 0;
      for (let k = 0; k < 4; k++) v += freq[b * 4 + k];
      signals.bands[b] = v / (4 * 255);
      sum += signals.bands[b];
    }
    signals.voiceLevel = Math.min(1, (sum / 16) * 2.2);
  }
  raf = requestAnimationFrame(pump);
}

export function startPump() {
  if (!raf && typeof window !== "undefined") raf = requestAnimationFrame(pump);
}

"use client";

/**
 * Tiny synthesized UI sounds via Web Audio — no audio files to download.
 * Every call is a no-op unless sound has been enabled by the visitor.
 */

type Tone = "hover" | "click" | "open" | "close" | "boot";

const TONES: Record<Tone, { freq: number; to: number; dur: number; type: OscillatorType; gain: number }> = {
  hover: { freq: 1400, to: 1800, dur: 0.04, type: "sine", gain: 0.025 },
  click: { freq: 620, to: 920, dur: 0.08, type: "triangle", gain: 0.05 },
  open: { freq: 320, to: 980, dur: 0.22, type: "sawtooth", gain: 0.03 },
  close: { freq: 900, to: 260, dur: 0.18, type: "sawtooth", gain: 0.03 },
  boot: { freq: 110, to: 660, dur: 0.6, type: "sine", gain: 0.06 },
};

let ctx: AudioContext | null = null;
let enabled = false;

export function setSoundEnabled(on: boolean) {
  enabled = on;
  if (on && !ctx && typeof window !== "undefined") {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (on) void ctx?.resume();
}

export function playSound(tone: Tone) {
  if (!enabled || !ctx) return;
  const t = TONES[tone];
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = t.type;
  osc.frequency.setValueAtTime(t.freq, now);
  osc.frequency.exponentialRampToValueAtTime(t.to, now + t.dur);
  gain.gain.setValueAtTime(t.gain, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + t.dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + t.dur + 0.02);
}

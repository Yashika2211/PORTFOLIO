"use client";

import { getAudioContext } from "@/yashu/audio";

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

let enabled = false;

export function setSoundEnabled(on: boolean) {
  enabled = on;
  setAmbientHum(on);
}

export function playSound(tone: Tone) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
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

/** Filtered noise sweep for warp jumps. */
export function playWhoosh() {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const dur = 1.1;
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 1.2;
  const now = ctx.currentTime;
  filter.frequency.setValueAtTime(200, now);
  filter.frequency.exponentialRampToValueAtTime(3200, now + dur * 0.45);
  filter.frequency.exponentialRampToValueAtTime(300, now + dur);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.35);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(now);
}

/** Glassy arpeggio for holograms materializing. */
export function playShimmer() {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  [1760, 2217, 2637, 3520].forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = f;
    const t = now + i * 0.045;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.012, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  });
}

let hum: { stop: () => void } | null = null;

/** Low ambient hum: two detuned oscillators through a slow-breathing lowpass. */
export function setAmbientHum(on: boolean) {
  if (!on || !enabled) {
    hum?.stop();
    hum = null;
    return;
  }
  if (hum) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, ctx.currentTime);
  master.gain.exponentialRampToValueAtTime(0.03, ctx.currentTime + 2);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 320;
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.12;
  lfoGain.gain.value = 120;
  lfo.connect(lfoGain).connect(filter.frequency);
  const oscs = [55, 55.4, 110.3].map((f) => {
    const o = ctx.createOscillator();
    o.type = f > 100 ? "triangle" : "sawtooth";
    o.frequency.value = f;
    o.connect(filter);
    o.start();
    return o;
  });
  filter.connect(master).connect(ctx.destination);
  lfo.start();
  hum = {
    stop: () => {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      window.setTimeout(() => {
        oscs.forEach((o) => o.stop());
        lfo.stop();
      }, 700);
    },
  };
}

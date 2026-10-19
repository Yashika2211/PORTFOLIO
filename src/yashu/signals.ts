/**
 * Mutable per-frame signals shared between the DOM and the WebGL scenes.
 * Written by audio/pointer code, read inside useFrame — never triggers React renders.
 */
export const signals = {
  /** 0–1 speech amplitude of Y.A.S.H.U.'s voice. */
  voiceLevel: 0,
  /** 16 frequency bands (0–1) for the equalizer ring. */
  bands: new Float32Array(16),
  speaking: false,
  /** Mic is open and listening for a command. */
  listening: false,
  /** 0–1 mic input level, drives the listening waveform. */
  micLevel: 0,
  /** Smoothed energy actually applied to the core. */
  energy: 0,
  pointer: { x: 0, y: 0 },
  /** Device tilt (−1..1) when the visitor enables motion parallax. */
  tilt: { x: 0, y: 0, enabled: false },
  /** 0–1 page scroll progress, drives the camera path. */
  scroll: 0,
  /** 0–1 warp streak intensity. */
  warp: 0,
  /** Glitch pulse 0–1 (hero return). */
  glitch: 0,
};

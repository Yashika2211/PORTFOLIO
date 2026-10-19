"use client";

import { signals } from "./signals";

type OrientationCtor = { requestPermission?: () => Promise<"granted" | "denied"> };

let listening = false;

function onOrient(e: DeviceOrientationEvent) {
  // gamma: left/right (−90..90), beta: front/back (−180..180); ~30° of travel = full range.
  signals.tilt.x = Math.max(-1, Math.min(1, (e.gamma ?? 0) / 30));
  signals.tilt.y = Math.max(-1, Math.min(1, ((e.beta ?? 45) - 45) / 30));
}

export const tiltSupported = () => typeof window !== "undefined" && "DeviceOrientationEvent" in window;

/** Opt-in device-tilt parallax. iOS requires a permission prompt from a user gesture. */
export async function enableTilt(): Promise<boolean> {
  if (!tiltSupported()) return false;
  const Ctor = window.DeviceOrientationEvent as unknown as OrientationCtor;
  if (typeof Ctor.requestPermission === "function") {
    try {
      if ((await Ctor.requestPermission()) !== "granted") return false;
    } catch {
      return false;
    }
  }
  if (!listening) window.addEventListener("deviceorientation", onOrient);
  listening = true;
  signals.tilt.enabled = true;
  return true;
}

export function disableTilt() {
  window.removeEventListener("deviceorientation", onOrient);
  listening = false;
  signals.tilt.enabled = false;
  signals.tilt.x = signals.tilt.y = 0;
}

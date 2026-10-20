"use client";

import { sections } from "@/data/portfolio";
import { stopTour } from "./tour";
import { useYashu } from "./store";
import { speakLine, stopSpeaking } from "./voice";

/**
 * Optional hand-gesture control (MediaPipe Hands), loaded only after the
 * visitor grants camera access. Frames are processed on-device; nothing is
 * uploaded. Gestures: open palm = pause, swipe = next/previous section,
 * pinch = open the focused / centred card.
 */

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm";
const MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

type Pt = { x: number; y: number; z: number };
export const HAND_EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];

let stream: MediaStream | null = null;
let raf = 0;
let running = false;
let closeLandmarker: (() => void) | null = null;

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

function openPalm(h: Pt[]) {
  // Every fingertip further from the wrist than its middle joint.
  return [8, 12, 16, 20].every((tip) => dist(h[tip], h[0]) > dist(h[tip - 2], h[0]) * 1.15) && dist(h[4], h[17]) > dist(h[5], h[17]);
}
const pinch = (h: Pt[]) => dist(h[4], h[8]) < dist(h[5], h[0]) * 0.28;

function step(dir: 1 | -1) {
  const s = useYashu.getState();
  const i = sections.findIndex((x) => x.id === s.currentSection);
  const next = sections[Math.max(0, Math.min(sections.length - 1, i + dir))];
  if (next.id !== s.currentSection) s.warpTo(next.id);
}

function activateFocused() {
  const active = document.activeElement as HTMLElement | null;
  if (active && active !== document.body && active.matches("button, a")) return active.click();
  // Otherwise the case file closest to the viewport centre.
  const mid = window.innerHeight / 2;
  const cards = [...document.querySelectorAll<HTMLElement>("[data-case] button")];
  const best = cards.sort((a, b) => Math.abs(a.getBoundingClientRect().top - mid) - Math.abs(b.getBoundingClientRect().top - mid))[0];
  best?.click();
}

export async function startGestures(video: HTMLVideoElement, onHand: (pts: Pt[] | null) => void): Promise<void> {
  if (running) return;
  stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: "user" }, audio: false });
  video.srcObject = stream;
  await video.play();
  const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
  const fileset = await FilesetResolver.forVisionTasks(WASM);
  const landmarker = await HandLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL, delegate: "GPU" },
    runningMode: "VIDEO",
    numHands: 1,
  });
  closeLandmarker = () => landmarker.close();
  running = true;

  let palmSince = 0;
  let pinched = false;
  let cooldown = 0;
  const xs: { x: number; t: number }[] = [];

  const loop = () => {
    if (!running) return;
    const now = performance.now();
    if (video.readyState >= 2) {
      const res = landmarker.detectForVideo(video, now);
      const h = res.landmarks?.[0] as Pt[] | undefined;
      onHand(h ?? null);
      if (h && now > cooldown) {
        // Swipe: wrist travels > 35% of the frame width within 350ms.
        xs.push({ x: h[0].x, t: now });
        while (xs.length && now - xs[0].t > 350) xs.shift();
        const dx = xs[xs.length - 1].x - xs[0].x;
        if (Math.abs(dx) > 0.35) {
          // Camera frames are mirrored relative to the visitor: hand moving right reads as negative x.
          step(dx < 0 ? 1 : -1);
          cooldown = now + 900;
          xs.length = 0;
        } else if (openPalm(h)) {
          palmSince ||= now;
          if (now - palmSince > 600) {
            stopTour("interrupted");
            stopSpeaking();
            useYashu.getState().say("Paused. Swipe to move, pinch to open.");
            cooldown = now + 1500;
            palmSince = 0;
          }
        } else palmSince = 0;

        const p = pinch(h);
        if (p && !pinched) {
          activateFocused();
          cooldown = now + 800;
        }
        pinched = p;
      } else if (!h) {
        palmSince = 0;
        xs.length = 0;
      }
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  void speakLine("Gesture control online. Open palm pauses, swipe changes section, pinch opens.");
}

export function stopGestures() {
  running = false;
  cancelAnimationFrame(raf);
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  closeLandmarker?.();
  closeLandmarker = null;
}

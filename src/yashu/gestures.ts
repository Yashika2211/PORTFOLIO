"use client";

import { sections } from "@/data/portfolio";
import { startTour, stopTour } from "./tour";
import { useYashu } from "./store";
import { speakLine, stopSpeaking } from "./voice";

/**
 * Hand-gesture control on MediaPipe's trained GestureRecognizer (on-device;
 * frames never leave the browser). Built for reliability:
 *  - classifier labels must be stable for several frames before they count
 *  - the air cursor is smoothed with a One-Euro filter (steady when still, quick when moving)
 *  - pinch uses hand-size-normalised distance with hysteresis (no double clicks)
 *  - holds show progress; every action has a cooldown
 *
 *  ☝️ point = air cursor · 🤏 pinch = click · ✊ fist = grab & scroll
 *  🖐 hold = pause · 🖐 swipe = next/previous section · 👍 hold = open · ✌️ hold = tour
 */

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm";
const MODEL = "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";

export type Pt = { x: number; y: number; z: number };
export type GestureName = "none" | "point" | "pinch" | "fist" | "palm" | "thumbs" | "victory";
export type GestureFrame = {
  landmarks: Pt[] | null;
  /** Air cursor in viewport pixels. */
  cursor: { x: number; y: number; visible: boolean; pressed: boolean };
  gesture: GestureName;
  /** 0–1 progress of the current hold gesture. */
  hold: number;
  /** Set on the frame an action fires. */
  action?: string;
};

export const HAND_EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];

// ---------- One-Euro filter ----------
class OneEuro {
  private x: number | null = null;
  private dx = 0;
  constructor(private minCutoff = 1.2, private beta = 0.02, private dCutoff = 1) {}
  private alpha(cutoff: number, dt: number) {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dt);
  }
  filter(v: number, dt: number) {
    if (this.x === null) return (this.x = v);
    const d = (v - this.x) / dt;
    this.dx += this.alpha(this.dCutoff, dt) * (d - this.dx);
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
    this.x += this.alpha(cutoff, dt) * (v - this.x);
    return this.x;
  }
  reset() {
    this.x = null;
    this.dx = 0;
  }
}

const LABELS: Record<string, GestureName> = {
  Pointing_Up: "point",
  Closed_Fist: "fist",
  Open_Palm: "palm",
  Thumb_Up: "thumbs",
  Victory: "victory",
};
const STABLE_FRAMES = 4;
const HOLD_MS: Partial<Record<GestureName, number>> = { palm: 800, thumbs: 650, victory: 900 };

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

const INTERACTIVE = "a[href], button:not([disabled]), [role='button'], input, textarea, [data-case] button";

let stream: MediaStream | null = null;
let raf = 0;
let running = false;
let closeRecognizer: (() => void) | null = null;
let hovered: HTMLElement | null = null;
let restoreConsole: (() => void) | null = null;

function setHovered(el: HTMLElement | null) {
  if (hovered === el) return;
  hovered?.removeAttribute("data-gesture-hover");
  hovered = el;
  hovered?.setAttribute("data-gesture-hover", "");
}

function stepSection(dir: 1 | -1) {
  const s = useYashu.getState();
  const i = sections.findIndex((x) => x.id === s.currentSection);
  const next = sections[Math.max(0, Math.min(sections.length - 1, i + dir))];
  if (next.id !== s.currentSection) s.warpTo(next.id);
}

function activate(x: number, y: number): string {
  const el = (document.elementFromPoint(x, y) as HTMLElement | null)?.closest<HTMLElement>(INTERACTIVE);
  if (el) {
    el.focus({ preventScroll: true });
    el.click();
    return `clicked ${el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 28) ?? "element"}`;
  }
  return "nothing there";
}

export async function startGestures(video: HTMLVideoElement, onFrame: (f: GestureFrame) => void): Promise<void> {
  if (running) return;
  stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" }, audio: false });
  video.srcObject = stream;
  await video.play();
  const { FilesetResolver, GestureRecognizer } = await import("@mediapipe/tasks-vision");
  // MediaPipe's wasm logs routine "INFO:" lines through console.error; drop only those.
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].startsWith("INFO:")) return;
    origError(...args);
  };
  restoreConsole = () => (console.error = origError);
  const fileset = await FilesetResolver.forVisionTasks(WASM);
  const recognizer = await GestureRecognizer.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL, delegate: "GPU" },
    runningMode: "VIDEO",
    numHands: 1,
    minHandDetectionConfidence: 0.6,
    minHandPresenceConfidence: 0.6,
    minTrackingConfidence: 0.5,
  });
  closeRecognizer = () => recognizer.close();
  running = true;

  const fx = new OneEuro();
  const fy = new OneEuro();
  let last = performance.now();
  let candidate: GestureName = "none";
  let candidateFrames = 0;
  let gesture: GestureName = "none";
  let holdStart = 0;
  let holdFired = false;
  let pinched = false;
  let cooldown = 0;
  let grabY: number | null = null;
  const palmXs: { x: number; t: number }[] = [];

  const loop = () => {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    const now = performance.now();
    if (now - last < 30 || video.readyState < 2) return; // ~30 fps is plenty
    const dt = Math.max(0.016, (now - last) / 1000);
    last = now;

    const res = recognizer.recognizeForVideo(video, now);
    const h = res.landmarks?.[0] as Pt[] | undefined;
    const frame: GestureFrame = { landmarks: h ?? null, cursor: { x: 0, y: 0, visible: false, pressed: false }, gesture: "none", hold: 0 };

    if (!h) {
      fx.reset();
      fy.reset();
      candidate = gesture = "none";
      candidateFrames = 0;
      grabY = null;
      palmXs.length = 0;
      pinched = false;
      setHovered(null);
      onFrame(frame);
      return;
    }

    // Hand scale (wrist → middle-finger knuckle) normalises distances across camera depth.
    const scale = dist(h[0], h[9]) || 0.1;
    const pinchRatio = dist(h[4], h[8]) / scale;
    // Hysteresis: press under 0.28, release over 0.42.
    const isPinch = pinched ? pinchRatio < 0.42 : pinchRatio < 0.28;

    // Stable classifier label.
    const top = res.gestures?.[0]?.[0];
    const raw: GestureName = isPinch ? "pinch" : top && top.score > 0.6 ? (LABELS[top.categoryName] ?? "none") : "none";
    if (raw === candidate) candidateFrames++;
    else {
      candidate = raw;
      candidateFrames = 1;
    }
    if (candidateFrames >= (raw === "pinch" ? 2 : STABLE_FRAMES) && gesture !== candidate) {
      gesture = candidate;
      holdStart = now;
      holdFired = false;
    }
    frame.gesture = gesture;

    // Air cursor from the index fingertip; the central 70% of the frame maps to the full viewport.
    const map = (v: number) => Math.min(1, Math.max(0, (v - 0.15) / 0.7));
    const cx = fx.filter(map(1 - h[8].x), dt) * window.innerWidth;
    const cy = fy.filter(map(h[8].y), dt) * window.innerHeight;
    const showCursor = gesture === "point" || gesture === "pinch" || gesture === "none" || gesture === "thumbs";
    frame.cursor = { x: cx, y: cy, visible: showCursor, pressed: isPinch };
    setHovered(showCursor ? ((document.elementFromPoint(cx, cy) as HTMLElement | null)?.closest<HTMLElement>(INTERACTIVE) ?? null) : null);

    // Pinch → click (edge-triggered).
    if (isPinch && !pinched && now > cooldown) {
      frame.action = activate(cx, cy);
      cooldown = now + 500;
    }
    pinched = isPinch;

    // Fist → grab and scroll with vertical hand movement.
    const palmY = (h[0].y + h[9].y) / 2;
    if (gesture === "fist") {
      if (grabY !== null) window.scrollBy({ top: (palmY - grabY) * window.innerHeight * 2.4, behavior: "instant" as ScrollBehavior });
      grabY = palmY;
    } else grabY = null;

    // Open palm → swipe (fast horizontal travel) or hold to pause.
    const palmX = 1 - (h[0].x + h[9].x) / 2;
    if (gesture === "palm") {
      palmXs.push({ x: palmX, t: now });
      while (palmXs.length && now - palmXs[0].t > 300) palmXs.shift();
      const dx = palmXs.length > 2 ? palmXs[palmXs.length - 1].x - palmXs[0].x : 0;
      if (Math.abs(dx) > 0.22 && now > cooldown) {
        stepSection(dx > 0 ? 1 : -1);
        frame.action = dx > 0 ? "next section" : "previous section";
        cooldown = now + 1100;
        palmXs.length = 0;
        holdStart = now; // a swipe isn't a hold
      }
    } else palmXs.length = 0;

    // Hold gestures with progress.
    const need = HOLD_MS[gesture];
    if (need && !holdFired && now > cooldown) {
      frame.hold = Math.min(1, (now - holdStart) / need);
      if (frame.hold >= 1) {
        holdFired = true;
        cooldown = now + 900;
        if (gesture === "palm") {
          stopTour("interrupted");
          stopSpeaking();
          frame.action = "paused";
        } else if (gesture === "thumbs") {
          const s = useYashu.getState();
          if (hovered) frame.action = activate(cx, cy);
          else if (s.focus && !s.openProject) {
            s.openCaseFile(s.focus);
            frame.action = "opened case file";
          } else frame.action = "noted 👍";
        } else if (gesture === "victory") {
          startTour();
          frame.action = "tour started";
        }
      }
    }
    onFrame(frame);
  };
  raf = requestAnimationFrame(loop);
  void speakLine("Gesture control online. Point to aim, pinch to click, make a fist to scroll, hold an open palm to pause.");
}

export function stopGestures() {
  running = false;
  cancelAnimationFrame(raf);
  setHovered(null);
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  closeRecognizer?.();
  closeRecognizer = null;
  restoreConsole?.();
  restoreConsole = null;
}

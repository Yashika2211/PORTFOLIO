"use client";

/** Thin wrappers around the Web Speech API with feature detection. */

type RecognitionResultEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };

type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const speechInputSupported = () => getRecognitionCtor() !== null;
export const speechOutputSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;

/** Listen for one utterance. Resolves with the transcript, rejects on error. */
export function listenOnce(): { promise: Promise<string>; stop: () => void } {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return { promise: Promise.reject(new Error("unsupported")), stop: () => {} };
  const rec = new Ctor();
  rec.lang = "en-IN";
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  const promise = new Promise<string>((resolve, reject) => {
    let done = false;
    rec.onresult = (e) => {
      done = true;
      resolve(e.results[0]?.[0]?.transcript ?? "");
    };
    rec.onerror = (e) => {
      done = true;
      reject(new Error(e.error));
    };
    rec.onend = () => {
      if (!done) reject(new Error("no-speech"));
    };
    rec.start();
  });
  return { promise, stop: () => rec.stop() };
}

/** Speak a short reply. Calls onStart/onEnd so the 3D core can pulse in sync. */
export function speak(text: string, hooks: { onStart?: () => void; onEnd?: () => void } = {}) {
  if (!speechOutputSupported()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.05;
  u.pitch = 1.05;
  const voice = synth.getVoices().find((v) => /en[-_](IN|GB|US)/i.test(v.lang));
  if (voice) u.voice = voice;
  u.onstart = () => hooks.onStart?.();
  u.onend = () => hooks.onEnd?.();
  u.onerror = () => hooks.onEnd?.();
  synth.speak(u);
}

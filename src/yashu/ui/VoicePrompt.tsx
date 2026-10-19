"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useYashu } from "../store";
import { speakLine } from "../voice";
import { greeting } from "../lines";

/** First-visit opt-in: voice stays off until the visitor engages it. */
export function VoicePrompt({ ready }: { ready: boolean }) {
  const show = useYashu((s) => s.hydrated && s.voice === null) && ready;
  const setVoice = useYashu((s) => s.setVoice);

  const choose = (on: boolean) => {
    setVoice(on);
    void speakLine(on ? `Voice interface engaged. ${greeting()}` : "Silent mode. Subtitles only — I'll keep it brief.");
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="dialog"
          aria-modal="false"
          aria-labelledby="voice-prompt-title"
          className="glass fixed bottom-24 left-1/2 z-[70] md:bottom-8 w-[min(440px,calc(100vw-32px))] -translate-x-1/2 p-5 text-center"
          initial={{ opacity: 0, y: 24, scaleY: 0.2 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          exit={{ opacity: 0, y: 12, scaleY: 0.4 }}
          transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <p className="hud-label mb-1 text-amber">Y.A.S.H.U. // audio channel</p>
          <p id="voice-prompt-title" className="font-display text-lg uppercase tracking-wide text-ink">
            Enable voice interface?
          </p>
          <p className="mt-1 text-sm text-muted">Spoken replies plus subtitles. You can change this any time in the HUD.</p>
          <div className="mt-4 flex justify-center gap-3">
            <button type="button" className="btn-energy amber" onClick={() => choose(true)} autoFocus>
              [ Engage ]
            </button>
            <button type="button" className="btn-energy" onClick={() => choose(false)}>
              [ Silent mode ]
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { playSound } from "@/lib/sound";
import { useYashu } from "../store";

function Toast({ id, title, body }: { id: number; title: string; body: string }) {
  const dismiss = useYashu((s) => s.dismissToast);
  useEffect(() => {
    playSound("open");
    const t = window.setTimeout(() => dismiss(id), 4800);
    return () => clearTimeout(t);
  }, [id, dismiss]);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: 40, scaleY: 0.3 }}
      animate={{ opacity: 1, x: 0, scaleY: 1 }}
      exit={{ opacity: 0, x: 30 }}
      className="glass pointer-events-auto flex w-72 items-start gap-3 border-amber/50 p-3"
    >
      <svg viewBox="0 0 24 24" className="mt-0.5 h-6 w-6 shrink-0 text-amber" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M12 2 20 7v10l-8 5-8-5V7z" />
        <path d="m8.5 12 2.5 2.5 4.5-5" />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="hud-label text-amber">Achievement unlocked</p>
        <p className="font-display text-sm font-bold uppercase tracking-wide text-ink">{title}</p>
        <p className="text-xs text-muted">{body}</p>
      </div>
      <button type="button" onClick={() => dismiss(id)} className="font-mono text-xs text-muted hover:text-ink" aria-label={`Dismiss ${title}`}>
        ✕
      </button>
    </motion.li>
  );
}

/** Achievement unlock toasts, announced politely to screen readers. */
export function Toasts() {
  const toasts = useYashu((s) => s.toasts);
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed right-4 top-20 z-[75] sm:right-8">
      <ol className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <Toast key={t.id} {...t} />
          ))}
        </AnimatePresence>
      </ol>
    </div>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { projects } from "@/data/portfolio";
import { exitIntent } from "../lines";
import { useYashu } from "../store";
import { speakLine } from "../voice";

const KEY = "yashu:exit-shown";

/** Desktop-only, once per session: a dismissible spotlight when the cursor heads for the tab bar. */
export function ExitIntent({ ready }: { ready: boolean }) {
  const [open, setOpen] = useState(false);
  const best = projects[0];

  useEffect(() => {
    if (!ready || !window.matchMedia("(pointer: fine)").matches) return;
    let armed = false;
    const arm = window.setTimeout(() => (armed = true), 15_000); // never on a quick visit
    const onOut = (e: MouseEvent) => {
      if (!armed || e.relatedTarget || e.clientY > 8) return;
      try {
        if (sessionStorage.getItem(KEY)) return;
        sessionStorage.setItem(KEY, "1");
      } catch {
        /* storage blocked: still only once per page load */
        armed = false;
      }
      const s = useYashu.getState();
      if (s.openProject || s.commandOpen || s.tour.active) return;
      setOpen(true);
      void speakLine(exitIntent());
    };
    document.addEventListener("mouseout", onOut);
    return () => {
      clearTimeout(arm);
      document.removeEventListener("mouseout", onOut);
    };
  }, [ready]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => setOpen(false), 12_000);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          aria-label="Before you go"
          className="glass fixed bottom-28 left-4 z-[72] w-[min(360px,calc(100vw-32px))] border-amber/50 p-4 sm:left-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="hud-label text-amber">Leaving already? One more thing —</p>
            <button type="button" onClick={() => setOpen(false)} className="font-mono text-xs text-muted hover:text-ink" aria-label="Dismiss">
              ✕
            </button>
          </div>
          <p className="mt-2 font-display text-xl font-bold uppercase tracking-wide text-ink">{best.title}</p>
          <p className="text-sm text-muted">
            {best.subtitle} · {best.metrics[0].value} {best.metrics[0].label}
          </p>
          <button
            type="button"
            className="btn-energy amber mt-3 !py-2"
            onClick={() => {
              setOpen(false);
              useYashu.getState().openCaseFile(best.slug);
            }}
          >
            Open the briefing
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

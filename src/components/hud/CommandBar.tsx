"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { assistant } from "@/data/portfolio";
import { playSound } from "@/lib/sound";
import { runCommand } from "@/yashu/commands";
import { SUGGESTIONS } from "@/yashu/intents";
import { micSupported, startListening, stopListening } from "@/yashu/listen";
import { useYashu } from "@/yashu/store";

type LogEntry = { who: "you" | "yashu"; text: string };

export function CommandBar() {
  const { commandOpen, setCommandOpen, listening } = useYashu(
    useShallow((s) => ({ commandOpen: s.commandOpen, setCommandOpen: s.setCommandOpen, listening: s.listening })),
  );
  const [input, setInput] = useState("");
  const [log, setLog] = useState<LogEntry[]>([
    { who: "yashu", text: `${assistant.name} online. Ask me anything about Yashika, or try a suggestion below.` },
  ]);
  const [micOk, setMicOk] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => setMicOk(micSupported()), []);

  // Global shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(!useYashu.getState().commandOpen);
      } else if (e.key === "Escape" && useYashu.getState().commandOpen) {
        // Close from anywhere, not only while focus is inside the dialog.
        setCommandOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setCommandOpen]);

  useEffect(() => {
    if (commandOpen) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      playSound("open");
      window.setTimeout(() => inputRef.current?.focus(), 30);
    } else if (returnFocus.current) {
      returnFocus.current.focus?.();
      returnFocus.current = null;
    }
  }, [commandOpen]);

  const submit = useCallback(async (text: string, source: "typed" | "voice" = "typed") => {
    const q = text.trim();
    if (!q) return;
    setInput("");
    setLog((l) => [...l.slice(-8), { who: "you", text: q }]);
    playSound("click");
    const line = await runCommand(q, source);
    setLog((l) => [...l.slice(-8), { who: "yashu", text: line }]);
  }, []);

  const toggleMic = useCallback(() => {
    if (listening) return stopListening();
    startListening("once", (t) => void submit(t, "voice"));
  }, [listening, submit]);

  return (
    <>
      <AnimatePresence>
        {commandOpen && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-start justify-center bg-void/70 px-4 pt-[12vh] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => e.target === e.currentTarget && setCommandOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`Command bar — talk to ${assistant.name}`}
              className="glass w-full max-w-xl overflow-hidden"
              initial={{ y: -16, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation();
                  setCommandOpen(false);
                }
              }}
            >
              <div className="flex items-center justify-between border-b border-cyan/15 px-4 py-2">
                <span className="hud-label">
                  {assistant.name} {"//"} comms
                </span>
                <button
                  type="button"
                  onClick={() => setCommandOpen(false)}
                  className="font-mono text-xs text-muted hover:text-ink"
                  aria-label="Close command bar"
                >
                  ESC
                </button>
              </div>

              <div className="max-h-64 space-y-2 overflow-y-auto px-4 py-3 font-mono text-sm" data-lenis-prevent>
                {log.map((m, i) => (
                  <p key={i} className={m.who === "you" ? "text-amber" : "text-ink"}>
                    <span className="mr-2 text-muted">{m.who === "you" ? "you >" : "yashu >"}</span>
                    {m.text}
                  </p>
                ))}
              </div>

              <form
                className="flex items-center gap-2 border-t border-cyan/15 p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit(input);
                }}
              >
                <label htmlFor="yashu-input" className="sr-only">
                  Command or question
                </label>
                <input
                  id="yashu-input"
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={listening ? "Listening…" : 'Try "open Haggle" or ask a question'}
                  autoComplete="off"
                  maxLength={300}
                  className="min-w-0 flex-1 rounded-md border border-cyan/25 bg-void/60 px-3 py-2 font-mono text-sm text-ink placeholder:text-muted/70 focus:border-cyan focus:outline-none"
                />
                {micOk && (
                  <button
                    type="button"
                    onClick={toggleMic}
                    aria-pressed={listening}
                    aria-label={listening ? "Stop listening" : "Speak a command"}
                    className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition ${
                      listening ? "border-amber bg-amber/15 text-amber" : "border-cyan/40 text-cyan hover:bg-cyan/10"
                    }`}
                  >
                    {listening && <span className="absolute inset-0 animate-ping rounded-md border border-amber/60" aria-hidden="true" />}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <rect x="9" y="3" width="6" height="11" rx="3" />
                      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                    </svg>
                  </button>
                )}
                <button type="submit" className="btn-energy !px-3 !py-2">
                  Send
                </button>
              </form>

              <div className="flex flex-wrap gap-2 px-3 pb-3">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void submit(s)}
                    className="rounded-full border border-cyan/25 px-3 py-1 font-mono text-xs text-muted transition hover:border-cyan hover:text-ink"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

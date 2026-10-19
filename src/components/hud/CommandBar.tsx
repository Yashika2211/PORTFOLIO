"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { assistant } from "@/data/portfolio";
import { resolveCommand, SUGGESTIONS, type Action } from "@/lib/assistant";
import { playSound } from "@/lib/sound";
import { listenOnce, speak, speechInputSupported } from "@/lib/speech";
import { coreSignal, useHud } from "@/components/providers/HudProvider";
import { scrollToSection } from "@/components/providers/SmoothScroll";

type LogEntry = { who: "you" | "yasha"; text: string };

function pulseCore(ms = 900) {
  coreSignal.speaking = true;
  window.setTimeout(() => (coreSignal.speaking = false), ms);
}

export function CommandBar() {
  const { commandOpen, setCommandOpen, setOpenProject, voice } = useHud();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [log, setLog] = useState<LogEntry[]>([
    { who: "yasha", text: `${assistant.name} online. Ask me to show projects, open a case file, or fetch the resume.` },
  ]);
  const [listening, setListening] = useState(false);
  const [micOk, setMicOk] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const stopRef = useRef<() => void>(() => {});
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => setMicOk(speechInputSupported()), []);

  // Global shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commandOpen, setCommandOpen]);

  useEffect(() => {
    if (commandOpen) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      playSound("open");
      window.setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      stopRef.current();
      returnFocus.current?.focus?.();
    }
  }, [commandOpen]);

  const perform = useCallback(
    (action: Action) => {
      switch (action.type) {
        case "scroll":
          setCommandOpen(false);
          window.setTimeout(() => scrollToSection(action.section), 120);
          break;
        case "openProject":
          setCommandOpen(false);
          scrollToSection("projects");
          window.setTimeout(() => setOpenProject(action.slug), 500);
          break;
        case "download": {
          const a = document.createElement("a");
          a.href = action.href;
          a.download = "";
          a.click();
          break;
        }
        case "link":
          window.open(action.href, "_blank", "noopener,noreferrer");
          break;
        case "recruiter":
          router.push("/recruiter");
          break;
      }
    },
    [router, setCommandOpen, setOpenProject],
  );

  const submit = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q) return;
      setInput("");
      setLog((l) => [...l, { who: "you", text: q }]);
      const reply = await resolveCommand(q);
      setLog((l) => [...l.slice(-8), { who: "yasha", text: reply.text }]);
      playSound("click");
      if (voice) {
        speak(reply.text, {
          onStart: () => (coreSignal.speaking = true),
          onEnd: () => (coreSignal.speaking = false),
        });
      } else {
        pulseCore();
      }
      perform(reply.action);
    },
    [perform, voice],
  );

  const toggleMic = useCallback(() => {
    if (listening) {
      stopRef.current();
      return;
    }
    const { promise, stop } = listenOnce();
    stopRef.current = stop;
    setListening(true);
    promise
      .then((t) => void submit(t))
      .catch(() => setLog((l) => [...l, { who: "yasha", text: "Didn't hear anything — try typing instead." }]))
      .finally(() => setListening(false));
  }, [listening, submit]);

  return (
    <>
      {/* Floating trigger (always visible; primary on mobile) */}
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-cyan/60 bg-void/80 text-cyan shadow-[0_0_24px_rgba(0,229,255,0.35)] backdrop-blur transition hover:scale-105 md:bottom-12 md:right-8"
        aria-label={`Talk to ${assistant.name}`}
        aria-haspopup="dialog"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4" fill="currentColor" />
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeOpacity="0.6" />
          <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeDasharray="3 3" />
        </svg>
      </button>

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
                <span className="hud-label">{assistant.name} {"//"} comms</span>
                <button
                  type="button"
                  onClick={() => setCommandOpen(false)}
                  className="font-mono text-xs text-muted hover:text-ink"
                  aria-label="Close command bar"
                >
                  ESC
                </button>
              </div>

              <div className="max-h-64 space-y-2 overflow-y-auto px-4 py-3 font-mono text-sm" aria-live="polite">
                {log.map((m, i) => (
                  <p key={i} className={m.who === "you" ? "text-amber" : "text-ink"}>
                    <span className="mr-2 text-muted">{m.who === "you" ? "you >" : "yasha >"}</span>
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
                <label htmlFor="yasha-input" className="sr-only">
                  Command
                </label>
                <input
                  id="yasha-input"
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder='Try "open Haggle"'
                  autoComplete="off"
                  className="min-w-0 flex-1 rounded-md border border-cyan/25 bg-void/60 px-3 py-2 font-mono text-sm text-ink placeholder:text-muted/70 focus:border-cyan focus:outline-none"
                />
                {micOk && (
                  <button
                    type="button"
                    onClick={toggleMic}
                    aria-pressed={listening}
                    aria-label={listening ? "Stop listening" : "Speak a command"}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition ${
                      listening ? "border-amber bg-amber/15 text-amber" : "border-cyan/40 text-cyan hover:bg-cyan/10"
                    }`}
                  >
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

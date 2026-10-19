"use client";

import { useEffect, useState } from "react";
import { useYashu } from "../store";

/** Types out whatever Y.A.S.H.U. says. The live region always carries the full text. */
export function Subtitles() {
  const subtitle = useYashu((s) => s.subtitle);
  const [shown, setShown] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!subtitle) return;
    setVisible(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || subtitle.streaming) {
      setShown(subtitle.text);
    } else {
      let i = 0;
      const id = window.setInterval(() => {
        i += 2;
        setShown(subtitle.text.slice(0, i));
        if (i >= subtitle.text.length) clearInterval(id);
      }, 22);
      return () => clearInterval(id);
    }
  }, [subtitle]);

  useEffect(() => {
    if (!subtitle || subtitle.streaming) return;
    const t = window.setTimeout(() => setVisible(false), 3500 + subtitle.text.length * 45);
    return () => clearTimeout(t);
  }, [subtitle, shown]);

  return (
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {subtitle && !subtitle.streaming ? `Y.A.S.H.U. says: ${subtitle.text}` : ""}
      </div>
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed bottom-24 left-1/2 z-[65] w-[min(640px,calc(100vw-120px))] -translate-x-1/2 text-center transition-all duration-500 md:bottom-14 ${
          visible && shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <p className="inline rounded-md bg-void/80 box-decoration-clone px-3 py-1 font-mono text-sm leading-7 text-ink shadow-[0_0_0_1px_rgba(0,229,255,0.25)] backdrop-blur">
          <span className="text-cyan">yashu &gt; </span>
          {shown}
          {subtitle?.streaming && <span className="pulse-dot ml-0.5 inline-block h-3 w-1.5 bg-cyan align-middle" />}
        </p>
      </div>
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "!<>-_\\/[]{}—=+*^?#01ABCDEFXYZ";

type Props = {
  text: string;
  className?: string;
  /** Delay before decoding starts (ms). */
  delay?: number;
  /** Total decode duration (ms). */
  duration?: number;
  /** Start decoding only when scrolled into view. */
  onView?: boolean;
};

/**
 * Decodes `text` from random glyphs. Screen readers always get the final
 * text from an sr-only copy; the animated characters are aria-hidden.
 */
export function ScrambleText({ text, className, delay = 0, duration = 1200, onView = false }: Props) {
  const [out, setOut] = useState(text);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let timer = 0;
    let observer: IntersectionObserver | null = null;

    const run = () => {
      const start = performance.now();
      const frame = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const revealed = Math.floor(p * text.length);
        let s = "";
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          s += i < revealed || ch === " " ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        setOut(s);
        if (p < 1) raf = requestAnimationFrame(frame);
      };
      timer = window.setTimeout(() => (raf = requestAnimationFrame(frame)), delay);
    };

    if (onView && ref.current) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            observer?.disconnect();
            run();
          }
        },
        { threshold: 0.4 },
      );
      observer.observe(ref.current);
    } else {
      run();
    }

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      observer?.disconnect();
    };
  }, [text, delay, duration, onView]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      {/* The invisible final text reserves the layout; glyphs of other widths can't shift it. */}
      <span aria-hidden="true" className="relative inline-block">
        <span className="invisible">{text}</span>
        <span className="absolute inset-0">{out}</span>
      </span>
    </span>
  );
}

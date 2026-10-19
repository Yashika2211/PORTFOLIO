"use client";

import { useEffect, useRef } from "react";
import { coreSignal } from "@/components/providers/HudProvider";

const INTERACTIVE = "a, button, [role='button'], input, textarea, select, [data-magnetic]";

/** Ring + dot cursor; the ring snaps magnetically onto interactive elements. */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const updatePointer = (e: PointerEvent) => {
      coreSignal.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      coreSignal.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", updatePointer, { passive: true });
    if (!fine || reduced) return () => window.removeEventListener("pointermove", updatePointer);

    document.documentElement.classList.add("has-custom-cursor");
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...target };
    let size = 34;
    let targetSize = 34;
    let raf = 0;
    let magnet: HTMLElement | null = null;

    const onMove = (e: PointerEvent) => {
      if (dot.current?.style.opacity === "0") show();
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(INTERACTIVE) ?? null;
      magnet = el;
      if (el) {
        const r = el.getBoundingClientRect();
        // Pull 35% toward the element's centre for the magnetic feel.
        target.x = e.clientX + (r.left + r.width / 2 - e.clientX) * 0.35;
        target.y = e.clientY + (r.top + r.height / 2 - e.clientY) * 0.35;
        targetSize = Math.min(64, Math.max(44, Math.min(r.width, r.height) + 14));
      } else {
        target.x = e.clientX;
        target.y = e.clientY;
        targetSize = 34;
      }
      if (dot.current) dot.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
    };

    const loop = () => {
      pos.x += (target.x - pos.x) * 0.2;
      pos.y += (target.y - pos.y) * 0.2;
      size += (targetSize - size) * 0.2;
      if (ring.current) {
        ring.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
        ring.current.style.width = ring.current.style.height = `${size}px`;
        ring.current.dataset.active = magnet ? "1" : "0";
      }
      raf = requestAnimationFrame(loop);
    };

    const hide = () => ring.current && dot.current && (ring.current.style.opacity = dot.current.style.opacity = "0");
    const show = () => ring.current && dot.current && (ring.current.style.opacity = dot.current.style.opacity = "1");

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", hide);
    document.addEventListener("pointerenter", show);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", hide);
      document.removeEventListener("pointerenter", show);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <div aria-hidden="true" className="cursor-layer">
      <div
        ref={ring}
        className="pointer-events-none fixed left-0 top-0 z-[95] rounded-full border border-cyan/70 transition-[border-color,background-color] duration-200 data-[active=1]:border-amber data-[active=1]:bg-amber/10"
        style={{ width: 34, height: 34, opacity: 0 }}
      />
      <div
        ref={dot}
        className="pointer-events-none fixed left-0 top-0 z-[96] h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_#00e5ff]"
        style={{ opacity: 0 }}
      />
    </div>
  );
}

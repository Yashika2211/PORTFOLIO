"use client";

import { useEffect, useRef } from "react";
import { signals as coreSignal } from "@/yashu/signals";

const INTERACTIVE = "a, button, [role='button'], input, textarea, select, [data-magnetic]";
const LOCK_ON = ".case-file, [data-lockon]";
const TRAIL = 26;

/**
 * Energy-ring cursor: magnetic ring + dot, a fading particle ribbon (2D canvas
 * overlay — the WebGL stage sits behind the page), and lock-on brackets over cards.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const lock = useRef<HTMLDivElement>(null);
  const trail = useRef<HTMLCanvasElement>(null);

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
    const points: { x: number; y: number }[] = [];
    let size = 34;
    let targetSize = 34;
    let raf = 0;
    let magnet: HTMLElement | null = null;
    let locked: HTMLElement | null = null;

    const canvas = trail.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const show = () => ring.current && dot.current && (ring.current.style.opacity = dot.current.style.opacity = "1");
    const hide = () => ring.current && dot.current && (ring.current.style.opacity = dot.current.style.opacity = "0");

    const onMove = (e: PointerEvent) => {
      if (dot.current?.style.opacity === "0") show();
      const t = e.target as HTMLElement | null;
      const el = t?.closest<HTMLElement>(INTERACTIVE) ?? null;
      magnet = el;
      locked = t?.closest<HTMLElement>(LOCK_ON) ?? null;
      if (el && !locked) {
        const r = el.getBoundingClientRect();
        // Pull 35% toward the element's centre for the magnetic feel.
        target.x = e.clientX + (r.left + r.width / 2 - e.clientX) * 0.35;
        target.y = e.clientY + (r.top + r.height / 2 - e.clientY) * 0.35;
        targetSize = Math.min(64, Math.max(44, Math.min(r.width, r.height) + 14));
      } else {
        target.x = e.clientX;
        target.y = e.clientY;
        targetSize = locked ? 22 : 34;
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

      // Lock-on brackets track the hovered card.
      if (lock.current) {
        if (locked) {
          const r = locked.getBoundingClientRect();
          const s = lock.current.style;
          s.opacity = "1";
          s.transform = `translate3d(${r.left - 8}px, ${r.top - 8}px, 0)`;
          s.width = `${r.width + 16}px`;
          s.height = `${r.height + 16}px`;
        } else lock.current.style.opacity = "0";
      }

      // Particle ribbon: recent positions drawn as a tapering glowing stroke.
      points.unshift({ x: pos.x, y: pos.y });
      if (points.length > TRAIL) points.pop();
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = "lighter";
      for (let i = 1; i < points.length; i++) {
        const k = 1 - i / points.length;
        ctx.strokeStyle = `rgba(0, 229, 255, ${k * 0.45})`;
        ctx.lineWidth = k * 5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(points[i - 1].x, points[i - 1].y);
        ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();
        if (i % 4 === 0) {
          ctx.fillStyle = `rgba(255, 181, 71, ${k * 0.6})`;
          ctx.beginPath();
          ctx.arc(points[i].x + Math.sin(i + pos.x * 0.05) * 6 * (1 - k), points[i].y + Math.cos(i + pos.y * 0.05) * 6 * (1 - k), k * 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize);
    document.addEventListener("pointerleave", hide);
    document.addEventListener("pointerenter", show);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      document.removeEventListener("pointerleave", hide);
      document.removeEventListener("pointerenter", show);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <div aria-hidden="true" className="cursor-layer">
      <canvas ref={trail} className="pointer-events-none fixed inset-0 z-[94] h-full w-full" />
      <div
        ref={lock}
        className="lock-on pointer-events-none fixed left-0 top-0 z-[93] opacity-0 transition-[opacity,width,height,transform] duration-200 ease-out"
      />
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

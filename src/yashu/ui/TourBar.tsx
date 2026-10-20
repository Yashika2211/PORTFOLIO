"use client";

import { useYashu } from "../store";
import { stopTour } from "../tour";

/** HUD progress bar while the guided tour is running. */
export function TourBar() {
  const tour = useYashu((s) => s.tour);
  if (!tour.active) return null;
  const pct = tour.total ? (tour.step / tour.total) * 100 : 0;
  return (
    <div className="fixed inset-x-0 top-[4.4rem] z-[60] mx-auto w-[min(560px,calc(100vw-32px))]" role="status" aria-live="polite">
      <div className="glass flex items-center gap-3 px-3 py-2">
        <span className="hud-label shrink-0 text-amber">Tour</span>
        <div
          className="h-1 flex-1 overflow-hidden rounded bg-cyan/15"
          role="progressbar"
          aria-label="Guided tour progress"
          aria-valuemin={0}
          aria-valuemax={tour.total}
          aria-valuenow={tour.step}
        >
          <div className="h-full bg-cyan shadow-[0_0_8px_#00e5ff] transition-[width] duration-700" style={{ width: `${pct}%` }} />
        </div>
        <span className="font-mono text-[11px] tabular-nums text-muted">
          {tour.step}/{tour.total}
        </span>
        <button type="button" onClick={() => stopTour("interrupted")} className="font-mono text-[11px] text-muted hover:text-ink">
          exit ✕
        </button>
      </div>
    </div>
  );
}

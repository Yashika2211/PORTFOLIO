/** 2D stand-in for the 3D arc core: CSS gradients + SVG rings, no WebGL. */
export function StaticCore() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <div className="relative aspect-square w-[min(78vw,520px)]">
        <div className="absolute inset-[30%] rounded-full bg-[radial-gradient(circle,#e6fdff_0%,#00e5ff_22%,rgba(0,229,255,0.25)_55%,transparent_72%)] blur-[2px]" />
        <div className="absolute inset-[24%] rounded-full shadow-[0_0_80px_20px_rgba(0,229,255,0.25),inset_0_0_60px_rgba(0,229,255,0.35)]" />
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="sc-amber" x1="0" x2="1">
              <stop offset="0" stopColor="#ffb547" stopOpacity="0" />
              <stop offset="1" stopColor="#ffb547" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <g className="radar-sweep" style={{ transformOrigin: "100px 100px", animationDuration: "18s" }}>
            <circle cx="100" cy="100" r="62" fill="none" stroke="#00e5ff" strokeOpacity="0.7" strokeWidth="0.6" />
            <circle cx="100" cy="100" r="62" fill="none" stroke="#00e5ff" strokeWidth="1.6" strokeDasharray="30 360" />
          </g>
          <g className="radar-sweep" style={{ transformOrigin: "100px 100px", animationDuration: "26s", animationDirection: "reverse" }}>
            <circle cx="100" cy="100" r="76" fill="none" stroke="#00e5ff" strokeOpacity="0.35" strokeWidth="0.5" strokeDasharray="2 4" />
            <circle cx="100" cy="100" r="76" fill="none" stroke="url(#sc-amber)" strokeWidth="1.2" strokeDasharray="60 420" />
          </g>
          <circle cx="100" cy="100" r="90" fill="none" stroke="#ffb547" strokeOpacity="0.35" strokeWidth="0.5" strokeDasharray="1 5" />
          <polygon
            points="100,52 141.6,76 141.6,124 100,148 58.4,124 58.4,76"
            fill="none"
            stroke="#00e5ff"
            strokeOpacity="0.25"
            strokeWidth="0.6"
          />
        </svg>
      </div>
    </div>
  );
}

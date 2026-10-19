import type { Project } from "@/data/portfolio";

const NODE_W = 22;
const NODE_H = 8;

/** Animated architecture mini-diagram on a 100×60 grid; edges flow node → node. */
export function ArchDiagram({ arch, title }: { arch: Project["arch"]; title: string }) {
  const byId = Object.fromEntries(arch.nodes.map((n) => [n.id, n]));
  const description = arch.edges
    .map((e) => `${byId[e.from]?.label} to ${byId[e.to]?.label}${e.label ? ` (${e.label})` : ""}`)
    .join("; ");

  return (
    <figure className="glass p-3">
      <figcaption className="hud-label mb-2 px-1">Architecture</figcaption>
      <svg viewBox="0 0 100 60" className="h-auto w-full" role="img" aria-label={`${title} architecture: ${description}`}>
        <defs>
          <marker id={`arrow-${title}`} viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M0,0 L6,3 L0,6 Z" fill="#ffb547" />
          </marker>
        </defs>
        {arch.edges.map((e, i) => {
          const a = byId[e.from];
          const b = byId[e.to];
          if (!a || !b) return null;
          // Trim the line so it starts/ends at the node box edges.
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const tx = Math.abs(dx) / len > Math.abs(dy) / len * (NODE_W / NODE_H) ? NODE_W / 2 / (Math.abs(dx) / len) : NODE_H / 2 / (Math.abs(dy) / len);
          const pad = Math.min(tx + 1, len / 2 - 1);
          const x1 = a.x + (dx / len) * pad;
          const y1 = a.y + (dy / len) * pad;
          const x2 = b.x - (dx / len) * pad;
          const y2 = b.y - (dy / len) * pad;
          return (
            <g key={i}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#ffb547"
                strokeOpacity="0.8"
                strokeWidth="0.45"
                className="arch-edge"
                markerEnd={`url(#arrow-${title})`}
                vectorEffect="non-scaling-stroke"
              />
              {e.label && (
                <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 1.2} textAnchor="middle" fontSize="2.6" className="fill-muted font-mono">
                  {e.label}
                </text>
              )}
            </g>
          );
        })}
        {arch.nodes.map((n) => (
          <g key={n.id}>
            <rect
              x={n.x - NODE_W / 2}
              y={n.y - NODE_H / 2}
              width={NODE_W}
              height={NODE_H}
              rx="1.5"
              fill="rgb(0 229 255 / 0.08)"
              stroke="#00e5ff"
              strokeOpacity="0.7"
              strokeWidth="0.35"
            />
            <text x={n.x} y={n.y + 1} textAnchor="middle" fontSize="2.9" className="fill-ink font-sans">
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
}

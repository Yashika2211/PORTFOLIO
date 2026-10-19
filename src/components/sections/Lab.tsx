import { lab } from "@/data/portfolio";

/** "More from the lab" — smaller one-liner grid under the case files. */
export function Lab() {
  return (
    <div className="mt-24">
      <h3 className="hud-label mb-6 flex items-center gap-3">
        <span className="text-amber">03.b</span>
        <span className="h-px w-10 bg-cyan/50" aria-hidden="true" />
        More from the lab
      </h3>
      <ul className="grid gap-4 sm:grid-cols-2">
        {lab.map((item) => {
          const href = item.repo ?? item.live;
          return (
            <li key={item.title} className="glass scan-hover flex flex-col p-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-display text-lg font-bold uppercase tracking-wide text-ink">{item.title}</p>
                {href && (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 font-mono text-xs text-cyan underline-offset-4 hover:underline"
                    aria-label={`${item.title} — ${item.repo ? "source on GitHub" : "live app"} (opens in new tab)`}
                  >
                    {item.repo ? "repo ↗" : "live ↗"}
                  </a>
                )}
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/80">{item.blurb}</p>
              <p className="mt-3 font-mono text-[11px] text-muted">{item.stack.join(" · ")}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

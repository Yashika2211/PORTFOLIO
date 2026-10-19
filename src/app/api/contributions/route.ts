import { NextResponse } from "next/server";
import { profile } from "@/data/portfolio";

/**
 * Public GitHub contribution calendar (no token): parsed from the profile's
 * contributions fragment and cached for 6 hours. Returns days with levels 0–4.
 */
export const revalidate = 21600;

export async function GET() {
  try {
    const res = await fetch(`https://github.com/users/${profile.githubUser}/contributions`, {
      next: { revalidate },
      signal: AbortSignal.timeout(8000),
      headers: { "user-agent": "yashika-portfolio" },
    });
    if (!res.ok) throw new Error(String(res.status));
    const html = await res.text();
    const days = [...html.matchAll(/data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"/g)]
      .map((m) => ({ date: m[1], level: Number(m[2]) }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const total = Number(html.match(/([\d,]+)\s+contributions?\s+in the last year/)?.[1]?.replace(/,/g, "") ?? NaN);
    if (!days.length) throw new Error("no days");
    return NextResponse.json({ days, total: Number.isFinite(total) ? total : null });
  } catch {
    return NextResponse.json({ days: [], total: null }, { headers: { "cache-control": "public, max-age=600" } });
  }
}

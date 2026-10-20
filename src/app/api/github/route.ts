import { NextResponse } from "next/server";
import { githubFallback, profile } from "@/data/portfolio";

/**
 * Cached proxy for the public GitHub REST API. Visitors never call GitHub
 * directly, so they can't hit the 60 req/h unauthenticated limit; the server
 * refreshes at most every 30 minutes and falls back to static values.
 * Optional GITHUB_TOKEN raises the server's own limit.
 */
export const revalidate = 1800;

export async function GET() {
  const base = `https://api.github.com/users/${profile.githubUser}`;
  const headers: HeadersInit = { Accept: "application/vnd.github+json", "user-agent": "yashika-portfolio" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const opts = { headers, next: { revalidate }, signal: AbortSignal.timeout(8000) };
    const [u, r] = await Promise.all([fetch(base, opts), fetch(`${base}/repos?sort=pushed&per_page=6`, opts)]);
    if (!u.ok || !r.ok) throw new Error(`${u.status}/${r.status}`);
    const user = (await u.json()) as { public_repos: number };
    const repos = (await r.json()) as { name: string; pushed_at: string; html_url: string; fork: boolean }[];
    return NextResponse.json({
      source: "live",
      publicRepos: user.public_repos,
      recent: repos
        .filter((x) => !x.fork)
        .slice(0, 3)
        .map((x) => ({ name: x.name, pushedAt: x.pushed_at, url: x.html_url })),
    });
  } catch {
    return NextResponse.json({ source: "fallback", ...githubFallback }, { headers: { "cache-control": "public, max-age=300" } });
  }
}

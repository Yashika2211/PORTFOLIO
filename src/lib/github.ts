"use client";

import { useEffect, useState } from "react";
import { githubFallback, profile } from "@/data/portfolio";

export type RepoPush = { name: string; pushedAt: string; url: string };
export type GitHubSnapshot = {
  publicRepos: number;
  recent: RepoPush[];
  source: "live" | "cache" | "fallback";
};

const CACHE_KEY = "yashu:github:v1";
const TTL_MS = 30 * 60 * 1000;

function readCache(): { at: number; data: Omit<GitHubSnapshot, "source"> } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(data: Omit<GitHubSnapshot, "source">) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* storage unavailable — fine */
  }
}

const fallback: GitHubSnapshot = {
  publicRepos: githubFallback.publicRepos,
  recent: [...githubFallback.recent].sort((a, b) => b.pushedAt.localeCompare(a.pushedAt)),
  source: "fallback",
};

async function fetchLive(signal: AbortSignal): Promise<Omit<GitHubSnapshot, "source">> {
  const base = `https://api.github.com/users/${profile.githubUser}`;
  const headers = { Accept: "application/vnd.github+json" };
  const [userRes, reposRes] = await Promise.all([
    fetch(base, { signal, headers }),
    fetch(`${base}/repos?sort=pushed&per_page=6`, { signal, headers }),
  ]);
  if (!userRes.ok || !reposRes.ok) throw new Error(`github ${userRes.status}/${reposRes.status}`);
  const user = (await userRes.json()) as { public_repos: number };
  const repos = (await reposRes.json()) as { name: string; pushed_at: string; html_url: string; fork: boolean }[];
  return {
    publicRepos: user.public_repos,
    recent: repos
      .filter((r) => !r.fork)
      .slice(0, 3)
      .map((r) => ({ name: r.name, pushedAt: r.pushed_at, url: r.html_url })),
  };
}

/** Live GitHub stats: cache first, then network, then static fallback. */
export function useGitHub(): GitHubSnapshot {
  const [snap, setSnap] = useState<GitHubSnapshot>(fallback);

  useEffect(() => {
    const cached = readCache();
    if (cached) setSnap({ ...cached.data, source: "cache" });
    if (cached && Date.now() - cached.at < TTL_MS) return;

    const ctrl = new AbortController();
    fetchLive(ctrl.signal)
      .then((data) => {
        writeCache(data);
        setSnap({ ...data, source: "live" });
      })
      .catch(() => {
        /* rate-limited or offline: keep cache/fallback */
      });
    return () => ctrl.abort();
  }, []);

  return snap;
}

export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  const steps: [number, string][] = [
    [60, "s"],
    [60, "m"],
    [24, "h"],
    [30, "d"],
    [12, "mo"],
  ];
  let v = s;
  for (const [n, unit] of steps) {
    if (v < n) return `${Math.floor(v)}${unit} ago`;
    v /= n;
  }
  return `${Math.floor(v)}y ago`;
}

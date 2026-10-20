"use client";

import { useEffect, useState } from "react";
import { githubFallback } from "@/data/portfolio";

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

async function fetchLive(signal: AbortSignal): Promise<Omit<GitHubSnapshot, "source"> & { source: GitHubSnapshot["source"] }> {
  // Our cached server proxy (src/app/api/github) — never GitHub directly.
  const res = await fetch("/api/github", { signal });
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as GitHubSnapshot;
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
        if (data.source === "live") writeCache(data);
        setSnap(data);
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

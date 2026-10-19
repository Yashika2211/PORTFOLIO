"use client";

import { useEffect, useState } from "react";

export type Weather = { temp: number; label: string; source: "live" | "cache" } | null;
export type Contributions = { days: { date: string; level: number }[]; total: number | null };

const WMO: Record<number, string> = {
  0: "clear", 1: "mostly clear", 2: "partly cloudy", 3: "overcast", 45: "fog", 48: "fog",
  51: "drizzle", 53: "drizzle", 55: "drizzle", 61: "rain", 63: "rain", 65: "heavy rain",
  80: "showers", 81: "showers", 82: "heavy showers", 95: "thunderstorm", 96: "thunderstorm", 99: "thunderstorm",
};

function cached<T>(key: string, ttl: number): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { at, data } = JSON.parse(raw) as { at: number; data: T };
    return Date.now() - at < ttl ? data : null;
  } catch {
    return null;
  }
}
function store(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* ignore */
  }
}

/** Bengaluru weather from Open-Meteo (no key), cached 30 minutes. */
export function useWeather(): Weather {
  const [w, setW] = useState<Weather>(null);
  useEffect(() => {
    const c = cached<{ temp: number; label: string }>("yashu:weather:v1", 30 * 60_000);
    if (c) return setW({ ...c, source: "cache" });
    const ctrl = new AbortController();
    fetch("https://api.open-meteo.com/v1/forecast?latitude=12.97&longitude=77.59&current=temperature_2m,weather_code&timezone=Asia%2FKolkata", {
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j: { current: { temperature_2m: number; weather_code: number } }) => {
        const data = { temp: Math.round(j.current.temperature_2m), label: WMO[j.current.weather_code] ?? "—" };
        store("yashu:weather:v1", data);
        setW({ ...data, source: "live" });
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);
  return w;
}

/** Contribution calendar via our cached /api/contributions route. */
export function useContributions(): Contributions | null {
  const [c, setC] = useState<Contributions | null>(null);
  useEffect(() => {
    const hit = cached<Contributions>("yashu:contrib:v1", 6 * 3600_000);
    if (hit?.days.length) return setC(hit);
    fetch("/api/contributions")
      .then((r) => r.json())
      .then((j: Contributions) => {
        if (j.days.length) store("yashu:contrib:v1", j);
        setC(j);
      })
      .catch(() => setC({ days: [], total: null }));
  }, []);
  return c;
}

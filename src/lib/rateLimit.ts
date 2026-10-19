/**
 * Tiny in-memory sliding-window rate limiter for API routes.
 * Per serverless instance — good enough to stop casual abuse of paid APIs.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) buckets.clear(); // crude memory bound
  return { ok: true, retryAfter: 0 };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anon";
}

/** Read `{ [field]: string }` from a JSON body, trimmed and length-capped. */
export async function readText(req: Request, field: string, max: number): Promise<string | null> {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const v = body[field];
    if (typeof v !== "string") return null;
    const t = v.trim();
    return t && t.length <= max ? t : null;
  } catch {
    return null;
  }
}

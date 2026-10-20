import { NextResponse } from "next/server";
import { clientIp, rateLimit, readText } from "@/lib/rateLimit";

/**
 * Optional premium voice for Y.A.S.H.U.
 * Env (server-only): TTS_PROVIDER = "elevenlabs" | "openai", TTS_API_KEY, optional TTS_VOICE.
 * Defaults are female voices: ElevenLabs "Rachel", OpenAI "nova" with a style instruction.
 * Without a key, GET reports disabled and the client silently uses speechSynthesis.
 */
const provider = process.env.TTS_PROVIDER?.toLowerCase();
const key = process.env.TTS_API_KEY;
const enabled = Boolean(key && (provider === "elevenlabs" || provider === "openai"));

export async function GET() {
  return NextResponse.json({ enabled }, { headers: { "cache-control": "public, max-age=300" } });
}

export async function POST(req: Request) {
  if (!enabled) return NextResponse.json({ error: "tts disabled" }, { status: 404 });

  const limit = rateLimit(`tts:${clientIp(req)}`, 30, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "rate limited" }, { status: 429, headers: { "retry-after": String(limit.retryAfter) } });
  }

  const text = await readText(req, "text", 1000);
  if (!text) return NextResponse.json({ error: "text must be 1–1000 chars" }, { status: 400 });

  const signal = AbortSignal.timeout(12_000);
  try {
    const upstream =
      provider === "elevenlabs"
        ? await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.TTS_VOICE || "21m00Tcm4TlvDq8ikWAM"}`, {
            method: "POST",
            signal,
            headers: { "xi-api-key": key!, "content-type": "application/json", accept: "audio/mpeg" },
            body: JSON.stringify({
              text,
              model_id: "eleven_multilingual_v2",
              voice_settings: { stability: 0.5, similarity_boost: 0.75 },
            }),
          })
        : await fetch("https://api.openai.com/v1/audio/speech", {
            method: "POST",
            signal,
            headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
            body: JSON.stringify({
              model: "gpt-4o-mini-tts",
              voice: process.env.TTS_VOICE || "nova",
              input: text,
              instructions:
                "Voice of a calm, confident, warm female AI assistant with a light Indian-English accent. Crisp articulation, natural pacing, a hint of dry wit. Never robotic.",
              response_format: "mp3",
            }),
          });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: `provider ${upstream.status}` }, { status: 502 });
    }
    return new Response(upstream.body, {
      headers: { "content-type": "audio/mpeg", "cache-control": "public, max-age=86400, immutable" },
    });
  } catch {
    return NextResponse.json({ error: "tts timeout" }, { status: 504 });
  }
}

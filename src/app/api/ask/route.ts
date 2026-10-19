import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import * as portfolio from "@/data/portfolio";
import { clientIp, rateLimit, readText } from "@/lib/rateLimit";

/**
 * Optional LLM brain for Y.A.S.H.U.: answers free-form questions about
 * Yashika using ONLY src/data/portfolio.ts. Streams plain text.
 * Env (server-only): LLM_API_KEY. Without it, GET reports disabled and the
 * client uses the deterministic intent router instead.
 */
const key = process.env.LLM_API_KEY;
const client = key ? new Anthropic({ apiKey: key, maxRetries: 1 }) : null;

// Frozen at module load so the cached prefix is byte-identical across requests.
const facts = JSON.stringify(
  {
    profile: { ...portfolio.profile, siteUrl: undefined },
    stats: portfolio.stats,
    experience: portfolio.experience,
    skills: portfolio.skillGroups.map((g) => ({ group: g.label, skills: g.skills })),
    awsServices: portfolio.awsServices,
    projects: portfolio.projects.map((p) => ({
      title: p.title,
      subtitle: p.subtitle,
      event: p.event,
      problem: p.problem,
      built: p.built,
      metrics: p.metrics,
      stack: p.stack,
      repo: p.repo,
      live: p.live,
    })),
    lab: portfolio.lab,
    achievements: portfolio.achievements.map((a) => a.detail),
  },
  null,
  1,
);

const SYSTEM = `You are Y.A.S.H.U. (Yashika's Autonomous Systems & Hacks Unit), the voice assistant on Yashika Bhatia's portfolio site. Visitors — often recruiters — ask you about her.

Answer ONLY from the facts in <portfolio> below. If the answer is not in the facts, say you don't have that on record and suggest emailing her at ${portfolio.profile.email}. Never invent employers, dates, numbers, skills, links or opinions attributed to her. Never share a phone number.

Style: confident, warm, a little witty, never cringe. Answers are spoken aloud, so keep them to 1–3 short sentences of plain text with no markdown, lists or emoji. Refer to her as Yashika or "she".

<portfolio>
${facts}
</portfolio>`;

export async function GET() {
  return NextResponse.json({ enabled: Boolean(client) });
}

export async function POST(req: Request) {
  if (!client) return NextResponse.json({ error: "llm disabled" }, { status: 404 });

  const limit = rateLimit(`ask:${clientIp(req)}`, 8, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "rate limited" }, { status: 429, headers: { "retry-after": String(limit.retryAfter) } });
  }

  const question = await readText(req, "question", 300);
  if (!question) return NextResponse.json({ error: "question must be 1–300 chars" }, { status: 400 });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const stream = client.beta.messages.stream(
          {
            model: "claude-opus-5-5",
            max_tokens: 1024,
            output_config: { effort: "low" },
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral", ttl: "1h" } }],
            messages: [{ role: "user", content: question }],
          },
          { timeout: 20_000, signal: req.signal },
        );
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("I'll pass on that one. Ask me about her projects or experience instead."));
        }
      } catch (error) {
        const msg =
          error instanceof Anthropic.RateLimitError
            ? "I'm getting a lot of questions right now — try again in a minute."
            : "My uplink dropped. Try one of the suggested commands instead.";
        controller.enqueue(encoder.encode(msg));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}

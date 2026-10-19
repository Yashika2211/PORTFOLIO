import { NextResponse } from "next/server";
import { routeCommand } from "@/lib/assistant";

/**
 * Server-side entry point for the assistant.
 *
 * Today it reuses the keyword router. To plug in an LLM later, read the key
 * from a server-only env var (e.g. process.env.ASSISTANT_API_KEY — never a
 * NEXT_PUBLIC_ one), call the model here, and map its answer to a `Reply`.
 * Set NEXT_PUBLIC_ASSISTANT_LLM=1 so the client calls this route.
 */
export async function POST(req: Request) {
  let input = "";
  try {
    const body = (await req.json()) as { input?: unknown };
    input = typeof body.input === "string" ? body.input.slice(0, 500) : "";
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  return NextResponse.json(routeCommand(input));
}

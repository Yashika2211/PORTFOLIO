"use client";

import { route, type Action } from "./intents";
import { useYashu } from "./store";
import { speakLine, stopSpeaking } from "./voice";
import { startTour } from "./tour";

let llm: boolean | null = null;
async function llmAvailable() {
  if (llm !== null) return llm;
  try {
    const r = await fetch("/api/ask");
    llm = r.ok && ((await r.json()) as { enabled: boolean }).enabled;
  } catch {
    llm = false;
  }
  return llm;
}

/** Stream a free-form answer from /api/ask into the subtitle panel. */
async function askLLM(question: string): Promise<string | null> {
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok || !res.body) return null;
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let text = "";
  const { say } = useYashu.getState();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    text += dec.decode(value, { stream: true });
    say(text, true);
  }
  return text.trim() || null;
}

function cardRect(slug: string) {
  const el = document.querySelector<HTMLElement>(`[data-case="${slug}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

export function perform(action: Action) {
  const s = useYashu.getState();
  switch (action.type) {
    case "scroll":
      s.setCommandOpen(false);
      s.warpTo(action.section);
      break;
    case "openProject":
      s.setCommandOpen(false);
      s.warpTo("projects");
      window.setTimeout(() => s.openCaseFile(action.slug, cardRect(action.slug)), 1300);
      break;
    case "download": {
      const a = document.createElement("a");
      a.href = action.href;
      a.download = "";
      a.click();
      break;
    }
    case "link":
      window.open(action.href, "_blank", "noopener,noreferrer");
      break;
    case "recruiter":
      window.location.href = "/recruiter";
      break;
    case "tour":
      s.setCommandOpen(false);
      startTour();
      break;
    case "stealth":
      s.set({ stealth: !s.stealth, sound: false });
      break;
    case "mute":
      stopSpeaking();
      s.setVoice(false);
      break;
    case "hire":
      s.setCommandOpen(false);
      s.set({ celebrate: s.celebrate + 1 });
      window.setTimeout(() => {
        s.warpTo("contact");
        window.setTimeout(() => document.getElementById("c-name")?.focus({ preventScroll: true }), 1500);
      }, 1600);
      break;
    case "gestures":
      s.set({ gesturePrompt: true });
      break;
  }
}

/** Run a typed or spoken command end to end. Returns the line Y.A.S.H.U. said. */
export async function runCommand(input: string, source: "typed" | "voice" = "typed"): Promise<string> {
  const s = useYashu.getState();
  if (source === "voice") s.unlock("talker", "Talker", "Used a voice command.");

  const r = route(input);
  if (r.intent === "fallback" && input.trim().split(/\s+/).length >= 3 && (await llmAvailable())) {
    try {
      const answer = await askLLM(input);
      if (answer) {
        void speakLine(answer);
        return answer;
      }
    } catch {
      /* fall back to the router's witty line */
    }
  }
  void speakLine(r.line);
  perform(r.action);
  return r.line;
}

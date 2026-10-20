"use client";

import { respond } from "./conversation";
import { type Action } from "./intents";
import { signals } from "./signals";
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
      s.unlock("root", "Root access", "Ran sudo hire yashika.");
      s.set({ celebrate: s.celebrate + 1 });
      window.setTimeout(() => {
        s.warpTo("contact");
        window.setTimeout(() => document.getElementById("c-name")?.focus({ preventScroll: true }), 1500);
      }, 1600);
      break;
    case "gestures":
      s.set({ gesturePrompt: true });
      break;
    case "closeProject":
      s.closeCaseFile();
      break;
    case "voiceSettings":
      s.setCommandOpen(false);
      s.set({ voiceSettings: true });
      break;
  }
}

/** Show reasoning steps while the core spins up — brief, and skipped under reduced motion. */
async function think(steps: string[] | undefined) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!steps?.length || reduced) return;
  const s = useYashu.getState();
  s.set({ mode: "thinking", steps: [] });
  signals.thinking = true;
  for (const step of steps.slice(0, 4)) {
    useYashu.getState().set({ steps: [...useYashu.getState().steps, step] });
    await new Promise((r) => setTimeout(r, 260));
  }
  signals.thinking = false;
  useYashu.getState().set({ mode: "idle", steps: [] });
}

/** Run a typed or spoken command end to end. Returns the line Y.A.S.H.U. said. */
export async function runCommand(input: string, source: "typed" | "voice" = "typed"): Promise<string> {
  const s = useYashu.getState();
  if (source === "voice") s.unlock("talker", "Talker", "Used a voice command.");

  const r = respond(input, { focus: s.focus, section: s.currentSection, openProject: s.openProject });
  if (r.intent === "fallback" && input.trim().split(/\s+/).length >= 3 && (await llmAvailable())) {
    try {
      await think(["consulting the knowledge core"]);
      const answer = await askLLM(input);
      if (answer) {
        void speakLine(answer);
        return answer;
      }
    } catch {
      /* fall back to the router's witty line */
    }
  }
  await think(r.steps);
  if (r.focus !== undefined) useYashu.getState().set({ focus: r.focus });
  if (r.card) {
    useYashu.getState().showCard(r.card);
    // Small screens: the command bar steps aside so the answer card is readable.
    if (window.matchMedia("(max-width: 639px)").matches) useYashu.getState().setCommandOpen(false);
  }
  void speakLine(r.line);
  perform(r.action);
  return r.line;
}

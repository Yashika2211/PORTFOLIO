import { experience, profile, projects, stats } from "@/data/portfolio";
import type { SectionId } from "./types";

/** Y.A.S.H.U.'s personality: confident, slightly witty, never cringe. */

const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];

export function bengaluruNow(date = new Date()) {
  const hm = new Intl.DateTimeFormat("en-GB", { timeZone: profile.timezone, hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  const hour = Number(hm.slice(0, 2));
  return { hm, hour };
}

export function greeting(date = new Date()): string {
  const { hm, hour } = bengaluruNow(date);
  const part = hour < 5 ? "You're up late" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const doing =
    hour < 5
      ? "Yashika is probably debugging something that worked yesterday."
      : hour < 12
        ? "Yashika is probably on her second coffee and first PR."
        : hour < 17
          ? "Yashika is probably deep in a test suite."
          : "Yashika is probably shipping something.";
  return `${part}. Bengaluru time is ${hm} — ${doing}`;
}

export function returningGreeting(lastProject: string | null): string {
  const p = projects.find((x) => x.slug === lastProject);
  return p ? `Welcome back. You were last looking at ${p.title}.` : "Welcome back. Systems remember you.";
}

export const idleNudges = [
  "Still there? Try saying 'open Haggle'.",
  "Quiet in here. Press Ctrl+K or Cmd+K and ask me anything about Yashika.",
  "Tip: say 'take the tour' and I'll fly you through everything in about a minute.",
  "Try 'surprise me' — I'll pick a case file for you.",
];

export const narration: Record<SectionId, string> = {
  hero: "Core online.",
  about: `Operator profile. ${stats.find((s) => s.id === "intern")!.value} months of internships, ${stats.find((s) => s.id === "hack")!.value} hackathon wins.`,
  skills: "Capability matrix. Click a node and I'll trace it to the projects that use it.",
  projects: "Case files. Five missions, ordered by impact.",
  experience: `Mission log. Currently: ${experience[0].role}.`,
  achievements: "Badges. She collects these the hard way.",
  contact: "Comms channel open. She replies faster than her CI pipeline.",
};

export const fallbacks = [
  "That one's outside my training data. Try: {s}.",
  "I parse code, not riddles. Try: {s}.",
  "Interesting. Unrecognised, but interesting. Try: {s}.",
];

export function fallbackLine(suggestions: string[]) {
  return pick(fallbacks).replace("{s}", suggestions.slice(0, 3).map((x) => `"${x}"`).join(", "));
}

export const whoAreYou = `I'm Y.A.S.H.U. — Yashika's Autonomous Systems & Hacks Unit. I run this command center, narrate her work, and open case files on request.`;

export const whoBuiltYou =
  "Yashika built me. Next.js, three.js, a lot of shaders and a deterministic intent router — the same rule she ships everywhere: the model proposes, the code decides.";

export const bestProject = () => {
  const p = projects[0];
  return `If I had to pick one: ${p.title}. An agent-native marketplace where the LLM proposes and a policy engine with ${p.metrics[0].value} test coverage decides.`;
};

export const exitIntent = () => `Leaving already? One more thing — ${projects[0].title}. Two minutes, worth it.`;

export { pick };

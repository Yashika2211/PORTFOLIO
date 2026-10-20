import { profile, projects, skillGroups } from "@/data/portfolio";
import { bestProject, fallbackLine, whoAreYou, whoBuiltYou } from "./lines";
import type { SectionId } from "./types";

/**
 * Pure intent router: text in → { line, action } out. No DOM access, so it is
 * unit-testable and can run on the server as the LLM fallback.
 */

export type Action =
  | { type: "scroll"; section: SectionId }
  | { type: "openProject"; slug: string }
  | { type: "download"; href: string }
  | { type: "link"; href: string }
  | { type: "recruiter" }
  | { type: "tour" }
  | { type: "stealth" }
  | { type: "mute" }
  | { type: "hire" }
  | { type: "gestures" }
  | { type: "closeProject" }
  | { type: "none" };

export type Resolution = { intent: string; line: string; action: Action; confidence: number };

export const SUGGESTIONS = ["show projects", "open Haggle", "take the tour", "skills in AI", "download resume", "surprise me"];

// ---------- fuzzy helpers ----------
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9.+ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Strips the "hey yashu" wake phrase (and common mis-hearings). */
export function stripWake(s: string): { text: string; woke: boolean } {
  const n = normalize(s);
  const m = n.match(/^(hey|hi|ok|okay)?\s*(yashu|yashoo|yasu|yahshu|yeshu|yaashu|yash you)\b\s*/);
  return m ? { text: n.slice(m[0].length).trim(), woke: true } : { text: n, woke: false };
}

export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

function tokenMatches(word: string, target: string): boolean {
  if (word === target) return true;
  if (target.length >= 4 && (word.startsWith(target) || target.startsWith(word)) && word.length >= 4) return true;
  const tol = target.length >= 7 ? 2 : target.length >= 4 ? 1 : 0;
  return tol > 0 && editDistance(word, target) <= tol;
}

/** Fraction of a phrase's tokens found (fuzzily) in the input. */
export function phraseScore(input: string, phrase: string): number {
  const words = input.split(" ");
  const tokens = normalize(phrase).split(" ");
  const hit = tokens.filter((t) => words.some((w) => tokenMatches(w, t))).length;
  return hit / tokens.length;
}

// ---------- intents ----------
type Intent = {
  id: string;
  phrases: string[];
  /** Minimum best-phrase score to fire. */
  threshold?: number;
  resolve: (input: string) => Omit<Resolution, "intent" | "confidence">;
};

const section = (s: SectionId, line: string) => () => ({ line, action: { type: "scroll", section: s } as Action });

const projectAliases = projects.map((p) => ({
  slug: p.slug,
  title: p.title,
  words: [p.slug, p.title, p.subtitle, ...(p.slug === "cashforecastor" ? ["cash forecaster", "finance controller", "forecast"] : []), ...(p.slug === "amazon-ml-2026" ? ["amazon", "entity resolution", "ml challenge"] : []), ...(p.slug === "saans-saathi" ? ["saans", "air quality", "clean air", "school planner"] : [])].map(normalize),
}));

export function findProject(input: string): (typeof projectAliases)[number] | null {
  let best: { p: (typeof projectAliases)[number]; score: number } | null = null;
  for (const p of projectAliases) {
    for (const w of p.words) {
      const score = phraseScore(input, w);
      if (score >= 1 && (!best || score > best.score)) best = { p, score };
      // single distinctive word like "haggel" → haggle
      if (!best && w.split(" ").length === 1 && input.split(" ").some((x) => x.length >= 5 && editDistance(x, w) <= 2)) best = { p, score: 0.9 };
    }
  }
  return best?.p ?? null;
}

/** Every project mentioned in the input, in the order they appear (for comparisons). */
export function findProjects(input: string): (typeof projectAliases)[number][] {
  const hits: { p: (typeof projectAliases)[number]; at: number }[] = [];
  const words = input.split(" ");
  for (const p of projectAliases) {
    let at = -1;
    for (const w of p.words) {
      const parts = w.split(" ");
      if (phraseScore(input, w) >= 1) {
        const i = input.indexOf(parts[0]);
        at = Math.max(at, i < 0 ? 0 : i); // fuzzy matches may not appear verbatim
      }
      else if (parts.length === 1) {
        const i = words.findIndex((x) => x.length >= 5 && editDistance(x, w) <= 2);
        if (i >= 0) at = Math.max(at, input.indexOf(words[i]));
      }
    }
    if (at >= 0) hits.push({ p, at });
  }
  return hits.sort((a, b) => a.at - b.at).map((h) => h.p);
}

const INTENTS: Intent[] = [
  { id: "hire", phrases: ["sudo hire yashika"], threshold: 1, resolve: () => ({ line: "Permission granted. Root access to Yashika's calendar: requested. Opening comms.", action: { type: "hire" } }) },
  { id: "whoBuilt", phrases: ["who built you", "who made you", "who created you"], threshold: 0.99, resolve: () => ({ line: whoBuiltYou, action: { type: "none" } }) },
  { id: "whoAreYou", phrases: ["who are you", "what are you", "your name"], threshold: 0.99, resolve: () => ({ line: whoAreYou, action: { type: "none" } }) },
  { id: "tour", phrases: ["take the tour", "guided tour", "tour", "show me around", "walk me through"], resolve: () => ({ line: "Starting the tour. Sit back — any key or scroll hands control back to you.", action: { type: "tour" } }) },
  { id: "mute", phrases: ["mute", "be quiet", "stop talking", "silence", "shut up"], resolve: () => ({ line: "Muted. Subtitles only.", action: { type: "mute" } }) },
  { id: "stealth", phrases: ["go dark", "stealth mode", "lights out", "dark mode"], resolve: () => ({ line: "Going dark. Ambient systems dimmed.", action: { type: "stealth" } }) },
  { id: "gestures", phrases: ["gesture control", "hand gestures", "enable gestures"], resolve: () => ({ line: "Gesture control needs your camera. Video stays on this device — confirm in the panel.", action: { type: "gestures" } }) },
  {
    id: "surprise",
    phrases: ["surprise me", "random project", "anything", "show me something cool"],
    resolve: () => {
      const p = projects[Math.floor(Math.random() * projects.length)];
      return { line: `Pulling a random case file: ${p.title}.`, action: { type: "openProject", slug: p.slug } };
    },
  },
  {
    id: "best",
    phrases: ["best project", "favourite project", "favorite project", "top project", "proudest"],
    resolve: () => ({ line: bestProject(), action: { type: "openProject", slug: projects[0].slug } }),
  },
  { id: "resume", phrases: ["download resume", "resume", "cv", "download cv"], resolve: () => ({ line: "Downloading Yashika's resume.", action: { type: "download", href: profile.resume } }) },
  { id: "recruiter", phrases: ["skip the show", "recruiter mode", "text version", "plain version"], resolve: () => ({ line: "Recruiter mode. Clean and fast.", action: { type: "recruiter" } }) },
  { id: "github", phrases: ["github", "open github"], threshold: 0.99, resolve: () => ({ line: "Opening GitHub.", action: { type: "link", href: `https://github.com/${profile.githubUser}` } }) },
  { id: "linkedin", phrases: ["linkedin", "open linkedin"], threshold: 0.99, resolve: () => ({ line: "Opening LinkedIn.", action: { type: "link", href: profile.links.find((l) => l.label === "LinkedIn")!.href } }) },
  {
    id: "skillsGroup",
    phrases: ["skills in ai", "ai skills", "ml skills", "machine learning skills", "backend skills", "testing skills", "languages"],
    threshold: 0.99,
    resolve: (input) => {
      const g =
        /\b(ai|ml|machine)\b/.test(input) ? skillGroups.find((x) => x.id === "ai")! : /backend|data/.test(input) ? skillGroups.find((x) => x.id === "backend")! : /test|quality/.test(input) ? skillGroups.find((x) => x.id === "testing")! : skillGroups[0];
      return { line: `${g.label}: ${g.skills.slice(0, 6).join(", ")}${g.skills.length > 6 ? ", and more" : ""}.`, action: { type: "scroll", section: "skills" } };
    },
  },
  { id: "projects", phrases: ["show projects", "projects", "case files", "her work", "portfolio", "what has she built"], resolve: section("projects", "Opening the case files.") },
  { id: "experience", phrases: ["experience", "work history", "internships", "mission log", "jobs", "career"], resolve: section("experience", "Mission log loaded.") },
  { id: "skills", phrases: ["skills", "tech stack", "stack", "what can she do", "technologies"], resolve: section("skills", "Capability matrix.") },
  { id: "about", phrases: ["about", "who is yashika", "about her", "education", "profile"], resolve: section("about", "Operator profile.") },
  { id: "achievements", phrases: ["achievements", "hackathons", "badges", "awards", "wins"], resolve: section("achievements", "Badges, unlocked the hard way.") },
  { id: "contact", phrases: ["contact", "email", "hire her", "get in touch", "reach out", "message"], resolve: section("contact", "Comms channel open.") },
  { id: "home", phrases: ["home", "top", "back to top", "start"], threshold: 0.99, resolve: section("hero", "Back to the core.") },
  { id: "help", phrases: ["help", "what can you do", "commands"], threshold: 0.99, resolve: () => ({ line: `Try: ${SUGGESTIONS.join(", ")}.`, action: { type: "none" } }) },
];

/** Route a typed or spoken phrase to an intent. */
export function route(raw: string): Resolution {
  const { text } = stripWake(raw);
  if (!text) return { intent: "wake", line: "Listening.", action: { type: "none" }, confidence: 1 };

  // Exact-ish easter egg first.
  if (/^sudo hire yashika\b/.test(text)) return { intent: "hire", confidence: 1, ...INTENTS[0].resolve(text) };

  // Project names ("open haggle", "show codenation") beat generic section words.
  const project = findProject(text);
  const generic = INTENTS.map((it) => ({ it, score: Math.max(...it.phrases.map((p) => phraseScore(text, p))) })).sort((a, b) => b.score - a.score)[0];

  if (project && !(generic.score >= 1 && ["best", "surprise", "whoBuilt", "hire"].includes(generic.it.id))) {
    return { intent: "openProject", confidence: 0.95, line: `Opening case file: ${project.title}.`, action: { type: "openProject", slug: project.slug } };
  }
  if (generic && generic.score >= (generic.it.threshold ?? 0.66)) {
    return { intent: generic.it.id, confidence: generic.score, ...generic.it.resolve(text) };
  }
  return { intent: "fallback", confidence: 0, line: fallbackLine(SUGGESTIONS), action: { type: "none" } };
}

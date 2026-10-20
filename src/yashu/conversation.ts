import { experience, profile, projects, sections, skillGroups, stats } from "@/data/portfolio";
import { findProjects, normalize, route, stripWake, type Resolution } from "./intents";
import type { SectionId } from "./types";

/**
 * Conversation layer on top of the intent router: remembers what you were
 * talking about, resolves follow-ups ("what's it built with?", "next one",
 * "compare it with CodeNation") and attaches holographic answer cards.
 * Pure — no DOM — so it is unit-testable.
 */

export type Card =
  | { kind: "project"; slug: string; view: "overview" | "stack" | "numbers" | "problem" }
  | { kind: "compare"; a: string; b: string }
  | { kind: "pitch" }
  | { kind: "briefing" }
  | { kind: "diagnostics" }
  | { kind: "section"; id: SectionId };

export type Context = {
  /** Project currently "in focus" in the conversation. */
  focus: string | null;
  section: SectionId;
  openProject: string | null;
};

export type Reply = Resolution & { card?: Card; focus?: string | null; steps?: string[] };

const has = (t: string, re: RegExp) => re.test(t);
const byslug = (slug: string) => projects.find((p) => p.slug === slug)!;

function pickProject(text: string, ctx: Context) {
  const named = findProjects(text)[0];
  if (named) return named.slug;
  return ctx.openProject ?? ctx.focus;
}

const PRONOUN = /\b(it|that|this|that one|this one|the project)\b/;

export function respond(raw: string, ctx: Context): Reply {
  const { text } = stripWake(raw);
  const t = normalize(text);
  const none = { type: "none" } as const;

  if (!t) return { intent: "wake", line: "I'm listening.", action: none, confidence: 1 };

  // ---------- social ----------
  if (has(t, /^(hi|hello|hey|yo|good (morning|afternoon|evening))\b/) && t.split(" ").length <= 3) {
    return { intent: "hello", line: "Hello. I'm Y.A.S.H.U. — ask me about Yashika's work, or say 'brief me'.", action: none, confidence: 1 };
  }
  if (has(t, /\b(thanks|thank you|cheers|nice|cool|awesome|great)\b/) && t.split(" ").length <= 4) {
    return { intent: "thanks", line: "Anytime. I'll be here — it's literally my job.", action: none, confidence: 1 };
  }

  // ---------- comparisons ----------
  if (has(t, /\b(compare|vs|versus|difference between|better)\b/)) {
    const found = findProjects(t).map((p) => p.slug);
    // Two names: compare them. One name: compare the project in focus against it.
    const current = ctx.openProject ?? ctx.focus;
    const [a, b] = found.length >= 2 ? [found[0], found[1]] : [current, found[0]];
    if (a && b && a !== b) {
      const A = byslug(a);
      const B = byslug(b);
      return {
        intent: "compare",
        line: `${A.title} versus ${B.title}: ${A.metrics[0].value} ${A.metrics[0].label}, against ${B.metrics[0].value} ${B.metrics[0].label}. Side by side on screen.`,
        action: none,
        confidence: 0.95,
        card: { kind: "compare", a, b },
        focus: a,
        steps: ["pulling both case files", "aligning metrics", "rendering comparison"],
      };
    }
  }

  // ---------- follow-ups about a project ----------
  const asksStack = has(t, /\b(stack|built with|tech|technolog|languages?|tools?|framework)\b/);
  const asksNumbers = has(t, /\b(numbers?|metrics?|results?|impact|stats?|score|how (well|good))\b/);
  const asksProblem = has(t, /\b(problem|why did|why build|purpose|what does it do|what is it)\b/);
  const asksMore = has(t, /^(more|tell me more|go on|details?|explain|elaborate|and)\b/) || has(t, /\b(tell me (more|about)|more about|more details)\b/);
  const mentionsProject = findProjects(t).length > 0 || PRONOUN.test(t);

  if ((asksStack || asksNumbers || asksProblem || asksMore) && (mentionsProject || ctx.focus || ctx.openProject)) {
    const slug = pickProject(t, ctx);
    if (slug) {
      const p = byslug(slug);
      if (asksStack) {
        return {
          intent: "projectStack",
          line: `${p.title} runs on ${p.stack.slice(0, 4).join(", ")}${p.stack.length > 4 ? `, plus ${p.stack.length - 4} more` : ""}.`,
          action: none,
          confidence: 0.95,
          card: { kind: "project", slug, view: "stack" },
          focus: slug,
          steps: [`indexing ${p.title} modules`],
        };
      }
      if (asksNumbers) {
        const m = p.metrics.slice(0, 2).map((x) => `${x.value} ${x.label}`).join("; ");
        return {
          intent: "projectNumbers",
          line: `${p.title}, by the numbers: ${m}.`,
          action: none,
          confidence: 0.95,
          card: { kind: "project", slug, view: "numbers" },
          focus: slug,
          steps: ["reading telemetry", `verifying ${p.title} metrics`],
        };
      }
      if (asksProblem) {
        return { intent: "projectProblem", line: p.problem, action: none, confidence: 0.9, card: { kind: "project", slug, view: "problem" }, focus: slug };
      }
      return {
        intent: "projectMore",
        line: `${p.title}: ${p.built[0]}`,
        action: none,
        confidence: 0.9,
        card: { kind: "project", slug, view: "overview" },
        focus: slug,
        steps: [`decrypting case file: ${p.title}`],
      };
    }
  }

  // ---------- open / close / cycle ----------
  if (has(t, /^(open|show|launch|pull up)\b/) && PRONOUN.test(t) && (ctx.focus || ctx.openProject)) {
    const slug = (ctx.focus ?? ctx.openProject)!;
    return { intent: "openFocus", line: `Opening ${byslug(slug).title}.`, action: { type: "openProject", slug }, confidence: 0.95, focus: slug };
  }
  if (has(t, /\b(next|previous|prev|last one|back one|another)\b/) && has(t, /\b(project|one|case|file|next|previous|prev)\b/) && !has(t, /\bsection\b/)) {
    const cur = projects.findIndex((p) => p.slug === (ctx.openProject ?? ctx.focus));
    const dir = has(t, /\b(previous|prev|back one|last one)\b/) ? -1 : 1;
    const nextP = projects[(Math.max(cur, dir > 0 ? -1 : 0) + dir + projects.length) % projects.length];
    return { intent: "cycle", line: `Case file ${projects.indexOf(nextP) + 1} of ${projects.length}: ${nextP.title}.`, action: { type: "openProject", slug: nextP.slug }, confidence: 0.9, focus: nextP.slug };
  }
  if (has(t, /^(close|go back|back|exit|dismiss)\b/) && ctx.openProject) {
    return { intent: "close", line: "Closing the briefing.", action: { type: "closeProject" }, confidence: 1 };
  }

  // ---------- pitch / briefing / awareness ----------
  if (has(t, /\b(why (should|would) (i|we) hire|pitch|sell me|convince me|why her|what makes her)\b/)) {
    const hack = stats.find((s) => s.id === "hack")!.value;
    return {
      intent: "pitch",
      line: `Three reasons: she ships — ${hack} hackathon wins and an agent marketplace with a ${byslug("haggle").metrics[0].value}-tested policy engine. She measures — 35% lower p95 latency and calibrated forecasts. And she has ${stats.find((s) => s.id === "intern")!.value} months of real internship work behind it.`,
      action: none,
      confidence: 0.95,
      card: { kind: "pitch" },
      steps: ["compiling evidence", "ranking by impact"],
    };
  }
  if (has(t, /\b(brief me|briefing|summary|summarise|summarize|highlights|tldr|tl dr|overview|status report)\b/)) {
    return {
      intent: "briefing",
      line: `Briefing: ${profile.headline}. Top case file: ${projects[0].title}. Current role: ${experience[0].role}. Ask for a tour, or any project by name.`,
      action: none,
      confidence: 0.95,
      card: { kind: "briefing" },
      steps: ["collating profile", "selecting highlights"],
    };
  }
  if (has(t, /\b(diagnostics?|scan|system check|systems check|scan me|my device|system status)\b/)) {
    return {
      intent: "diagnostics",
      line: "Running diagnostics on your device. Everything stays local — nothing is sent anywhere.",
      action: none,
      confidence: 1,
      card: { kind: "diagnostics" },
      steps: ["probing display", "probing graphics pipeline", "probing network", "compiling report"],
    };
  }
  if (has(t, /\b(where am i|what am i looking at|what is this( section)?|what s this|current section)\b/)) {
    if (ctx.openProject) {
      const p = byslug(ctx.openProject);
      return { intent: "whereAmI", line: `You're inside the ${p.title} briefing — ${p.subtitle}. Ask for the stack or the numbers.`, action: none, confidence: 1, focus: p.slug };
    }
    const label = sections.find((s) => s.id === ctx.section)!.label;
    const blurb: Record<SectionId, string> = {
      hero: "the core — Yashika's headline and my console",
      about: "her profile and key stats",
      skills: `${skillGroups.length} skill groups — click a node to trace it to projects`,
      projects: `${projects.length} case files ordered by impact`,
      experience: `${experience.length} roles, most recent first`,
      achievements: "hackathon badges and live telemetry",
      contact: "the comms channel",
    };
    return { intent: "whereAmI", line: `This is ${label}: ${blurb[ctx.section]}.`, action: none, confidence: 1, card: { kind: "section", id: ctx.section } };
  }

  // ---------- base router ----------
  const base = route(raw);
  const opened = base.action.type === "openProject" ? base.action.slug : undefined;
  const steps = base.intent === "openProject" || base.intent === "best" || base.intent === "surprise" ? ["locating case file", "decrypting"] : undefined;
  return { ...base, focus: opened ?? ctx.focus, steps };
}

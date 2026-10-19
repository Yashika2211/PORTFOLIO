import { experience, profile, projects, sections, stats } from "@/data/portfolio";

export type SectionId = (typeof sections)[number]["id"];

export type Action =
  | { type: "scroll"; section: SectionId }
  | { type: "openProject"; slug: string }
  | { type: "download"; href: string }
  | { type: "link"; href: string }
  | { type: "recruiter" }
  | { type: "none" };

export type Reply = { text: string; action: Action };

const SECTION_KEYWORDS: [SectionId, RegExp][] = [
  ["projects", /\b(projects?|work|portfolio|case files?|builds?)\b/],
  ["experience", /\b(experience|jobs?|internships?|career|mission log|history)\b/],
  ["skills", /\b(skills?|stack|tech|languages?|tools?)\b/],
  ["about", /\b(about|who|bio|education|college|cgpa|stats?)\b/],
  ["achievements", /\b(achievements?|awards?|hackathons?|badges?|wins?)\b/],
  ["contact", /\b(contact|email|hire|reach|message|comms|talk to)\b/],
  ["hero", /\b(home|top|start|core)\b/],
];

function findProject(q: string) {
  return projects.find((p) => {
    const names = [p.slug, p.title, p.subtitle].map((s) => s.toLowerCase());
    return names.some((n) => q.includes(n) || n.split(/[\s—-]+/).some((w) => w.length > 4 && q.includes(w)));
  });
}

export const SUGGESTIONS = ["show projects", "open Haggle", "experience", "skills", "resume", "contact"];

/** Deterministic keyword router — works offline and with no API keys. */
export function routeCommand(input: string): Reply {
  const q = input.toLowerCase().trim();
  if (!q) return { text: "Awaiting input.", action: { type: "none" } };

  if (/\b(help|commands?|what can you)\b/.test(q)) {
    return { text: `Try: ${SUGGESTIONS.join(" · ")}.`, action: { type: "none" } };
  }
  if (/\b(resume|cv)\b/.test(q)) {
    return { text: "Downloading Yashika's resume.", action: { type: "download", href: profile.resume } };
  }
  if (/\b(skip|recruiter|plain|text version)\b/.test(q)) {
    return { text: "Switching to recruiter mode.", action: { type: "recruiter" } };
  }
  if (/\bgithub\b/.test(q)) {
    return { text: "Opening GitHub.", action: { type: "link", href: `https://github.com/${profile.githubUser}` } };
  }
  if (/\blinkedin\b/.test(q)) {
    const li = profile.links.find((l) => l.label === "LinkedIn")!;
    return { text: "Opening LinkedIn.", action: { type: "link", href: li.href } };
  }

  const project = findProject(q);
  if (project) {
    return {
      text: `Opening case file: ${project.title} — ${project.subtitle}.`,
      action: { type: "openProject", slug: project.slug },
    };
  }

  if (/\b(where|location|based)\b/.test(q)) {
    return { text: `Yashika is based in ${profile.location}.`, action: { type: "scroll", section: "about" } };
  }
  if (/\b(current|now|latest)\b/.test(q) && /\b(role|job|doing)\b/.test(q)) {
    const e = experience[0];
    return { text: `Currently: ${e.role}, ${e.period}.`, action: { type: "scroll", section: "experience" } };
  }

  for (const [id, re] of SECTION_KEYWORDS) {
    if (re.test(q)) {
      const label = sections.find((s) => s.id === id)!.label;
      const extra = id === "achievements" ? ` ${stats.find((s) => s.id === "hack")!.value} hackathon wins on record.` : "";
      return { text: `Navigating to ${label}.${extra}`, action: { type: "scroll", section: id } };
    }
  }

  return {
    text: `I didn't catch that. Try: ${SUGGESTIONS.slice(0, 4).join(", ")}.`,
    action: { type: "none" },
  };
}

/**
 * Resolve a command. If NEXT_PUBLIC_ASSISTANT_LLM is "1", the server route
 * /api/assistant is consulted first (it holds any API key server-side);
 * otherwise, or on any failure, the keyword router answers.
 */
export async function resolveCommand(input: string): Promise<Reply> {
  if (process.env.NEXT_PUBLIC_ASSISTANT_LLM === "1") {
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input }),
      });
      if (res.ok) {
        const data = (await res.json()) as Partial<Reply>;
        if (data.text && data.action) return data as Reply;
      }
    } catch {
      /* fall through to keyword routing */
    }
  }
  return routeCommand(input);
}

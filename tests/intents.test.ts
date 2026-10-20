import { describe, expect, it } from "vitest";
import { editDistance, normalize, route, stripWake } from "@/yashu/intents";

const act = (s: string) => route(s).action;

describe("normalize / stripWake", () => {
  it("lowercases and strips punctuation", () => {
    expect(normalize("  What's HER best project?! ")).toBe("whats her best project");
  });
  it("strips the wake phrase and common mis-hearings", () => {
    expect(stripWake("Hey Yashu, open Haggle")).toEqual({ text: "open haggle", woke: true });
    expect(stripWake("hey yashoo show projects").woke).toBe(true);
    expect(stripWake("show projects").woke).toBe(false);
  });
  it("computes edit distance", () => {
    expect(editDistance("haggle", "haggel")).toBe(2);
    expect(editDistance("tour", "tour")).toBe(0);
  });
});

describe("route — required phrases", () => {
  it.each([
    ["show projects", { type: "scroll", section: "projects" }],
    ["experience", { type: "scroll", section: "experience" }],
    ["skills in AI", { type: "scroll", section: "skills" }],
    ["contact", { type: "scroll", section: "contact" }],
    ["download resume", { type: "download", href: "/Yashika_Bhatia_Resume.pdf" }],
    ["take the tour", { type: "tour" }],
    ["go dark", { type: "stealth" }],
    ["mute", { type: "mute" }],
    ["change voice", { type: "voiceSettings" }],
  ])("%s", (phrase, action) => {
    expect(act(phrase)).toEqual(action);
  });

  it("opens projects by name", () => {
    expect(act("open Haggle")).toEqual({ type: "openProject", slug: "haggle" });
    expect(act("show me codenation")).toEqual({ type: "openProject", slug: "codenation" });
    expect(act("open the cash forecaster")).toEqual({ type: "openProject", slug: "cashforecastor" });
    expect(act("tell me about saans saathi")).toEqual({ type: "openProject", slug: "saans-saathi" });
    expect(act("amazon ml challenge")).toEqual({ type: "openProject", slug: "amazon-ml-2026" });
  });

  it("tolerates typos", () => {
    expect(act("opn haggel")).toEqual({ type: "openProject", slug: "haggle" });
    expect(act("show projcts")).toEqual({ type: "scroll", section: "projects" });
    expect(act("experiance")).toEqual({ type: "scroll", section: "experience" });
  });

  it("answers 'what's her best project' by opening the top project", () => {
    const r = route("what's her best project");
    expect(r.intent).toBe("best");
    expect(r.action).toEqual({ type: "openProject", slug: "haggle" });
  });

  it("surprise me opens some project", () => {
    expect(act("surprise me").type).toBe("openProject");
  });

  it("who are you / who built you", () => {
    expect(route("who are you").intent).toBe("whoAreYou");
    expect(route("Hey Yashu, who built you?").intent).toBe("whoBuilt");
  });

  it("sudo hire yashika easter egg", () => {
    expect(route("sudo hire yashika").action).toEqual({ type: "hire" });
  });

  it("falls back wittily with three suggestions", () => {
    const r = route("what is the airspeed of an unladen swallow");
    expect(r.intent).toBe("fallback");
    expect(r.line.match(/"/g)?.length).toBe(6);
  });

  it("treats a bare wake phrase as listening", () => {
    expect(route("hey yashu").intent).toBe("wake");
  });
});

import { describe, expect, it } from "vitest";
import { respond, type Context } from "@/yashu/conversation";

const ctx = (c: Partial<Context> = {}): Context => ({ focus: null, section: "hero", openProject: null, ...c });

describe("conversation follow-ups", () => {
  it("remembers the project after 'open Haggle'", () => {
    const r = respond("open Haggle", ctx());
    expect(r.action).toEqual({ type: "openProject", slug: "haggle" });
    expect(r.focus).toBe("haggle");
  });

  it("answers 'what's it built with?' about the focused project", () => {
    const r = respond("what's it built with?", ctx({ focus: "haggle" }));
    expect(r.intent).toBe("projectStack");
    expect(r.card).toEqual({ kind: "project", slug: "haggle", view: "stack" });
    expect(r.line).toMatch(/Next\.js/);
  });

  it("answers numbers for the open briefing", () => {
    const r = respond("and the numbers?", ctx({ openProject: "codenation" }));
    expect(r.intent).toBe("projectNumbers");
    expect(r.line).toMatch(/106/);
  });

  it("a named project beats the focus", () => {
    const r = respond("what stack does saans saathi use", ctx({ focus: "haggle" }));
    expect(r.card).toMatchObject({ slug: "saans-saathi" });
  });

  it("'tell me more' expands the focus", () => {
    expect(respond("tell me more", ctx({ focus: "cashforecastor" })).card).toEqual({ kind: "project", slug: "cashforecastor", view: "overview" });
  });

  it("cycles to the next and previous case file", () => {
    expect(respond("next one", ctx({ openProject: "haggle" })).action).toEqual({ type: "openProject", slug: "codenation" });
    expect(respond("previous project", ctx({ openProject: "haggle" })).action).toEqual({ type: "openProject", slug: "amazon-ml-2026" });
    expect(respond("next project", ctx()).action).toEqual({ type: "openProject", slug: "haggle" });
  });

  it("'open it' opens the focus", () => {
    expect(respond("open it", ctx({ focus: "codenation" })).action).toEqual({ type: "openProject", slug: "codenation" });
  });

  it("compares two named projects, or the focus with one", () => {
    expect(respond("compare haggle and codenation", ctx()).card).toEqual({ kind: "compare", a: "haggle", b: "codenation" });
    expect(respond("compare it with codenation", ctx({ focus: "haggle" })).card).toEqual({ kind: "compare", a: "haggle", b: "codenation" });
  });

  it("closes an open briefing", () => {
    expect(respond("close", ctx({ openProject: "haggle" })).action).toEqual({ type: "closeProject" });
  });

  it("pitch, briefing, diagnostics and where-am-I", () => {
    expect(respond("why should I hire her?", ctx()).card).toEqual({ kind: "pitch" });
    expect(respond("brief me", ctx()).card).toEqual({ kind: "briefing" });
    expect(respond("run diagnostics", ctx()).card).toEqual({ kind: "diagnostics" });
    expect(respond("what am I looking at", ctx({ section: "skills" })).line).toMatch(/Skills/);
    expect(respond("where am i", ctx({ openProject: "haggle" })).line).toMatch(/Haggle briefing/);
  });

  it("falls through to the base router", () => {
    expect(respond("show projects", ctx()).action).toEqual({ type: "scroll", section: "projects" });
    expect(respond("hello", ctx()).intent).toBe("hello");
  });
});

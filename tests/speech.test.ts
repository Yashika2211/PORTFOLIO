import { describe, expect, it } from "vitest";
import { chunkSentences, toSpeech } from "@/yashu/speech-text";
import { femaleVoices, isFemaleVoice, rankVoices } from "@/yashu/voices";

describe("toSpeech", () => {
  it("says the assistant's name as a word", () => {
    expect(toSpeech("I'm Y.A.S.H.U. — Yashika's unit.")).toBe("I'm Yashu, Yashika's unit.");
  });
  it("reads metrics and units naturally", () => {
    expect(toSpeech("0.9807 macro F0.5")).toBe("0.9807 macro F half score");
    expect(toSpeech("cut p95 latency 35%")).toBe("cut P 95 latency 35 percent");
    expect(toSpeech("CGPA 8.87/10")).toBe("C G P A 8.87 out of 10");
    expect(toSpeech("500+ problems · 7 wins")).toBe("500 plus problems, 7 wins");
    expect(toSpeech("P10/P50/P90 bands")).toBe("P10, P50 and P90 bands");
  });
  it("fixes product names and acronyms", () => {
    expect(toSpeech("Next.js, FastAPI & LightGBM")).toBe("Next J S, Fast A P I and Light G B M");
    expect(toSpeech("SaansSaathi uses AWS and an LLM")).toBe("Saans Saathi uses A W S and an L L M");
    expect(toSpeech("CodeNation on PostgreSQL")).toBe("Code Nation on Postgres");
  });
  it("drops URLs and emoji", () => {
    expect(toSpeech("Live at https://x.dev ✨ now")).toBe("Live at now");
  });
  it("leaves ordinary words alone", () => {
    expect(toSpeech("She trains models and ships agents.")).toBe("She trains models and ships agents.");
  });
});

describe("chunkSentences", () => {
  it("keeps short text whole and merges short sentences", () => {
    expect(chunkSentences("Hi. I'm Yashu.")).toEqual(["Hi. I'm Yashu."]);
  });
  it("splits long text under the limit", () => {
    const long = "One two three four five, six seven eight nine ten. ".repeat(8).trim();
    const chunks = chunkSentences(long, 80);
    expect(chunks.length).toBeGreaterThan(3);
    expect(chunks.every((c) => c.length <= 80)).toBe(true);
    expect(chunks.join(" ").replace(/\s+/g, " ")).toBe(long.replace(/\s+/g, " "));
  });
});

const v = (name: string, lang = "en-US", localService = true) => ({ name, lang, localService });

describe("female voice ranking", () => {
  it("recognises female voices across platforms and rejects male ones", () => {
    expect(isFemaleVoice(v("Google UK English Female", "en-GB"))).toBe(true);
    expect(isFemaleVoice(v("Microsoft Neerja Online (Natural) - English (India)", "en-IN"))).toBe(true);
    expect(isFemaleVoice(v("Veena", "en-IN"))).toBe(true);
    expect(isFemaleVoice(v("Google US English"))).toBe(true);
    expect(isFemaleVoice(v("Google UK English Male", "en-GB"))).toBe(false);
    expect(isFemaleVoice(v("Rishi", "en-IN"))).toBe(false);
  });

  it("never returns male or novelty voices", () => {
    const ranked = rankVoices([v("Daniel", "en-GB"), v("Rishi", "en-IN"), v("Bubbles"), v("Samantha"), v("Thomas", "fr-FR")]);
    expect(ranked.map((x) => x.name)).toEqual(["Samantha"]);
  });

  it("prefers natural en-IN female voices, then en-GB", () => {
    const pool = [
      v("Samantha"),
      v("Google UK English Female", "en-GB"),
      v("Microsoft Neerja Online (Natural) - English (India)", "en-IN", false),
      v("Microsoft Prabhat Online (Natural) - English (India)", "en-IN", false),
      v("Veena", "en-IN"),
    ];
    expect(femaleVoices(pool).map((x) => x.name)).toEqual([
      "Microsoft Neerja Online (Natural) - English (India)",
      "Veena",
      "Google UK English Female",
      "Samantha",
    ]);
  });
});

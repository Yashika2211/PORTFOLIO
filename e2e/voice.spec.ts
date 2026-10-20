import { expect, test } from "./fixtures";

/** Stub speechSynthesis with a realistic mixed voice list and record what gets spoken. */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const voices = [
      { name: "Daniel", lang: "en-GB", localService: true, default: true, voiceURI: "Daniel" },
      { name: "Rishi", lang: "en-IN", localService: true, default: false, voiceURI: "Rishi" },
      { name: "Bubbles", lang: "en-US", localService: true, default: false, voiceURI: "Bubbles" },
      { name: "Samantha", lang: "en-US", localService: true, default: false, voiceURI: "Samantha" },
      { name: "Google UK English Female", lang: "en-GB", localService: false, default: false, voiceURI: "g-uk-f" },
      { name: "Veena", lang: "en-IN", localService: true, default: false, voiceURI: "Veena" },
    ];
    const spoken: { text: string; voice: string | null; rate: number }[] = [];
    (window as unknown as { __spoken: typeof spoken }).__spoken = spoken;
    let loaded = false;
    const synth = {
      speaking: false,
      paused: false,
      pending: false,
      // Voices arrive asynchronously, like real browsers.
      getVoices: () => (loaded ? voices : []),
      speak(u: SpeechSynthesisUtterance) {
        spoken.push({ text: u.text, voice: u.voice ? u.voice.name : null, rate: u.rate });
        setTimeout(() => u.onstart?.(new Event("start") as SpeechSynthesisEvent), 5);
        setTimeout(() => u.onend?.(new Event("end") as SpeechSynthesisEvent), 30);
      },
      cancel() {},
      pause() {},
      resume() {},
      addEventListener(_: string, cb: () => void) {
        setTimeout(() => {
          loaded = true;
          cb();
        }, 300);
      },
      removeEventListener() {},
    };
    Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
    class FakeUtterance {
      text: string;
      voice: unknown = null;
      lang = "";
      rate = 1;
      pitch = 1;
      volume = 1;
      onstart: ((e: Event) => void) | null = null;
      onend: ((e: Event) => void) | null = null;
      onerror: ((e: Event) => void) | null = null;
      onboundary: ((e: Event) => void) | null = null;
      constructor(t: string) {
        this.text = t;
      }
    }
    Object.defineProperty(window, "SpeechSynthesisUtterance", { value: FakeUtterance, configurable: true });
    // Voice already engaged.
    localStorage.setItem("yashu:state:v1", JSON.stringify({ state: { voice: true, sound: false, lastVisit: 1 }, version: 0 }));
  });
});

const spoken = (page: import("@playwright/test").Page) =>
  page.evaluate(() => (window as unknown as { __spoken: { text: string; voice: string | null; rate: number }[] }).__spoken.filter((s) => s.text.trim()));

test("speaks in the best female voice, never a male one, with pronunciation fixes", async ({ page }) => {
  await page.goto("/");
  await page.locator("button[aria-haspopup=dialog]").click();
  const input = page.getByLabel("Command or question");
  await input.fill("who are you");
  await input.press("Enter");
  await expect.poll(async () => (await spoken(page)).length, { timeout: 10_000 }).toBeGreaterThan(0);
  const lines = await spoken(page);
  expect(lines.every((l) => l.voice === "Veena")).toBe(true);
  const text = lines.map((l) => l.text).join(" ");
  expect(text).toContain("I'm Yashu");
  expect(text).not.toContain("Y.A.S.H.U.");
});

test("long answers are split into sentence-sized chunks", async ({ page }) => {
  await page.goto("/");
  await page.locator("button[aria-haspopup=dialog]").click();
  const input = page.getByLabel("Command or question");
  await input.fill("why should I hire her");
  await input.press("Enter");
  await expect.poll(async () => (await spoken(page)).length, { timeout: 10_000 }).toBeGreaterThan(1);
  for (const l of await spoken(page)) expect(l.text.length).toBeLessThanOrEqual(180);
});

test("the voice picker lists only female voices and remembers the choice", async ({ page }) => {
  await page.goto("/");
  await page.locator("button[aria-haspopup=dialog]").click();
  const input = page.getByLabel("Command or question");
  await input.fill("change voice");
  await input.press("Enter");
  const dialog = page.getByRole("dialog", { name: /voice/i });
  await expect(dialog.getByRole("radio")).toHaveCount(3, { timeout: 10_000 });
  await expect(dialog.getByText("Daniel")).toHaveCount(0);
  await expect(dialog.getByText("Rishi")).toHaveCount(0);
  await dialog.getByRole("radio", { name: /Samantha/ }).check();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("yashu:voice:v1") ?? "{}").name)).toBe("Samantha");
  await expect.poll(async () => (await spoken(page)).some((l) => l.voice === "Samantha")).toBe(true);
});

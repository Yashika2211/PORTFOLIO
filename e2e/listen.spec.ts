import { expect, test } from "./fixtures";

/**
 * Scripted SpeechRecognition stub: each test pushes what the "recogniser"
 * should hear via window.__hear([...alternatives]) or window.__fail(code).
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    type Handler = ((e: unknown) => void) | null;
    const w = window as unknown as Record<string, unknown>;
    w.__gum = 0;
    const md = navigator.mediaDevices;
    if (md) {
      const orig = md.getUserMedia?.bind(md);
      md.getUserMedia = (c?: MediaStreamConstraints) => {
        (w.__gum as number)++;
        return orig ? orig(c) : Promise.reject(new Error("no"));
      };
    }
    class FakeRec {
      static last: FakeRec | null = null;
      lang = "";
      continuous = false;
      interimResults = false;
      maxAlternatives = 1;
      onresult: Handler = null;
      onerror: Handler = null;
      onend: Handler = null;
      onspeechstart: Handler = null;
      onsoundstart: Handler = null;
      onspeechend: Handler = null;
      running = false;
      start() {
        this.running = true;
        FakeRec.last = this;
      }
      stop() {
        this.end();
      }
      abort() {
        this.end();
      }
      end() {
        if (!this.running) return;
        this.running = false;
        setTimeout(() => this.onend?.({}), 10);
      }
    }
    w.webkitSpeechRecognition = FakeRec;
    w.SpeechRecognition = FakeRec;
    w.__hear = (alts: string[]) => {
      const r = FakeRec.last!;
      r.onspeechstart?.({});
      const mk = (final: boolean) => {
        const res = Object.assign(alts.map((t) => ({ transcript: t, confidence: 0.8 })), { isFinal: final });
        return { resultIndex: 0, results: [res] };
      };
      r.onresult?.(mk(false));
      setTimeout(() => {
        r.onresult?.(mk(true));
        if (!r.continuous) r.end();
      }, 400);
    };
    w.__fail = (code: string) => {
      const r = FakeRec.last!;
      r.onerror?.({ error: code });
      r.end();
    };
  });
});

const tapMic = (page: import("@playwright/test").Page) => page.getByRole("button", { name: /Speak to Y\.A\.S\.H\.U\./ }).click();

test("picks the alternative that makes sense and shows a live transcript", async ({ page }) => {
  await page.goto("/");
  await tapMic(page);
  await expect(page.getByText("Listening — speak now…")).toBeVisible();
  await page.evaluate(() => (window as unknown as { __hear: (a: string[]) => void }).__hear(["open Hegel", "open haggle"]));
  await expect(page.getByText("“open Hegel”")).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Haggle" })).toBeVisible({ timeout: 15_000 });
  expect(await page.evaluate(() => (window as unknown as { __gum: number }).__gum)).toBe(0);
});

test("explains a blocked microphone with the fix", async ({ page }) => {
  await page.goto("/");
  await tapMic(page);
  await page.evaluate(() => (window as unknown as { __fail: (c: string) => void }).__fail("not-allowed"));
  await expect(page.getByRole("alert").filter({ hasText: "allow the microphone" })).toBeVisible();
});

test("says so when it hears nothing", async ({ page }) => {
  await page.goto("/");
  await tapMic(page);
  await page.evaluate(() => (window as unknown as { __fail: (c: string) => void }).__fail("no-speech"));
  await expect(page.getByRole("alert").filter({ hasText: "didn't hear anything" })).toBeVisible();
});

test("wake mode accepts a mis-heard 'Hey Yashu'", async ({ page, isMobile }) => {
  test.skip(isMobile, "the Wake toggle lives in the desktop HUD");
  await page.goto("/");
  await page.getByRole("button", { name: /^Wake/ }).click();
  await page.evaluate(() => (window as unknown as { __hear: (a: string[]) => void }).__hear(["hey Joshua show projects"]));
  await expect(page.locator("#projects")).toBeInViewport({ timeout: 15_000 });
});

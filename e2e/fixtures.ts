import { test as base, expect, type Page } from "@playwright/test";

/** Skip the boot sequence and answer the voice prompt (silent) so tests start on the page. */
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      localStorage.setItem("yashu:booted:v1", "1");
      // Software WebGL in CI starves the main thread; behaviour tests run in 2D mode.
      // e2e/webgl.spec.ts covers the 3D stage itself.
      if (!localStorage.getItem("yashu:quality")) localStorage.setItem("yashu:quality", "off");
      localStorage.setItem(
        "yashu:state:v1",
        JSON.stringify({ state: { voice: false, sound: false, visited: [], opened: [], lastProject: null, lastVisit: null, achievements: [] }, version: 0 }),
      );
    });
    // Wait for hydration before any interaction (a pre-hydration click is a no-op).
    const goto = page.goto.bind(page);
    page.goto = async (url, opts) => {
      const res = await goto(url, opts);
      if (!String(url).startsWith("/recruiter")) await page.waitForSelector("html[data-hydrated]", { timeout: 30_000 });
      return res;
    };
    await use(page);
  },
});

export { expect };

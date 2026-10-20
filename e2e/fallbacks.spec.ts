import { expect, test } from "./fixtures";

const webglCanvas = "canvas[data-engine]";

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("skips boot, keeps the 2D core and opens briefings with a fade", async ({ browser }) => {
    // Fresh context without the fixture's boot flag: reduced motion alone must skip the boot.
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/booted/);
    await expect(page.locator(".boot-overlay")).toBeHidden();
    await expect(page.locator(webglCanvas)).toHaveCount(0);
    await expect(page.locator("#hero-title")).toBeVisible();
    await ctx.close();
  });

  test("case files still open", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Open case file: SaansSaathi/ }).click();
    await expect(page.getByRole("dialog", { name: "SaansSaathi" })).toBeVisible();
  });
});

test.describe("no WebGL", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      // @ts-expect-error — narrowing the overloads isn't useful in a stub.
      HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
        if (/webgl/i.test(type)) return null;
        // @ts-expect-error — forwarded as-is.
        return orig.call(this, type, ...rest);
      };
    });
  });

  test("falls back to the 2D experience with the same content", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1500);
    await expect(page.locator(webglCanvas)).toHaveCount(0);
    await expect(page.locator("#hero-title")).toBeVisible();
    for (const id of ["about", "skills", "projects", "experience", "achievements", "contact"]) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
    await page.getByRole("button", { name: /Open case file: Haggle/ }).click();
    await expect(page.getByRole("dialog", { name: "Haggle" })).toBeVisible();
  });
});

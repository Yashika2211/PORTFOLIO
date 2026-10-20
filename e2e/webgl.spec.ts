import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  // Runs before the fixture's default, so this suite gets the real (minimal-tier) 3D stage.
  await page.addInitScript(() => localStorage.setItem("yashu:quality", "low"));
});

test("the WebGL stage mounts after first interaction and crossfades in", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("canvas[data-engine]")).toHaveCount(0);
  await page.mouse.move(400, 300);
  await expect(page.locator("canvas[data-engine]")).toHaveCount(1, { timeout: 20_000 });
  // The 2D core fades out once the first 3D frame is on screen.
  await expect(page.locator("#hero .opacity-0 svg")).toHaveCount(1, { timeout: 20_000 });
});

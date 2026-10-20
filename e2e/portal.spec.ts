import { expect, test } from "./fixtures";

test("case file portal opens, traps focus and returns it on close", async ({ page }) => {
  await page.goto("/");
  const card = page.getByRole("button", { name: /Open case file: CodeNation/ });
  await card.scrollIntoViewIfNeeded();
  await card.click();
  const dialog = page.getByRole("dialog", { name: "CodeNation" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: "Close briefing" })).toBeFocused();
  await expect(dialog.getByText("106", { exact: true })).toBeVisible();

  await page.keyboard.press("Escape");
  // The first click also arms the WebGL stage; software WebGL compiles starve the collapse animation.
  await expect(dialog).toBeHidden({ timeout: 20_000 });
  await expect(card).toBeFocused();
});

test("recruiter mode renders the plain text version", async ({ page }) => {
  await page.goto("/recruiter");
  await expect(page.getByRole("heading", { level: 1, name: "Yashika Bhatia" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Haggle/ })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("home page logs no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.mouse.wheel(0, 3000);
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
});

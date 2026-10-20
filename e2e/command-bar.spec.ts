import { expect, test } from "./fixtures";

test.describe("command bar intents", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#hero-title")).toBeVisible();
  });

  async function ask(page: import("@playwright/test").Page, text: string) {
    if (!(await page.getByRole("dialog", { name: /command bar/i }).isVisible())) {
      await page.getByRole("button", { name: /talk to y\.a\.s\.h\.u\./i }).first().click();
    }
    const input = page.getByLabel("Command or question");
    await input.fill(text);
    await input.press("Enter");
  }

  test("opens with Ctrl/Cmd+K and closes with Escape", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard shortcut is a desktop affordance");
    await page.keyboard.press("Control+k");
    await expect(page.getByRole("dialog", { name: /command bar/i })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: /command bar/i })).toBeHidden();
  });

  test("'open Haggle' opens the Haggle mission briefing", async ({ page }) => {
    await ask(page, "open Haggle");
    const briefing = page.getByRole("dialog", { name: "Haggle" });
    await expect(briefing).toBeVisible({ timeout: 8000 });
    await expect(briefing.getByText("Mandate Firewall", { exact: false })).toBeVisible();
  });

  test("'show projects' navigates to the case files", async ({ page }) => {
    await ask(page, "show projects");
    await expect(page.locator("#projects")).toBeInViewport({ timeout: 8000 });
  });

  test("'who are you' answers in the log", async ({ page }) => {
    await ask(page, "who are you");
    await expect(page.getByRole("dialog", { name: /command bar/i }).getByText(/Autonomous Systems & Hacks Unit/)).toBeVisible();
  });

  test("unknown input gets a witty fallback with suggestions", async ({ page }) => {
    await ask(page, "what is the airspeed of an unladen swallow");
    await expect(page.getByRole("dialog", { name: /command bar/i }).getByText(/Try: "/)).toBeVisible();
  });

  test("'sudo hire yashika' lands on the contact form", async ({ page }) => {
    await ask(page, "sudo hire yashika");
    await expect(page.locator("#contact")).toBeInViewport({ timeout: 10000 });
  });
});

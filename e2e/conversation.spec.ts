import { expect, test } from "./fixtures";

// The first click also arms the WebGL stage; software WebGL in CI starves timers for a while.
const SLOW = { timeout: 20_000 };

async function ask(page: import("@playwright/test").Page, text: string) {
  if (!(await page.getByRole("dialog", { name: /command bar/i }).isVisible())) {
    await page.getByRole("button", { name: /talk to y\.a\.s\.h\.u\./i }).first().click();
  }
  const input = page.getByLabel("Command or question");
  await input.fill(text);
  await input.press("Enter");
}

test("remembers the project across follow-ups", async ({ page }) => {
  await page.goto("/");
  await ask(page, "tell me about codenation");
  const card = page.getByRole("complementary", { name: "Y.A.S.H.U. answer" });
  await expect(card.getByRole("heading", { name: "CodeNation" })).toBeVisible(SLOW);

  await ask(page, "what's it built with?");
  await expect(card.getByText("Judge0")).toBeVisible(SLOW);

  await ask(page, "and the numbers?");
  await expect(card.getByText("106", { exact: true })).toBeVisible(SLOW);
});

test("compares two case files side by side", async ({ page }) => {
  await page.goto("/");
  await ask(page, "compare Haggle and CodeNation");
  const card = page.getByRole("complementary", { name: "Y.A.S.H.U. answer" });
  await expect(card.getByText("Comparison")).toBeVisible(SLOW);
  await expect(card.getByRole("heading", { name: "Haggle" })).toBeVisible();
  await expect(card.getByRole("heading", { name: "CodeNation" })).toBeVisible();
});

test("runs local diagnostics", async ({ page }) => {
  await page.goto("/");
  await ask(page, "run diagnostics");
  const card = page.getByRole("complementary", { name: "Y.A.S.H.U. answer" });
  await expect(card.getByText("display")).toBeVisible(SLOW);
  await expect(card.getByText(/nothing transmitted/)).toBeVisible();
});

test("the dock reflects the assistant's state", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("status").filter({ hasText: /Y\.A\.S\.H\.U\. is online/ })).toHaveCount(1);
});

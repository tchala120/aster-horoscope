import { expect, test } from "@playwright/test";

// Login required (no guest). Register a unique user, then draw + pick + accept.
test("register, draw, pick a card, and accept the mission", async ({ page }) => {
  await page.goto("/draw");

  // Register a fresh account.
  await page.getByRole("button", { name: "Need an account? Register" }).click();
  const username = `seeker_${Date.now()}`;
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Register" }).click();

  // Draw the daily spread.
  await page.getByRole("button", { name: "Draw a Card" }).click();
  await expect(page.getByLabel(/face down/)).toHaveCount(10);

  // Pick a card -> mission assigned -> accept.
  await page.getByLabel(/face down/).first().click();
  await expect(page.getByRole("button", { name: "Accept" })).toBeVisible();
  await page.getByRole("button", { name: "Accept" }).click();
  await expect(page.getByRole("button", { name: "I did it" })).toBeVisible();
});

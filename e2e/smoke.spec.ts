import { expect, test } from "@playwright/test";

test("landing page links to the daily draw", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Draw a Card" })).toBeVisible();
});

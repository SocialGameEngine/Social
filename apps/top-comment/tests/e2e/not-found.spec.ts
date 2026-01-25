import { test, expect } from "@playwright/test";

test("unknown routes render the not found page", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");

  await expect(page.getByRole("heading", { name: /Page not found/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Return home/i })).toBeVisible();
});

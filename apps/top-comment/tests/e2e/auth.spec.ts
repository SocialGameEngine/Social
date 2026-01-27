import { test, expect } from "@playwright/test";

test.describe("Auth page", () => {
  test("toggles between sign in and sign up", async ({ page }) => {
    await page.goto("/auth");

    await expect(page.getByRole("heading", { name: /Welcome Back/i })).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign In/i })).toBeVisible();

    await page
      .getByRole("button", { name: /don't have an account\? sign up/i })
      .click();

    await expect(page.getByRole("heading", { name: /Join Söcial/i })).toBeVisible();
    await expect(page.getByLabel(/Display Name/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign Up/i })).toBeVisible();
  });

  test("guest mode CTA stays available", async ({ page }) => {
    await page.goto("/auth");

    await expect(page.getByRole("button", { name: /Continue as Guest/i })).toBeVisible();
  });
});

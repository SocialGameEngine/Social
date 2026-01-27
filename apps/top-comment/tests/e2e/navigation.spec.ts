import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("navigates between main pages via links", async ({ page }) => {
    await page.goto("/");

    // Navigate to host page
    await page.getByRole("link", { name: /Start a Game/i }).click();
    await expect(page).toHaveURL(/\/host$/);
    await expect(page.getByRole("heading", { name: /Host Console/i })).toBeVisible();

    // Close any open modals by pressing Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // Return home via Back link
    await page.getByRole("link", { name: /Back/i }).click();
    await expect(page).toHaveURL(/\/$/);

    // Navigate to play page
    await page.getByRole("link", { name: /Join a Game/i }).click();
    await expect(page).toHaveURL(/\/play$/);
    await expect(page.getByRole("heading", { name: /Join Söcial/i })).toBeVisible();
  });

  test("auth page is accessible from entry page", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /Sign In \/ Sign Up/i }).click();
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByRole("heading", { name: /Welcome Back/i })).toBeVisible();
  });

  test("browser back button works correctly", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Join a Game/i }).click();
    await expect(page).toHaveURL(/\/play$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: /SÖCIAL/i, level: 1 })).toBeVisible();
  });
});

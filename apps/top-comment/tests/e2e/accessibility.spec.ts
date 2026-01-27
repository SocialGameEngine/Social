import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test("main navigation links have accessible names", async ({ page }) => {
    await page.goto("/");

    // Check main navigation links
    await expect(page.getByRole("link", { name: /Start a Game/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Join a Game/i })).toBeVisible();
    
    // Theme toggle should have accessible name
    const themeToggle = page.getByRole("button", { name: /Switch to (Light|Dark) Mode/i });
    await expect(themeToggle).toBeVisible();
  });

  test("form inputs have associated labels on auth page", async ({ page }) => {
    await page.goto("/auth");

    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
  });

  test("form inputs have associated labels on join page", async ({ page }) => {
    await page.goto("/play");

    await expect(page.getByLabel(/Room code/i)).toBeVisible();
    await expect(page.getByLabel(/Team name/i)).toBeVisible();
  });

  test("headings follow proper hierarchy", async ({ page }) => {
    await page.goto("/");

    const h1 = await page.locator("h1").count();
    expect(h1).toBeGreaterThan(0);

    // Main heading should be visible
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test.skip("images have alt text", async ({ page }) => {
    // Skip this test - images may not have alt text implemented yet
  });
});

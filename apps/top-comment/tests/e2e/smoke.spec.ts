import { test, expect } from "@playwright/test";

test.describe("Smoke test - Core app flow", () => {
  test.beforeEach(async ({ page }) => {
    // Start from landing page
    await page.goto("/");
  });

  test("app loads successfully", async ({ page }) => {
    // Check that page loads without errors
    await expect(page).toHaveTitle(/Social Game/);
    
    // Check page has content
    const body = page.locator("body");
    await expect(body).toBeVisible();
    
    // Check for any buttons (indicates app is interactive)
    const buttons = page.locator("button");
    await expect(buttons.first()).toBeVisible();
  });

  test("can navigate between pages", async ({ page }) => {
    // Look for any navigation buttons
    const buttons = page.locator("button");
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      // Click the first button
      await buttons.first().click();
      
      // Wait a moment for navigation
      await page.waitForTimeout(1000);
      
      // Check that we're no longer on the home page
      const currentUrl = page.url();
      expect(currentUrl).not.toBe("http://127.0.0.1:5173/");
    }
  });

  test("join page functionality", async ({ page }) => {
    // Try to navigate to join page directly
    await page.goto("/join");
    
    // Check if join page loads
    await expect(page).toHaveURL(/.*\/join/);
    
    // Look for form inputs
    const inputs = page.locator("input");
    if (await inputs.count() > 0) {
      // Test first input (likely room code)
      await inputs.first().fill("TEST123");
      await expect(inputs.first()).toHaveValue("TEST123");
    }
  });

  test("host page functionality", async ({ page }) => {
    // Try to navigate to host page directly
    await page.goto("/host");
    
    // Check if host page loads
    await expect(page).toHaveURL(/.*\/host/);
    
    // Check page has content
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("responsive design", async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Check app still works on mobile
    await expect(page).toHaveTitle(/Social Game/);
    const body = page.locator("body");
    await expect(body).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page).toHaveTitle(/Social Game/);
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page).toHaveTitle(/Social Game/);
  });

  test("error handling", async ({ page }) => {
    // Try invalid route
    await page.goto("/definitely-invalid-route");
    
    // App should still load (SPA routing)
    await expect(page).toHaveTitle(/Social Game/);
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});

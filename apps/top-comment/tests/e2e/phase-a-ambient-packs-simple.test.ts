import { test, expect } from "@playwright/test";

test.describe('Phase A - Ambient Packs (AON-3 GAP 4)', () => {
  test('should load the application', async ({ page }) => {
    // Navigate to the app
    await page.goto("/");
    
    // Check that page loads
    await expect(page).toHaveTitle(/Pub Söcial/);
  });

  test('should navigate to join page', async ({ page }) => {
    // Navigate to join page
    await page.goto("/join");
    
    // Check if join page loads
    await expect(page).toHaveURL(/.*\/join/);
  });

  test('should navigate to host page', async ({ page }) => {
    // Navigate to host page
    await page.goto("/host");
    
    // Check if host page loads
    await expect(page).toHaveURL(/.*\/host/);
  });
});

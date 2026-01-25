import { test, expect } from "@playwright/test";

test.describe("Theme toggle", () => {
  test("theme toggle button is accessible on all pages", async ({ page }) => {
    const pages = ["/", "/auth", "/play", "/host", "/presenter"];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      
      const themeToggle = page.getByRole("button", { name: /Switch to (Light|Dark) Mode/i });
      await expect(themeToggle).toBeVisible();
    }
  });

  test("theme toggle button works", async ({ page }) => {
    await page.goto("/");

    // Find the theme toggle
    const themeToggle = page.getByRole("button", { name: /Switch to (Light|Dark) Mode/i });
    await expect(themeToggle).toBeVisible();
    
    // Get current aria-label
    const initialLabel = await themeToggle.getAttribute("aria-label");
    
    // Click to toggle theme
    await themeToggle.click();
    
    // Check that the aria-label changed
    const newLabel = await themeToggle.getAttribute("aria-label");
    expect(newLabel).not.toBe(initialLabel);
  });
});

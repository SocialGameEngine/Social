import { test, expect } from "@playwright/test";

test.describe("Responsive design", () => {
  const viewports = [
    { name: "mobile", width: 375, height: 667 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test(`entry page renders correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");

      await expect(page.getByRole("heading", { name: /SÖCIAL/i, level: 1 })).toBeVisible();
      await expect(page.getByRole("link", { name: /Start a Game/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /Join a Game/i })).toBeVisible();
    });

    test(`auth page renders correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/auth");

      await expect(page.getByRole("heading", { name: /Welcome Back/i })).toBeVisible();
      await expect(page.getByLabel(/Email/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /Sign In/i })).toBeVisible();
    });

    test(`join page renders correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/play");

      await expect(page.getByRole("heading", { name: /Join Söcial/i })).toBeVisible();
      await expect(page.getByLabel(/Room code/i)).toBeVisible();
      await expect(page.getByLabel(/Team name/i)).toBeVisible();
    });
  }
});

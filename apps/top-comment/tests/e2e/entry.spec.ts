import { test, expect } from "@playwright/test";

const landingHeading = /SÖCIAL/i;

test.describe("Landing page", () => {
  test("shows hero content and CTA navigation", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: landingHeading, level: 1 })).toBeVisible();
    await expect(page.getByText(/Söcial Games/i)).toBeVisible();

    await page.getByRole("link", { name: /Join a Game/i }).click();

    await expect(page).toHaveURL(/\/play$/);
    await expect(page.getByRole("heading", { name: /Join Söcial/i })).toBeVisible();
  });

  test("host CTA routes to host tools", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /Start a Game/i }).click();

    await expect(page).toHaveURL(/\/host$/);
    await expect(page.getByRole("heading", { name: /Host Console/i })).toBeVisible();
  });
});

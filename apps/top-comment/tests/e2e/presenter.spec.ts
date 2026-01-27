import { test, expect } from "@playwright/test";

test.describe("Presenter page", () => {
  test("shows 404 page when no session ID provided", async ({ page }) => {
    await page.goto("/presenter");

    // Without a session ID, the route doesn't match and shows 404
    await expect(page.getByRole("heading", { name: /Page not found/i })).toBeVisible();
  });

  test("shows session not found when invalid session ID provided", async ({ page }) => {
    await page.goto("/presenter/invalid-session-id");

    // With an invalid session ID, presenter page loads but shows no session
    await expect(page.getByRole("heading", { name: /Session not found/i })).toBeVisible();
  });

  test("has back to home navigation when session not found", async ({ page }) => {
    await page.goto("/presenter/invalid-session-id");

    const homeLink = page.getByRole("link", { name: /Back to home/i });
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveAttribute("href", "/");
  });
});

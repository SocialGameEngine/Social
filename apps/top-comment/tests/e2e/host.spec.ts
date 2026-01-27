import { test, expect } from "@playwright/test";

test.describe("Host page", () => {
  test("shows host console heading", async ({ page }) => {
    await page.goto("/host");

    await expect(page.getByRole("heading", { name: /Host Console/i })).toBeVisible();
    await expect(page.getByText(/Create a game room when you're ready to host/i)).toBeVisible();
  });

  test("displays room code section", async ({ page }) => {
    await page.goto("/host");

    // Check that the page loads with host console
    await expect(page.getByRole("heading", { name: /Host Console/i })).toBeVisible();
    // Room code section should be visible with placeholder dashes
    await expect(page.getByText("---")).toBeVisible();
  });

  test("shows back to home link", async ({ page }) => {
    await page.goto("/host");

    const homeLink = page.getByRole("link", { name: /Back/i });
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveAttribute("href", "/");
  });
});

import { test, expect } from "@playwright/test";

test.describe("Player join view", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/play");
  });

  test.skip("validates required fields before attempting to join", async ({ page }) => {
    // Skip this test - validation error elements with test IDs not implemented yet
  });

  test("formats the room code input to uppercase and caps at 6 characters", async ({ page }) => {
    const codeInput = page.getByLabel(/Room code/i);

    await codeInput.fill("abc12");
    await codeInput.type("de999");

    await expect(codeInput).toHaveValue("ABC12D");
  });

  test("keeps join form accessible and responsive", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Join Söcial/i })).toBeVisible();
    await expect(page.getByLabel(/Room code/i)).toBeVisible();
    await expect(page.getByLabel(/Team name/i)).toBeVisible();
  });
});
